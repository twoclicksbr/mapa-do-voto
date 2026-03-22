<?php

namespace App\Http\Controllers;

use App\Models\FinWallet;
use Illuminate\Http\Request;

class FinWalletController extends Controller
{
    public function index(Request $request)
    {
        $query = FinWallet::with(['people', 'title'])
            ->orderBy('people_id');

        if ($request->filled('people_id')) {
            $query->where('people_id', $request->people_id);
        }

        $wallets = $query->get();

        return response()->json($wallets->map(fn ($w) => $this->format($w)));
    }

    public function show(int $peopleId)
    {
        $wallet = FinWallet::with(['people', 'title'])
            ->where('people_id', $peopleId)
            ->first();

        if (!$wallet) {
            return response()->json([
                'people_id'   => $peopleId,
                'balance'     => 0.00,
                'title_id'    => null,
                'title_description' => null,
            ]);
        }

        return response()->json($this->format($wallet));
    }

    private function format(FinWallet $wallet): array
    {
        return [
            'id'                => $wallet->id,
            'people_id'         => $wallet->people_id,
            'people_name'       => $wallet->people?->name,
            'balance'           => (float) $wallet->balance,
            'title_id'          => $wallet->title_id,
            'title_description' => $wallet->title?->description,
            'updated_at'        => $wallet->updated_at?->toISOString(),
        ];
    }
}
