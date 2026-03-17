<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PeopleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            'birth_date'     => ['nullable', 'date'],
            'type_people_id' => ['nullable', 'integer', 'exists:type_people,id'],
            'active'         => ['boolean'],
        ];
    }
}
