<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TypePeopleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('type_people');

        return [
            'name'   => ['required', 'string', 'max:255', 'unique:gabinete_master.type_people,name' . ($id ? ",{$id}" : '')],
            'order'  => ['integer', 'min:1'],
            'active' => ['boolean'],
        ];
    }
}
