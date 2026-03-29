<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinTitlePayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'paid_at'           => ['required', 'date_format:Y-m-d'],
            'amount_paid'       => ['required', 'numeric', 'min:0.01'],
            'account_id'        => ['required', 'integer'],
            'payment_method_id' => ['required', 'integer'],
            'bank_id'           => ['required', 'integer'],
            'interest'          => ['nullable', 'numeric', 'min:0'],
            'multa'             => ['nullable', 'numeric', 'min:0'],
            'discount'          => ['nullable', 'numeric', 'min:0'],
            'excess_action'     => ['nullable', 'in:wallet,change'],
        ];
    }
}
