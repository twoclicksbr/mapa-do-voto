<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FinTitleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'type'               => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'in:income,expense']),
            'description'        => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'amount'             => array_merge($id ? ['sometimes'] : [], ['required', 'numeric', 'min:0.01']),
            'discount'           => ['nullable', 'numeric', 'min:0'],
            'interest'           => ['nullable', 'numeric', 'min:0'],
            'due_date'           => array_merge($id ? ['sometimes'] : [], ['required', 'date_format:Y-m-d']),
            'paid_at'            => ['nullable', 'date_format:Y-m-d'],
            'amount_paid'        => ['nullable', 'numeric', 'min:0'],
            'installment_number' => ['nullable', 'integer', 'min:1'],
            'installment_total'  => ['nullable', 'integer', 'min:1'],
            'account_id'         => ['nullable', 'integer'],
            'payment_method_id'  => ['nullable', 'integer'],
            'bank_id'            => ['nullable', 'integer'],
            'people_id'          => array_merge($id ? ['sometimes'] : [], ['required', 'integer']),
            'document_number'    => ['nullable', 'string', 'max:255'],
            'invoice_number'     => ['nullable', 'string', 'max:255'],
            'barcode'            => ['nullable', 'string', 'max:255'],
            'pix_key'            => ['nullable', 'string', 'max:255'],
            'status'             => ['nullable', 'string', 'in:pending,paid,partial,cancelled,reversed'],
            'cost_centers'                   => ['nullable', 'array'],
            'cost_centers.*.department_id'   => ['required', 'integer'],
            'cost_centers.*.percentage'      => ['required', 'numeric', 'between:0.01,100'],
        ];
    }
}
