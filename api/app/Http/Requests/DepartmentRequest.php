<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'name'   => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'order'  => ['integer', 'min:1'],
            'active' => ['boolean'],
        ];
    }
}
