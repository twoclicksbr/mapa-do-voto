<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('tenant');

        return [
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['required', 'string', 'max:255', 'unique:gabinete_master.tenants,slug' . ($id ? ",{$id}" : '')],
            'schema'      => ['required', 'string', 'max:255', 'unique:gabinete_master.tenants,schema' . ($id ? ",{$id}" : '')],
            'active'      => ['boolean'],
            'valid_until' => ['required', 'date'],
        ];
    }
}
