<?php

namespace App\Http\Controllers;

use App\Models\FinBankBalance;
use Illuminate\Http\Request;

class FinBankBalanceController extends Controller
{
    public function index(int $bankId)
    {
        $balances = FinBankBalance::where('fin_bank_id', $bankId)
            ->orderBy('data', 'desc')
            ->get();

        return response()->json($balances->map(fn ($b) => $this->format($b)));
    }

    public function store(Request $request, int $bankId)
    {
        $data = $request->validate([
            'data'  => ['required', 'date_format:Y-m-d'],
            'valor' => ['required', 'numeric'],
        ]);

        $balance = FinBankBalance::create([
            'fin_bank_id' => $bankId,
            'data'        => $data['data'],
            'valor'       => $data['valor'],
        ]);

        return response()->json($this->format($balance), 201);
    }

    public function update(Request $request, int $bankId, int $id)
    {
        $balance = FinBankBalance::where('fin_bank_id', $bankId)->findOrFail($id);

        $data = $request->validate([
            'data'  => ['sometimes', 'date_format:Y-m-d'],
            'valor' => ['sometimes', 'numeric'],
        ]);

        $balance->update($data);

        return response()->json($this->format($balance));
    }

    public function destroy(int $bankId, int $id)
    {
        $balance = FinBankBalance::where('fin_bank_id', $bankId)->findOrFail($id);
        $balance->delete();

        return response()->json(null, 204);
    }

    private function format(FinBankBalance $b): array
    {
        return [
            'id'          => $b->id,
            'fin_bank_id' => $b->fin_bank_id,
            'data'        => $b->data?->format('Y-m-d'),
            'valor'       => (float) $b->valor,
        ];
    }
}
