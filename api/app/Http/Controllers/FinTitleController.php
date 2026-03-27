<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinTitlePayRequest;
use App\Http\Requests\FinTitleRequest;
use App\Models\FinCostCenter;
use App\Models\FinExtract;
use App\Models\FinTitle;
use App\Models\FinTitleComposition;
use App\Models\Note;
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
        $data  = $request->validated();
        $title = null;

        DB::transaction(function () use ($data, &$title) {
            $title = FinTitle::create(collect($data)->except('cost_centers')->toArray());
            $this->syncCostCenters($title, $data['cost_centers'] ?? []);
        });

        /** @var FinTitle $title */
        $title->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);

        return response()->json($this->formatDetail($title), 201);
    }

    public function installments(Request $request)
    {
        $request->validate([
            'type'             => 'required|in:income,expense',
            'amount'           => 'required|numeric|min:0.01',
            'issue_date'       => 'required|date_format:Y-m-d',
            'people_id'        => 'required|integer',
            'total'            => 'required|integer|min:2',
            'divide'           => 'required|boolean',
            'interval'         => 'required|integer|min:0',
            'first_due_date'   => 'required|date_format:Y-m-d',
        ]);

        $total        = (int) $request->total;
        $divide       = (bool) $request->divide;
        $baseAmount   = (float) $request->amount;
        $perAmount    = $divide ? floor(($baseAmount / $total) * 100) / 100 : $baseAmount;
        $remainder    = $divide ? round(($baseAmount - $perAmount * $total) * 100) / 100 : 0;
        $interval     = (int) $request->interval;
        $firstDueDate = $request->first_due_date;

        $base = [
            'type'               => $request->type,
            'discount'           => $request->discount,
            'interest'           => $request->interest,
            'multa'              => $request->multa,
            'issue_date'         => $request->issue_date,
            'people_id'          => $request->people_id,
            'account_id'         => $request->account_id,
            'payment_method_id'  => $request->payment_method_id,
            'bank_id'            => $request->bank_id,
            'document_number'    => $request->document_number,
            'barcode'            => $request->barcode,
            'pix_key'            => $request->pix_key,
            'status'             => 'pending',
            'installment_total'  => $total,
        ];

        $costCenters = $request->cost_centers ?? [];

        $titles = DB::transaction(function () use ($base, $total, $perAmount, $remainder, $interval, $firstDueDate, $costCenters) {
            $created = [];

            for ($i = 0; $i < $total; $i++) {
                $d = new \DateTime($firstDueDate);
                $d->modify("+".($i * $interval)." days");

                $amount = ($i === $total - 1 && $remainder !== 0.0)
                    ? $perAmount + $remainder
                    : $perAmount;

                $data = array_merge($base, [
                    'amount'             => $amount,
                    'due_date'           => $d->format('Y-m-d'),
                    'installment_number' => $i + 1,
                ]);

                // Parcelas 2+ recebem invoice_number baseado no ID da primeira
                if ($i > 0) {
                    $baseId = str_pad($created[0]->id, 5, '0', STR_PAD_LEFT);
                    $data['invoice_number'] = "{$baseId}-".($i + 1)."/{$total}";
                }

                $title = FinTitle::create($data);
                $this->syncCostCenters($title, $costCenters);
                $created[] = $title;
            }

            return $created;
        });

        $result = collect($titles)->map(function ($t) {
            $t->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);
            return $this->formatDetail($t);
        });

        return response()->json($result, 201);
    }

    public function update(FinTitleRequest $request, int $id)
    {
        $title         = FinTitle::findOrFail($id);
        $data          = $request->validated();
        $becomeCancelled = isset($data['status']) && $data['status'] === 'cancelled' && $title->status !== 'cancelled';

        DB::transaction(function () use ($title, $data) {
            $title->update(collect($data)->except('cost_centers')->toArray());
            if (array_key_exists('cost_centers', $data)) {
                $this->syncCostCenters($title, $data['cost_centers'] ?? []);
            }
        });

        if ($becomeCancelled) {
            $title->refresh();
            $dateFormatted   = \Carbon\Carbon::parse($title->cancelled_at ?? now())->format('d/m/Y');
            $amountFormatted = 'R$ ' . number_format((float) $title->amount, 2, ',', '.');
            Note::create([
                'modulo'    => 'fin_titles',
                'record_id' => $title->id,
                'value'     => "Título cancelado em {$dateFormatted} no valor de {$amountFormatted}.",
                'order'     => Note::where('modulo', 'fin_titles')->where('record_id', $title->id)->max('order') + 1,
                'active'    => true,
            ]);
        }

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
        $base       = (float) $title->amount;
        $interest   = isset($data['interest']) ? (float) $data['interest'] : (float) ($title->interest ?? 0);
        $multa      = isset($data['multa'])    ? (float) $data['multa']    : (float) ($title->multa    ?? 0);
        $discount   = isset($data['discount']) ? (float) $data['discount'] : (float) ($title->discount ?? 0);
        $netAmount  = round(
                          $base
                        + $base * ($interest / 100)
                        + $base * ($multa    / 100)
                        - $base * ($discount / 100),
                        2
                    );

        $newPartialTitle = null;

        DB::transaction(function () use ($title, $data, $amountPaid, $netAmount, $interest, $multa, $discount, &$newPartialTitle) {
            $isPartial = $amountPaid < $netAmount;

            $title->update([
                'paid_at'           => $data['paid_at'],
                'amount_paid'       => $amountPaid,
                'account_id'        => $data['account_id'] ?? $title->account_id,
                'payment_method_id' => $data['payment_method_id'] ?? $title->payment_method_id,
                'bank_id'           => $data['bank_id'] ?? $title->bank_id,
                'interest'          => $interest,
                'multa'             => $multa,
                'discount'          => $discount,
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
                'source'            => 'baixa',
            ]);

            // Atualiza carteira se pagamento excede valor líquido
            if ($amountPaid > $netAmount) {
                $excess = $amountPaid - $netAmount;
                $this->creditWallet($title->people_id, $excess, $title->id);
            }

            // Baixa parcial: gera novo título com saldo restante
            if ($isPartial) {
                $remainder = $netAmount - $amountPaid;
                $newPartialTitle = FinTitle::create([
                    'type'               => $title->type,
                    'amount'             => $remainder,
                    'issue_date'         => now()->format('Y-m-d'),
                    'due_date'           => $title->due_date,
                    'account_id'         => $data['account_id'] ?? $title->account_id,
                    'payment_method_id'  => $data['payment_method_id'] ?? $title->payment_method_id,
                    'bank_id'            => $data['bank_id'] ?? $title->bank_id,
                    'people_id'          => $title->people_id,
                    'installment_number' => $title->installment_number,
                    'installment_total'  => $title->installment_total,
                    'status'             => 'pending',
                ]);
            }
        });

        // Nota automática
        $title->refresh();
        $dateFormatted   = \Carbon\Carbon::parse($title->paid_at)->format('d/m/Y');
        $amountFormatted = 'R$ ' . number_format((float) $title->amount_paid, 2, ',', '.');
        if ($newPartialTitle) {
            $newPartialTitle->refresh();
            Note::create([
                'modulo'    => 'fin_titles',
                'record_id' => $title->id,
                'value'     => "Título baixado com valor parcial em {$dateFormatted} no valor de {$amountFormatted}. Novo título nº {$newPartialTitle->invoice_number} gerado com o saldo restante.",
                'order'     => Note::where('modulo', 'fin_titles')->where('record_id', $title->id)->max('order') + 1,
                'active'    => true,
            ]);
        } else {
            Note::create([
                'modulo'    => 'fin_titles',
                'record_id' => $title->id,
                'value'     => "Título baixado em {$dateFormatted} no valor de {$amountFormatted}.",
                'order'     => Note::where('modulo', 'fin_titles')->where('record_id', $title->id)->max('order') + 1,
                'active'    => true,
            ]);
        }

        $title->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);

        return response()->json($this->formatDetail($title));
    }

    // -------------------------------------------------------------------------
    // Estorno (reverse)
    // -------------------------------------------------------------------------

    public function reverse(int $id)
    {
        $title = FinTitle::with('costCenters')->findOrFail($id);

        if ($title->status === 'reversed') {
            return response()->json(['message' => 'Título já está estornado.'], 422);
        }

        if (!in_array($title->status, ['paid', 'partial'])) {
            return response()->json(['message' => 'Apenas títulos pagos podem ser estornados.'], 422);
        }

        $clone = null;

        DB::transaction(function () use ($title, &$clone) {
            $title->update(['status' => 'reversed', 'reversed_at' => now()->format('Y-m-d')]);

            $today = now()->format('Y-m-d');

            // Gera extrato inverso do estorno — usa a data da baixa original
            FinExtract::create([
                'title_id'          => $title->id,
                'account_id'        => $title->account_id,
                'type'              => $title->type === 'income' ? 'out' : 'in',
                'amount'            => $title->amount_paid ?? $title->amount,
                'date'              => $title->paid_at?->format('Y-m-d') ?? $today,
                'payment_method_id' => $title->payment_method_id,
                'bank_id'           => $title->bank_id,
                'source'            => 'estorno',
            ]);

            // Clona o título original como pendente para reprocessamento
            $clone = FinTitle::create([
                'type'               => $title->type,
                'amount'             => $title->amount,
                'discount'           => $title->discount,
                'interest'           => $title->interest,
                'multa'              => $title->multa,
                'issue_date'         => $today,
                'due_date'           => $title->due_date,
                'installment_number' => $title->installment_number,
                'installment_total'  => $title->installment_total,
                'account_id'         => $title->account_id,
                'payment_method_id'  => $title->payment_method_id,
                'bank_id'            => $title->bank_id,
                'people_id'          => $title->people_id,
                'document_number'    => $title->document_number,
                'invoice_number'     => $title->invoice_number,
                'barcode'            => $title->barcode,
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
        });

        // Nota automática
        $title->refresh();
        /** @var FinTitle $clone */
        $clone->refresh();
        $dateFormatted   = \Carbon\Carbon::parse($title->reversed_at)->format('d/m/Y');
        $amountFormatted = 'R$ ' . number_format((float) ($title->amount_paid ?? $title->amount), 2, ',', '.');
        Note::create([
            'modulo'    => 'fin_titles',
            'record_id' => $title->id,
            'value'     => "Título estornado em {$dateFormatted} no valor de {$amountFormatted}. Novo título nº {$clone->invoice_number} gerado para reprocessamento.",
            'order'     => Note::where('modulo', 'fin_titles')->where('record_id', $title->id)->max('order') + 1,
            'active'    => true,
        ]);

        Note::create([
            'modulo'    => 'fin_titles',
            'record_id' => $clone->id,
            'value'     => "Título gerado a partir do estorno do título nº {$title->invoice_number} em {$dateFormatted}.",
            'order'     => 1,
            'active'    => true,
        ]);

        $title->load(['account', 'paymentMethod', 'bank', 'people', 'costCenters.department']);

        return response()->json($this->formatDetail($title));
    }

    // -------------------------------------------------------------------------
    // Compose
    // -------------------------------------------------------------------------

    public function compose(Request $request)
    {
        $data = $request->validate([
            'title_ids'      => 'required|array|min:1',
            'title_ids.*'    => 'integer',
            'quantity'       => 'required|integer|min:1',
            'interval'       => 'required|integer|min:0',
            'first_due_date' => 'required|date_format:Y-m-d',
        ]);

        $originals = FinTitle::whereIn('id', $data['title_ids'])
            ->where('status', 'pending')
            ->get();

        if ($originals->count() !== count($data['title_ids'])) {
            return response()->json(['message' => 'Um ou mais títulos não estão pendentes.'], 422);
        }

        $quantity  = (int) $data['quantity'];
        $interval  = (int) $data['interval'];
        $firstDate = $data['first_due_date'];
        $total     = $originals->sum(fn ($t) => (float) $t->amount);
        $ref       = $originals->first();

        $base      = floor(($total / $quantity) * 100) / 100;
        $remainder = round(($total - $base * $quantity) * 100) / 100;

        $newTitles = DB::transaction(function () use ($originals, $quantity, $interval, $firstDate, $total, $base, $remainder, $ref) {
            // Cancela originais
            foreach ($originals as $o) {
                $o->update(['status' => 'cancelled']);
            }

            $created = [];

            for ($i = 0; $i < $quantity; $i++) {
                $amount  = ($i === $quantity - 1) ? $base + $remainder : $base;
                $d = new \DateTime($firstDate);
                $d->modify("+".($i * $interval)." days");
                $dueDate = $d->format('Y-m-d');

                $newTitle = FinTitle::create([
                    'type'               => $ref->type,
                    'description'        => $ref->description,
                    'amount'             => $amount,
                    'issue_date'         => now()->format('Y-m-d'),
                    'due_date'           => $dueDate,
                    'account_id'         => $ref->account_id,
                    'payment_method_id'  => $ref->payment_method_id,
                    'bank_id'            => $ref->bank_id,
                    'people_id'          => $ref->people_id,
                    'installment_number' => $i + 1,
                    'installment_total'  => $quantity,
                    'status'             => 'pending',
                ]);

                // Registra composição
                foreach ($originals as $o) {
                    FinTitleComposition::create([
                        'origin_title_id'      => $o->id,
                        'destination_title_id' => $newTitle->id,
                    ]);
                }

                $created[] = $newTitle;
            }

            return $created;
        });

        $result = collect($newTitles)->map(function ($t) {
            $t->load(['account', 'paymentMethod', 'bank', 'people']);
            return $this->format($t);
        });

        return response()->json($result, 201);
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
                'amount'             => $title->amount,
                'discount'           => $title->discount,
                'interest'           => $title->interest,
                'multa'              => $title->multa,
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
            'amount'             => (float) $title->amount,
            'discount'           => $title->discount !== null ? (float) $title->discount : null,
            'interest'           => $title->interest !== null ? (float) $title->interest : null,
            'multa'              => $title->multa     !== null ? (float) $title->multa     : null,
            'issue_date'         => $title->issue_date?->format('Y-m-d'),
            'due_date'           => $title->due_date?->format('Y-m-d'),
            'paid_at'            => $title->paid_at?->format('Y-m-d'),
            'reversed_at'        => $title->reversed_at?->format('Y-m-d'),
            'cancelled_at'       => $title->cancelled_at?->format('Y-m-d'),
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
            'document_number'    => $title->document_number,
            'invoice_number'     => $title->invoice_number,
            'status'             => $title->status,
        ];
    }

    private function formatDetail(FinTitle $title): array
    {
        // Títulos originais (este é destino de uma composição)
        $origins = $title->destinationCompositions
            ->map(fn ($c) => $c->originTitle)
            ->filter()
            ->map(fn ($t) => $this->format($t))
            ->values();

        // Títulos gerados (este é origem de uma composição)
        $destinations = $title->originCompositions
            ->map(fn ($c) => $c->destinationTitle)
            ->filter()
            ->unique('id')
            ->map(fn ($t) => $this->format($t))
            ->values();

        return array_merge($this->format($title), [
            'document_number'      => $title->document_number,
            'invoice_number'       => $title->invoice_number,
            'barcode'              => $title->barcode,
            'pix_key'              => $title->pix_key,
            'cost_centers'         => $title->costCenters->map(fn ($cc) => [
                'id'             => $cc->id,
                'department_id'  => $cc->department_id,
                'department_name'=> $cc->department?->name,
                'percentage'     => (float) $cc->percentage,
            ])->values(),
            'composition_origins'      => $origins,
            'composition_destinations' => $destinations,
        ]);
    }
}
