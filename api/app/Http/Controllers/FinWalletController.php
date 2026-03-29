<?php

namespace App\Http\Controllers;

use App\Models\FinExtract;
use App\Models\FinWallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinWalletController extends Controller
{
    public function index(Request $request)
    {
        $query = FinWallet::with('people')
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc');

        if ($request->filled('people_id')) {
            $query->where('people_id', $request->people_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $entries = $query->get();

        $totalIn  = $entries->where('type', 'in')->sum(fn ($e) => (float) $e->amount);
        $totalOut = $entries->where('type', 'out')->sum(fn ($e) => (float) $e->amount);

        return response()->json([
            'entries' => $entries->map(fn ($w) => $this->format($w))->values(),
            'summary' => [
                'total_in'  => $totalIn,
                'total_out' => $totalOut,
                'balance'   => $totalIn - $totalOut,
            ],
        ]);
    }

    public function balance(int $peopleId)
    {
        $totalIn  = (float) FinWallet::where('people_id', $peopleId)->where('type', 'in')->sum('amount');
        $totalOut = (float) FinWallet::where('people_id', $peopleId)->where('type', 'out')->sum('amount');

        return response()->json([
            'people_id' => $peopleId,
            'balance'   => round($totalIn - $totalOut, 2),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'people_id'         => ['required', 'integer'],
            'type'              => ['required', 'in:in,out'],
            'amount'            => ['required', 'numeric', 'min:0.01'],
            'date'              => ['required', 'date_format:Y-m-d'],
            'description'       => ['nullable', 'string', 'max:255'],
            'bank_id'           => ['nullable', 'integer'],
            'account_id'        => ['nullable', 'integer'],
            'payment_method_id' => ['nullable', 'integer'],
        ]);

        if ($data['type'] === 'out') {
            $totalIn  = (float) FinWallet::where('people_id', $data['people_id'])->where('type', 'in')->sum('amount');
            $totalOut = (float) FinWallet::where('people_id', $data['people_id'])->where('type', 'out')->sum('amount');
            $balance  = round($totalIn - $totalOut, 2);

            if ((float) $data['amount'] > $balance) {
                return response()->json(['message' => 'Saldo insuficiente na carteira.'], 422);
            }
        }

        $wallet = null;

        DB::transaction(function () use ($data, &$wallet) {
            $wallet = FinWallet::create([
                'people_id'   => $data['people_id'],
                'type'        => $data['type'],
                'amount'      => $data['amount'],
                'date'        => $data['date'],
                'description' => $data['description'] ?? null,
                'source'      => 'manual',
            ]);

            FinExtract::create([
                'title_id'          => null,
                'account_id'        => $data['account_id'] ?? null,
                'type'              => $data['type'],
                'amount'            => $data['amount'],
                'date'              => $data['date'],
                'payment_method_id' => $data['payment_method_id'] ?? null,
                'bank_id'           => $data['bank_id'] ?? null,
                'source'            => 'manual',
            ]);
        });

        /** @var FinWallet $wallet */
        $wallet->load('people');

        return response()->json($this->format($wallet), 201);
    }

    private function format(FinWallet $wallet): array
    {
        return [
            'id'          => $wallet->id,
            'people_id'   => $wallet->people_id,
            'people_name' => $wallet->people?->name,
            'type'        => $wallet->type,
            'amount'      => (float) $wallet->amount,
            'date'        => $wallet->date?->format('Y-m-d'),
            'description' => $wallet->description,
            'title_id'    => $wallet->title_id,
            'source'      => $wallet->source,
            'created_at'  => $wallet->created_at?->toISOString(),
        ];
    }
}
