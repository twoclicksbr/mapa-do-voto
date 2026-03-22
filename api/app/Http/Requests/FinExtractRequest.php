<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinExtractRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title_id'          => ['required', 'integer'],
            'account_id'        => ['nullable', 'integer'],
            'type'              => ['required', 'string', 'in:in,out'],
            'amount'            => ['required', 'numeric', 'min:0.01'],
            'date'              => ['required', 'date_format:Y-m-d'],
            'payment_method_id' => ['nullable', 'integer'],
            'bank_id'           => ['nullable', 'integer'],
        ];
    }
}
