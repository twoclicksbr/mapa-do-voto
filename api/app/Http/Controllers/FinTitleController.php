<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinTitlePayRequest;
use App\Http\Requests\FinTitleRequest;
use App\Models\FinCostCenter;
use App\Models\FinExtract;
use App\Models\FinTitle;
use App\Models\FinWallet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinTitleController extends Controller
{
    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    public function index(Request $request)
    {
        $query = FinTitle::with(['account', 'paymentMethod', 'bank', 'people'])
            ->orderBy('due_date')
            ->orderBy('id');

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('people_id')) {
            $query->where('people_id', $request->people_id);
        }

        if ($request->filled('account_id')) {
            $query->where('account_id', $request->account_id);
        }

        if ($request->filled('bank_id')) {
            $query->where('bank_id', $request->bank_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('due_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('due_date', '<=', $request->date_to);
        }

        $titles = $query->get();

        return response()->json($titles->map(fn ($t) => $this->format($t)));
    }

    public function show(int $id)
    {
        $title = FinTitle::with([
            'account',
            'paymentMethod',
            'bank',
            'people',
            'costCenters.department',
            'originCompositions.destinationTitle',
            'destinationCompositions.originTitle',
        ])->findOrFail($id);

        return response()->json($this->formatDetail($title));
    }

    public function store(FinTitleRequest $request)
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, &$title) {
            $title = FinTitle::create(collect($data)->except('cost_centers')->toArray());
            $this->syncCostCenters($title, $data['cost_centers'] ?? []);
        });

        $title->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);

        return response()->json($this->formatDetail($title), 201);
    }

    public function update(FinTitleRequest $request, int $id)
    {
        $title = FinTitle::findOrFail($id);
        $data  = $request->validated();

        DB::transaction(function () use ($title, $data) {
            $title->update(collect($data)->except('cost_centers')->toArray());
            if (array_key_exists('cost_centers', $data)) {
                $this->syncCostCenters($title, $data['cost_centers'] ?? []);
            }
        });

        $title->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);

        return response()->json($this->formatDetail($title));
    }

    public function destroy(int $id)
    {
        $title = FinTitle::findOrFail($id);
        $title->delete();

        return response()->json(null, 204);
    }

    // -------------------------------------------------------------------------
    // Baixa (pay)
    // -------------------------------------------------------------------------

    public function pay(FinTitlePayRequest $request, int $id)
    {
        $title = FinTitle::findOrFail($id);

        if (in_array($title->status, ['paid', 'cancelled', 'reversed'])) {
            return response()->json(['message' => 'Título não pode ser baixado neste status.'], 422);
        }

        $data       = $request->validated();
        $amountPaid = (float) $data['amount_paid'];
        $netAmount  = (float) $title->amount
                    - (float) ($title->discount ?? 0)
                    + (float) ($title->interest ?? 0);

        DB::transaction(function () use ($title, $data, $amountPaid, $netAmount) {
            $isPartial = $amountPaid < $netAmount;

            $title->update([
                'paid_at'           => $data['paid_at'],
                'amount_paid'       => $amountPaid,
                'payment_method_id' => $data['payment_method_id'] ?? $title->payment_method_id,
                'bank_id'           => $data['bank_id'] ?? $title->bank_id,
                'status'            => $isPartial ? 'partial' : 'paid',
            ]);

            // Gera extrato
            FinExtract::create([
                'title_id'          => $title->id,
                'account_id'        => $title->account_id,
                'type'              => $title->type === 'income' ? 'in' : 'out',
                'amount'            => $amountPaid,
                'date'              => $data['paid_at'],
                'payment_method_id' => $data['payment_method_id'] ?? $title->payment_method_id,
                'bank_id'           => $data['bank_id'] ?? $title->bank_id,
            ]);

            // Atualiza carteira se pagamento excede valor líquido
            if ($amountPaid > $netAmount) {
                $excess = $amountPaid - $netAmount;
                $this->creditWallet($title->people_id, $excess, $title->id);
            }

            // Baixa parcial: gera novo título com saldo restante
            if ($isPartial) {
                $remainder = $netAmount - $amountPaid;
                FinTitle::create([
                    'type'               => $title->type,
                    'description'        => $title->description,
                    'amount'             => $remainder,
                    'due_date'           => $title->due_date,
                    'account_id'         => $title->account_id,
                    'payment_method_id'  => $title->payment_method_id,
                    'bank_id'            => $title->bank_id,
                    'people_id'          => $title->people_id,
                    'installment_number' => $title->installment_number,
                    'installment_total'  => $title->installment_total,
                    'status'             => 'pending',
                ]);
            }
        });

        $title->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);

        return response()->json($this->formatDetail($title));
    }

    // -------------------------------------------------------------------------
    // Estorno (reverse)
    // -------------------------------------------------------------------------

    public function reverse(int $id)
    {
        $title = FinTitle::findOrFail($id);

        if ($title->status === 'reversed') {
            return response()->json(['message' => 'Título já está estornado.'], 422);
        }

        if (!in_array($title->status, ['paid', 'partial'])) {
            return response()->json(['message' => 'Apenas títulos pagos podem ser estornados.'], 422);
        }

        DB::transaction(function () use ($title) {
            $title->update(['status' => 'reversed']);

            $today = now()->format('Y-m-d');

            FinTitle::create([
                'type'              => $title->type === 'income' ? 'expense' : 'income',
                'description'       => 'Estorno: ' . $title->description,
                'amount'            => $title->amount_paid ?? $title->amount,
                'due_date'          => $today,
                'paid_at'           => $today,
                'amount_paid'       => $title->amount_paid ?? $title->amount,
                'account_id'        => $title->account_id,
                'payment_method_id' => $title->payment_method_id,
                'bank_id'           => $title->bank_id,
                'people_id'         => $title->people_id,
                'status'            => 'paid',
            ]);
        });

        $title->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);

        return response()->json($this->formatDetail($title));
    }

    // -------------------------------------------------------------------------
    // Clone
    // -------------------------------------------------------------------------

    public function clone(int $id)
    {
        $title = FinTitle::with('costCenters')->findOrFail($id);

        $clone = DB::transaction(function () use ($title) {
            $clone = FinTitle::create([
                'type'               => $title->type,
                'description'        => $title->description,
                'amount'             => $title->amount,
                'discount'           => $title->discount,
                'interest'           => $title->interest,
                'due_date'           => $title->due_date,
                'installment_number' => $title->installment_number,
                'installment_total'  => $title->installment_total,
                'account_id'         => $title->account_id,
                'payment_method_id'  => $title->payment_method_id,
                'bank_id'            => $title->bank_id,
                'people_id'          => $title->people_id,
                'document_number'    => $title->document_number,
                'pix_key'            => $title->pix_key,
                'status'             => 'pending',
            ]);

            foreach ($title->costCenters as $cc) {
                FinCostCenter::create([
                    'title_id'      => $clone->id,
                    'department_id' => $cc->department_id,
                    'percentage'    => $cc->percentage,
                ]);
            }

            return $clone;
        });

        $clone->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);

        return response()->json($this->formatDetail($clone), 201);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function syncCostCenters(FinTitle $title, array $costCenters): void
    {
        FinCostCenter::where('title_id', $title->id)->delete();

        foreach ($costCenters as $cc) {
            FinCostCenter::create([
                'title_id'      => $title->id,
                'department_id' => $cc['department_id'],
                'percentage'    => $cc['percentage'],
            ]);
        }
    }

    private function creditWallet(int $peopleId, float $amount, int $titleId): void
    {
        $wallet = FinWallet::firstOrNew(['people_id' => $peopleId]);
        $wallet->balance  = (float) ($wallet->balance ?? 0) + $amount;
        $wallet->title_id = $titleId;
        $wallet->save();
    }

    private function format(FinTitle $title): array
    {
        return [
            'id'                 => $title->id,
            'type'               => $title->type,
            'description'        => $title->description,
            'amount'             => (float) $title->amount,
            'discount'           => $title->discount !== null ? (float) $title->discount : null,
            'interest'           => $title->interest !== null ? (float) $title->interest : null,
            'due_date'           => $title->due_date?->format('Y-m-d'),
            'paid_at'            => $title->paid_at?->format('Y-m-d'),
            'amount_paid'        => $title->amount_paid !== null ? (float) $title->amount_paid : null,
            'installment_number' => $title->installment_number,
            'installment_total'  => $title->installment_total,
            'account_id'         => $title->account_id,
            'account_name'       => $title->account?->name,
            'payment_method_id'  => $title->payment_method_id,
            'payment_method_name'=> $title->paymentMethod?->name,
            'bank_id'            => $title->bank_id,
            'bank_name'          => $title->bank?->name,
            'people_id'          => $title->people_id,
            'people_name'        => $title->people?->name,
            'status'             => $title->status,
        ];
    }

    private function formatDetail(FinTitle $title): array
    {
        return array_merge($this->format($title), [
            'document_number' => $title->document_number,
            'invoice_number'  => $title->invoice_number,
            'barcode'         => $title->barcode,
            'pix_key'         => $title->pix_key,
            'cost_centers'    => $title->costCenters->map(fn ($cc) => [
                'id'             => $cc->id,
                'department_id'  => $cc->department_id,
                'department_name'=> $cc->department?->name,
                'percentage'     => (float) $cc->percentage,
            ])->values(),
        ]);
    }
}
