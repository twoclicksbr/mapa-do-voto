<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinBankRequest;
use App\Models\FinBank;

class FinBankController extends Controller
{
    public function index()
    {
        $banks = FinBank::orderBy('order')->get(['id', 'name', 'bank', 'agency', 'account', 'main', 'order', 'active']);

        return response()->json($banks);
    }

    public function store(FinBankRequest $request)
    {
        $bank = FinBank::create($request->validated());

        return response()->json($this->format($bank), 201);
    }

    public function update(FinBankRequest $request, int $id)
    {
        $bank = FinBank::findOrFail($id);
        $bank->update($request->validated());

        return response()->json($this->format($bank));
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
}
