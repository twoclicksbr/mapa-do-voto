<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\Map\MapStatsController;
use App\Http\Controllers\StateController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\TypePeopleController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => ['status' => 'ok']);
Route::get('/states/{uf}/geometry', [StateController::class, 'geometry']);
Route::get('/tenants', [TenantController::class, 'index']);

Route::middleware('tenant')->get('/auth/tenant', [AuthController::class, 'tenant']);
Route::middleware('tenant')->post('/auth/login', [AuthController::class, 'login']);

Route::get('/candidates/search', [CandidateController::class, 'search']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/type-people', [TypePeopleController::class, 'index']);
    Route::post('/type-people', [TypePeopleController::class, 'store']);
    Route::put('/type-people/{id}', [TypePeopleController::class, 'update']);
    Route::delete('/type-people/{id}', [TypePeopleController::class, 'destroy']);
    Route::post('/tenants', [TenantController::class, 'store']);
    Route::put('/tenants/{id}', [TenantController::class, 'update']);
    Route::get('/tenants/{id}/person', [TenantController::class, 'person']);
    Route::post('/tenants/{id}/person', [TenantController::class, 'storePerson']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/candidates', [CandidateController::class, 'index']);
    Route::get('/map/stats', MapStatsController::class);
    Route::get('/candidacies/{id}/stats', [CandidateController::class, 'stats']);
    Route::get('/candidacies/{id}/cities', [CandidateController::class, 'cities']);
    Route::get('/cities/search', [CityController::class, 'search']);
});
