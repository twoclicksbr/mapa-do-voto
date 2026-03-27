<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinExtractRequest;
use App\Models\FinExtract;
use App\Models\FinBankBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinExtractController extends Controller
{
    public function index(Request $request)
    {
        $query = FinExtract::with(['title.people', 'account', 'paymentMethod', 'bank'])
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('bank_id')) {
            $query->where('bank_id', $request->bank_id);
        }

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->filled('payment_method_id')) {
            $query->where('payment_method_id', $request->payment_method_id);
        }

        $entries = $query->get();

        // Saldo inicial: calculado dinamicamente quando date_from for passado
        $dateFrom = $request->filled('date_from') ? $request->date_from : null;

        if ($request->filled('bank_id')) {
            $bankId = $request->bank_id;

            if ($dateFrom) {
                $lastBalance = FinBankBalance::where('fin_bank_id', $bankId)
                    ->whereDate('data', '<', $dateFrom)
                    ->orderBy('data', 'desc')
                    ->first();

                if ($lastBalance) {
                    $net = FinExtract::where('bank_id', $bankId)
                        ->whereDate('date', '>=', $lastBalance->data->format('Y-m-d'))
                        ->whereDate('date', '<', $dateFrom)
                        ->get()
                        ->sum(fn ($e) => $e->type === 'in' ? (float) $e->amount : -(float) $e->amount);

                    $initialBalance = round((float) $lastBalance->valor + $net, 2);
                } else {
                    $initialBalance = null;
                }
            } else {
                $lastBalance = FinBankBalance::where('fin_bank_id', $bankId)
                    ->orderBy('data', 'desc')
                    ->value('valor');
                $initialBalance = $lastBalance ? (float) $lastBalance : null;
            }
        } else {
            if ($dateFrom) {
                $initialBalance = (float) DB::selectOne("
                    SELECT COALESCE(SUM(saldo), 0) AS total
                    FROM (
                        SELECT
                            b.fin_bank_id,
                            b.valor + COALESCE((
                                SELECT SUM(CASE WHEN e.type = 'in' THEN e.amount ELSE -e.amount END)
                                FROM fin_extract e
                                WHERE e.bank_id = b.fin_bank_id
                                  AND e.date >= b.data
                                  AND e.date < :date_from
                            ), 0) AS saldo
                        FROM fin_bank_balances b
                        INNER JOIN (
                            SELECT fin_bank_id, MAX(data) AS max_data
                            FROM fin_bank_balances
                            WHERE data < :date_from2
                            GROUP BY fin_bank_id
                        ) latest ON b.fin_bank_id = latest.fin_bank_id AND b.data = latest.max_data
                    ) sub
                ", ['date_from' => $dateFrom, 'date_from2' => $dateFrom])->total ?: null;
            } else {
                $initialBalance = (float) DB::selectOne("
                    SELECT COALESCE(SUM(b.valor), 0) AS total
                    FROM fin_bank_balances b
                    INNER JOIN (
                        SELECT fin_bank_id, MAX(data) AS max_data
                        FROM fin_bank_balances
                        GROUP BY fin_bank_id
                    ) latest ON b.fin_bank_id = latest.fin_bank_id AND b.data = latest.max_data
                ")->total ?: null;
            }
        }

        return response()->json([
            'entries'         => $entries->map(fn ($e) => $this->format($e)),
            'initial_balance' => $initialBalance,
        ]);
    }

    public function store(FinExtractRequest $request)
    {
        $data = $request->validated();
        $data['source'] = $data['source'] ?? 'manual';

        $entry = FinExtract::create($data);
        $entry->load(['title', 'account', 'paymentMethod', 'bank']);

        return response()->json($this->format($entry), 201);
    }

    private function format(FinExtract $entry): array
    {
        return [
            'id'                  => $entry->id,
            'title_id'            => $entry->title_id,
            'title_description'   => $entry->title?->description,
            'people_id'           => $entry->title?->people_id,
            'people_name'         => $entry->title?->people?->name,
            'account_id'          => $entry->account_id,
            'account_name'        => $entry->account?->name,
            'type'                => $entry->type,
            'amount'              => (float) $entry->amount,
            'date'                => $entry->date?->format('Y-m-d'),
            'payment_method_id'   => $entry->payment_method_id,
            'payment_method_name' => $entry->paymentMethod?->name,
            'bank_id'             => $entry->bank_id,
            'bank_name'           => $entry->bank?->name,
            'source'              => $entry->source ?? 'manual',
            'created_at'          => $entry->created_at?->toISOString(),
        ];
    }
}
