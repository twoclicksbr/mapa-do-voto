<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinExtractRequest;
use App\Models\FinExtract;
use Illuminate\Http\Request;

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

        return response()->json($entries->map(fn ($e) => $this->format($e)));
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
