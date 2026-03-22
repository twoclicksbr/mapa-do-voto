<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinBankRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'    => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'bank'    => ['nullable', 'string', 'max:255'],
            'agency'  => ['nullable', 'string', 'max:255'],
            'account' => ['nullable', 'string', 'max:255'],
            'main'    => ['boolean'],
            'order'   => ['integer', 'min:1'],
            'active'  => ['boolean'],
        ];
    }
}
