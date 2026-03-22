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
            'payment_method_id' => ['nullable', 'integer'],
            'bank_id'           => ['nullable', 'integer'],
        ];
    }
}
