<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinPaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'                       => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'fin_bank_id'                => ['nullable', 'integer'],
            'fin_payment_method_type_id' => ['nullable', 'integer'],
            'order'                      => ['integer', 'min:1'],
            'active'                     => ['boolean'],
        ];
    }
}
