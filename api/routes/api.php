<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\Map\MapStatsController;
use App\Http\Controllers\StateController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => ['status' => 'ok']);
Route::get('/states/{uf}/geometry', [StateController::class, 'geometry']);

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/candidates', [CandidateController::class, 'index']);
    Route::get('/map/stats', MapStatsController::class);
    Route::get('/candidates/search', [CandidateController::class, 'search']);
    Route::get('/candidacies/{id}/stats', [CandidateController::class, 'stats']);
    Route::get('/candidacies/{id}/cities', [CandidateController::class, 'cities']);
    Route::get('/cities/search', [CityController::class, 'search']);
});
