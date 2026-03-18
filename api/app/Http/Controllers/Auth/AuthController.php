<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Controllers\PeopleAvatarController;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function tenant(Request $request)
    {
        return response()->json(['tenant' => $request->attributes->get('tenant')]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::with('people')->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Credenciais inválidas.'], 401);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user'  => $this->formatUser($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout realizado com sucesso.']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load('people');
        return response()->json($this->formatUser($user));
    }

    private function formatUser(User $user): array
    {
        $data = $user->toArray();
        if ($user->people) {
            $data['people'] = array_merge(
                $user->people->toArray(),
                PeopleAvatarController::avatarUrls($user->people->photo_path)
            );
        }
        return $data;
    }
}
