<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EventTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'Este nome já está em uso.',
        ];
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'    => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'max:255', 'unique:event_types,name' . ($id ? ",{$id}" : '')]),
            'color'   => ['required', 'string', 'max:255'],
            'all_day' => ['boolean'],
            'order'   => ['integer', 'min:1'],
            'active'  => ['boolean'],
        ];
    }
}
