<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CandidateController;
use App\Http\Controllers\CityController;
use App\Http\Controllers\Map\MapStatsController;
use App\Http\Controllers\StateController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\TypeAddressController;
use App\Http\Controllers\TypeContactController;
use App\Http\Controllers\TypeDocumentController;
use App\Http\Controllers\PeopleController;
use App\Http\Controllers\PersonContactController;
use App\Http\Controllers\PersonAddressController;
use App\Http\Controllers\PersonDocumentController;
use App\Http\Controllers\PersonNoteController;
use App\Http\Controllers\PersonFileController;
use App\Http\Controllers\PeopleAvatarController;
use App\Http\Controllers\PeopleUserController;
use App\Http\Controllers\PersonPermissionController;
use App\Http\Controllers\TypePeopleController;
use App\Http\Controllers\PeopleCandidacyController;
use App\Http\Controllers\PermissionActionController;
use App\Http\Controllers\FinBankController;
use App\Http\Controllers\FinBankBalanceController;
use App\Http\Controllers\FinPaymentMethodController;
use App\Http\Controllers\FinPaymentMethodTypeController;
use App\Http\Controllers\FinExtractController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\FinWalletController;
use App\Http\Controllers\FinTitleController;
use App\Http\Controllers\FinTitleNoteController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\FinAccountController;
use App\Http\Controllers\EventTypeController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PlanController;
use App\Http\Controllers\TenantContactController;
use App\Http\Controllers\TenantAddressController;
use App\Http\Controllers\TenantDocumentController;
use App\Http\Controllers\TenantNoteController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => ['status' => 'ok']);
Route::get('/states/{uf}/geometry', [StateController::class, 'geometry']);
Route::get('/tenants', [TenantController::class, 'index']);

Route::middleware('tenant')->get('/auth/tenant', [AuthController::class, 'tenant']);
Route::middleware('tenant')->post('/auth/login', [AuthController::class, 'login']);

