<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'parent_id' => ['nullable', 'integer'],
            'code'        => ['nullable', 'string', 'max:50'],
            'name'        => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'description' => ['nullable', 'string'],
            'type'      => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'in:asset,liability,revenue,expense,cost']),
            'nature'    => ['nullable', 'string', 'in:analytic,synthetic'],
            'order'     => ['integer', 'min:1'],
            'active'    => ['boolean'],
        ];
    }
}
