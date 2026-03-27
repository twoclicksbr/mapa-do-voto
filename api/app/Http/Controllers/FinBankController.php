<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinBankRequest;
use App\Models\FinBank;
use App\Models\FinBankBalance;
use App\Models\FinExtract;

class FinBankController extends Controller
{
    public function index()
    {
        $banks = FinBank::orderBy('order')->get(['id', 'name', 'bank', 'agency', 'account', 'main', 'order', 'active']);

        return response()->json($banks->map(fn ($b) => $this->formatWithBalance($b)));
    }

    public function store(FinBankRequest $request)
    {
        $bank = FinBank::create($request->validated());

        return response()->json($this->formatWithBalance($bank), 201);
    }

    public function update(FinBankRequest $request, int $id)
    {
        $bank = FinBank::findOrFail($id);
        $bank->update($request->validated());

        return response()->json($this->formatWithBalance($bank));
    }

    public function destroy(int $id)
    {
        $bank = FinBank::findOrFail($id);
        $bank->delete();

        return response()->json(null, 204);
    }

    private function format(FinBank $bank): array
    {
        return [
            'id'      => $bank->id,
            'name'    => $bank->name,
            'bank'    => $bank->bank,
            'agency'  => $bank->agency,
            'account' => $bank->account,
            'main'    => $bank->main,
            'order'   => $bank->order,
            'active'  => $bank->active,
        ];
    }

    private function formatWithBalance(FinBank $bank): array
    {
        $base = $this->format($bank);

        $lastBalance = FinBankBalance::where('fin_bank_id', $bank->id)
            ->orderBy('data', 'desc')
            ->first();

        if (!$lastBalance) {
            return array_merge($base, [
                'last_balance_data'  => null,
                'last_balance_valor' => null,
                'current_balance'    => null,
            ]);
        }

        $netAfter = FinExtract::where('bank_id', $bank->id)
            ->whereDate('date', '>', $lastBalance->data->format('Y-m-d'))
            ->get()
            ->sum(fn ($e) => $e->type === 'income' ? (float) $e->amount : -(float) $e->amount);

        return array_merge($base, [
            'last_balance_data'  => $lastBalance->data->format('Y-m-d'),
            'last_balance_valor' => (float) $lastBalance->valor,
            'current_balance'    => round((float) $lastBalance->valor + $netAfter, 2),
        ]);
    }
}
