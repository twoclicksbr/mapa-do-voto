<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('plan');

        return [
            'name'         => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'description'  => ['nullable', 'string'],
            'price_month'  => array_merge($id ? ['sometimes'] : [], ['required', 'numeric', 'min:0']),
            'price_yearly' => array_merge($id ? ['sometimes'] : [], ['required', 'numeric', 'min:0']),
            'price_setup'  => ['nullable', 'numeric', 'min:0'],
            'max_users'    => ['nullable', 'integer', 'min:1'],
            'has_schema'   => ['boolean'],
            'recommended'  => ['boolean'],
            'order'        => ['integer', 'min:1'],
            'active'       => ['boolean'],
        ];
    }
}