Route::middleware(['tenant', 'auth:sanctum'])->group(function () {
    Route::get('/candidates/search', [CandidateController::class, 'search']);
    Route::get('/map-candidates/search', [CandidateController::class, 'searchPersons']);
    Route::get('/map-candidates/{id}/candidacies', [CandidateController::class, 'candidaciesByPerson']);
    Route::get('/people', [PeopleController::class, 'index']);
    Route::post('/people', [PeopleController::class, 'store']);
    Route::put('/people/{id}', [PeopleController::class, 'update']);
    Route::delete('/people/{id}', [PeopleController::class, 'destroy']);
    Route::post('/people/{id}/avatar', [PeopleAvatarController::class, 'store']);
    Route::delete('/people/{id}/avatar', [PeopleAvatarController::class, 'destroy']);
    Route::get('/people/{personId}/permissions', [PersonPermissionController::class, 'index']);
    Route::put('/people/{personId}/permissions/{actionId}', [PersonPermissionController::class, 'update']);
    Route::post('/people/{personId}/candidacies', [PeopleCandidacyController::class, 'store']);
    Route::get('/people/{personId}/user', [PeopleUserController::class, 'show']);
    Route::post('/people/{personId}/user', [PeopleUserController::class, 'store']);
    Route::put('/people/{personId}/user', [PeopleUserController::class, 'update']);
    Route::get('/people/{personId}/contacts', [PersonContactController::class, 'index']);
    Route::post('/people/{personId}/contacts', [PersonContactController::class, 'store']);
    Route::put('/people/{personId}/contacts/{id}', [PersonContactController::class, 'update']);
    Route::delete('/people/{personId}/contacts/{id}', [PersonContactController::class, 'destroy']);
    Route::get('/people/{personId}/addresses', [PersonAddressController::class, 'index']);
    Route::post('/people/{personId}/addresses', [PersonAddressController::class, 'store']);
    Route::put('/people/{personId}/addresses/{id}', [PersonAddressController::class, 'update']);
    Route::delete('/people/{personId}/addresses/{id}', [PersonAddressController::class, 'destroy']);
    Route::get('/people/{personId}/documents', [PersonDocumentController::class, 'index']);
    Route::post('/people/{personId}/documents', [PersonDocumentController::class, 'store']);
    Route::put('/people/{personId}/documents/{id}', [PersonDocumentController::class, 'update']);
    Route::delete('/people/{personId}/documents/{id}', [PersonDocumentController::class, 'destroy']);
    Route::get('/people/{personId}/notes', [PersonNoteController::class, 'index']);
    Route::post('/people/{personId}/notes', [PersonNoteController::class, 'store']);
    Route::put('/people/{personId}/notes/{id}', [PersonNoteController::class, 'update']);
    Route::delete('/people/{personId}/notes/{id}', [PersonNoteController::class, 'destroy']);
    Route::get('/people/{personId}/files', [PersonFileController::class, 'index']);
    Route::post('/people/{personId}/files', [PersonFileController::class, 'store']);
    Route::get('/people/{personId}/files/{id}/download', [PersonFileController::class, 'download']);
    Route::delete('/people/{personId}/files/{id}', [PersonFileController::class, 'destroy']);
    Route::get('/permission-actions', [PermissionActionController::class, 'index']);
    Route::post('/permission-actions', [PermissionActionController::class, 'store']);
    Route::put('/permission-actions/reorder', [PermissionActionController::class, 'reorder']);
    Route::put('/permission-actions/{id}', [PermissionActionController::class, 'update']);
    Route::delete('/permission-actions/{id}', [PermissionActionController::class, 'destroy']);
    Route::get('/type-people', [TypePeopleController::class, 'index']);
    Route::post('/type-people', [TypePeopleController::class, 'store']);
    Route::put('/type-people/{id}', [TypePeopleController::class, 'update']);
    Route::delete('/type-people/{id}', [TypePeopleController::class, 'destroy']);
    Route::get('/plans', [PlanController::class, 'index']);
    Route::post('/plans', [PlanController::class, 'store']);
    Route::put('/plans/reorder', [PlanController::class, 'reorder']);
    Route::put('/plans/{plan}', [PlanController::class, 'update']);
    Route::delete('/plans/{plan}', [PlanController::class, 'destroy']);
    Route::get('/type-contacts', [TypeContactController::class, 'index']);
    Route::post('/type-contacts', [TypeContactController::class, 'store']);
    Route::put('/type-contacts/{id}', [TypeContactController::class, 'update']);
    Route::delete('/type-contacts/{id}', [TypeContactController::class, 'destroy']);
    Route::get('/type-addresses', [TypeAddressController::class, 'index']);
    Route::post('/type-addresses', [TypeAddressController::class, 'store']);
    Route::put('/type-addresses/{id}', [TypeAddressController::class, 'update']);
    Route::delete('/type-addresses/{id}', [TypeAddressController::class, 'destroy']);
    Route::get('/type-documents', [TypeDocumentController::class, 'index']);
    Route::post('/type-documents', [TypeDocumentController::class, 'store']);
    Route::put('/type-documents/{id}', [TypeDocumentController::class, 'update']);
    Route::delete('/type-documents/{id}', [TypeDocumentController::class, 'destroy']);
    Route::get('/event-types', [EventTypeController::class, 'index']);
    Route::post('/event-types', [EventTypeController::class, 'store']);
    Route::put('/event-types/{id}', [EventTypeController::class, 'update']);
    Route::delete('/event-types/{id}', [EventTypeController::class, 'destroy']);
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{id}', [EventController::class, 'show']);
    Route::post('/events', [EventController::class, 'store']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::post('/tenants', [TenantController::class, 'store']);
    Route::put('/tenants/{id}', [TenantController::class, 'update']);
    Route::get('/tenants/{id}/person', [TenantController::class, 'person']);
    Route::get('/tenants/{id}/people', [TenantController::class, 'people']);
    Route::post('/tenants/{id}/person', [TenantController::class, 'storePerson']);
    Route::post('/tenants/{id}/clients', [TenantController::class, 'storeClient']);
    Route::get('/tenants/{tenantId}/contacts', [TenantContactController::class, 'index']);
    Route::post('/tenants/{tenantId}/contacts', [TenantContactController::class, 'store']);
    Route::put('/tenants/{tenantId}/contacts/{id}', [TenantContactController::class, 'update']);
    Route::delete('/tenants/{tenantId}/contacts/{id}', [TenantContactController::class, 'destroy']);
    Route::get('/tenants/{tenantId}/addresses', [TenantAddressController::class, 'index']);
    Route::post('/tenants/{tenantId}/addresses', [TenantAddressController::class, 'store']);
    Route::put('/tenants/{tenantId}/addresses/{id}', [TenantAddressController::class, 'update']);
    Route::delete('/tenants/{tenantId}/addresses/{id}', [TenantAddressController::class, 'destroy']);
    Route::get('/tenants/{tenantId}/documents', [TenantDocumentController::class, 'index']);
    Route::post('/tenants/{tenantId}/documents', [TenantDocumentController::class, 'store']);
    Route::put('/tenants/{tenantId}/documents/{id}', [TenantDocumentController::class, 'update']);
    Route::delete('/tenants/{tenantId}/documents/{id}', [TenantDocumentController::class, 'destroy']);
    Route::get('/tenants/{tenantId}/notes', [TenantNoteController::class, 'index']);
    Route::post('/tenants/{tenantId}/notes', [TenantNoteController::class, 'store']);
    Route::put('/tenants/{tenantId}/notes/{id}', [TenantNoteController::class, 'update']);
    Route::delete('/tenants/{tenantId}/notes/{id}', [TenantNoteController::class, 'destroy']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/candidates', [CandidateController::class, 'index']);
    Route::get('/map/stats', MapStatsController::class);
    Route::get('/candidacies/{id}/stats', [CandidateController::class, 'stats']);
    Route::get('/candidacies/{id}/cities', [CandidateController::class, 'cities']);
    Route::get('/cities/search', [CityController::class, 'search']);

    // Financeiro — Bancos
    Route::get('/fin-banks', [FinBankController::class, 'index']);
    Route::post('/fin-banks', [FinBankController::class, 'store']);
    Route::put('/fin-banks/{id}', [FinBankController::class, 'update']);
    Route::delete('/fin-banks/{id}', [FinBankController::class, 'destroy']);

    // Financeiro — Saldos de Banco
    Route::get('/fin-banks/{bankId}/balances', [FinBankBalanceController::class, 'index']);
    Route::post('/fin-banks/{bankId}/balances', [FinBankBalanceController::class, 'store']);
    Route::put('/fin-banks/{bankId}/balances/{id}', [FinBankBalanceController::class, 'update']);
    Route::delete('/fin-banks/{bankId}/balances/{id}', [FinBankBalanceController::class, 'destroy']);

    // Financeiro — Tipos de Modalidade de Pagamento
    Route::get('/fin-payment-method-types', [FinPaymentMethodTypeController::class, 'index']);
    Route::post('/fin-payment-method-types', [FinPaymentMethodTypeController::class, 'store']);
    Route::put('/fin-payment-method-types/reorder', [FinPaymentMethodTypeController::class, 'reorder']);
    Route::put('/fin-payment-method-types/{id}', [FinPaymentMethodTypeController::class, 'update']);
    Route::delete('/fin-payment-method-types/{id}', [FinPaymentMethodTypeController::class, 'destroy']);

    // Financeiro — Modalidades de Pagamento
    Route::get('/fin-payment-methods', [FinPaymentMethodController::class, 'index']);
    Route::post('/fin-payment-methods', [FinPaymentMethodController::class, 'store']);
    Route::put('/fin-payment-methods/{id}', [FinPaymentMethodController::class, 'update']);
    Route::delete('/fin-payment-methods/{id}', [FinPaymentMethodController::class, 'destroy']);

    // Financeiro — Extrato
    Route::get('/fin-extract', [FinExtractController::class, 'index']);
    Route::post('/fin-extract', [FinExtractController::class, 'store']);

    // Financeiro — Departamentos
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::put('/departments/{id}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);

    // Financeiro — Carteira
    Route::get('/fin-wallets', [FinWalletController::class, 'index']);
    Route::post('/fin-wallets', [FinWalletController::class, 'store']);
    Route::get('/fin-wallets/balance/{peopleId}', [FinWalletController::class, 'balance']);

    // Financeiro — Contas / Plano de Contas
    Route::get('/fin-accounts', [FinAccountController::class, 'index']);
    Route::post('/fin-accounts', [FinAccountController::class, 'store']);
    Route::put('/fin-accounts/reorder', [FinAccountController::class, 'reorder']);
    Route::put('/fin-accounts/{id}', [FinAccountController::class, 'update']);
    Route::delete('/fin-accounts/{id}', [FinAccountController::class, 'destroy']);

    // Financeiro — Títulos
    Route::get('/fin-titles', [FinTitleController::class, 'index']);
    Route::post('/fin-titles/installments', [FinTitleController::class, 'installments']);
    Route::post('/fin-titles/compose', [FinTitleController::class, 'compose']);
    Route::get('/fin-titles/{id}', [FinTitleController::class, 'show']);
    Route::post('/fin-titles', [FinTitleController::class, 'store']);
    Route::put('/fin-titles/{id}', [FinTitleController::class, 'update']);
    Route::delete('/fin-titles/{id}', [FinTitleController::class, 'destroy']);
    Route::post('/fin-titles/{id}/pay', [FinTitleController::class, 'pay']);
    Route::post('/fin-titles/{id}/reverse', [FinTitleController::class, 'reverse']);
    Route::post('/fin-titles/{id}/clone', [FinTitleController::class, 'clone']);
    Route::get('/fin-titles/{id}/notes', [FinTitleNoteController::class, 'index']);
    Route::post('/fin-titles/{id}/notes', [FinTitleNoteController::class, 'store']);
    Route::delete('/fin-titles/{id}/notes/{noteId}', [FinTitleNoteController::class, 'destroy']);
    Route::get('/files/{modulo}/{recordId}', [FileController::class, 'index']);
    Route::post('/files/{modulo}/{recordId}', [FileController::class, 'store']);
    Route::get('/files/{modulo}/{recordId}/{fileId}/download', [FileController::class, 'download']);
    Route::delete('/files/{modulo}/{recordId}/{fileId}', [FileController::class, 'destroy']);
});
