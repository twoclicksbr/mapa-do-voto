<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartmentRequest;
use App\Models\Department;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Department::orderBy('order')->get(['id', 'name', 'order', 'active']);

        return response()->json($departments);
    }

    public function store(DepartmentRequest $request)
    {
        $department = Department::create($request->validated());

        return response()->json($this->format($department), 201);
    }

    public function update(DepartmentRequest $request, int $id)
    {
        $department = Department::findOrFail($id);
        $department->update($request->validated());

        return response()->json($this->format($department));
    }

    public function destroy(int $id)
    {
        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json(null, 204);
    }

    private function format(Department $department): array
    {
        return [
            'id'     => $department->id,
            'name'   => $department->name,
            'order'  => $department->order,
            'active' => $department->active,
        ];
    }
}
