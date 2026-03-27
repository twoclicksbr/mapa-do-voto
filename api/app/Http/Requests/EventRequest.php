<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'people_id'     => ['nullable', 'integer'],
            'people_ids'    => ['nullable', 'array'],
            'people_ids.*'  => ['integer'],
            'event_type_id' => ['nullable', 'integer'],
            'modulo'        => ['nullable', 'string', 'max:255'],
            'name'          => array_merge($id ? ['sometimes'] : [], ['required', 'string', 'max:255']),
            'description'   => ['nullable', 'string'],
            'start_at'      => array_merge($id ? ['sometimes'] : [], ['required', 'date']),
            'end_at'        => ['nullable', 'date', 'after_or_equal:start_at'],
            'all_day'       => ['boolean'],
            'recurrence'    => ['nullable', 'string', 'in:none,daily,weekly,monthly,yearly'],
            'gcal_event_id' => ['nullable', 'string', 'max:255'],
            'active'        => ['boolean'],
        ];
    }
}
