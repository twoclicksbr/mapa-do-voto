<?php

namespace App\Http\Controllers;

use App\Models\People;
use App\Models\User;
use Illuminate\Http\Request;

class PeopleUserController extends Controller
{
    public function show(int $personId)
    {
        People::findOrFail($personId);

        $user = User::where('people_id', $personId)->first();

        if (! $user) {
            return response()->json(null);
        }

        return response()->json($this->format($user));
    }

    public function store(Request $request, int $personId)
    {
        People::findOrFail($personId);

        if (User::where('people_id', $personId)->exists()) {
            return response()->json(['message' => 'Já existe um usuário para esta pessoa.'], 422);
        }

        $request->validate([
            'email'    => 'required|email|unique:gabinete_master.users,email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'people_id' => $personId,
            'email'     => $request->email,
            'password'  => $request->password,
        ]);

        return response()->json($this->format($user), 201);
    }

    public function update(Request $request, int $personId)
    {
        People::findOrFail($personId);

        $user = User::where('people_id', $personId)->firstOrFail();

        $rules = [];

        if ($request->filled('email') && $request->email !== $user->email) {
            $rules['email'] = "required|email|unique:gabinete_master.users,email,{$user->id}";
        }

        if ($request->filled('password')) {
            $rules['password'] = 'required|string|min:8|confirmed';
        }

        if ($rules) {
            $request->validate($rules);
        }

        $data = [];
        if ($request->filled('email'))    $data['email']    = $request->email;
        if ($request->filled('password')) $data['password'] = $request->password;

        if ($data) {
            $user->update($data);
        }

        return response()->json($this->format($user));
    }

    private function format(User $user): array
    {
        return [
            'id'    => $user->id,
            'email' => $user->email,
        ];
    }
}
