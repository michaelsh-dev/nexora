<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\StockAdjustmentController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::apiResource('/customers', CustomerController::class);
    Route::apiResource('/suppliers', SupplierController::class);
    Route::apiResource('/categories', CategoryController::class);
    Route::apiResource('/products', ProductController::class);
    Route::apiResource('/warehouses', WarehouseController::class);
    Route::apiResource('/stocks', StockController::class);
    Route::apiResource('/stock-adjustments',StockAdjustmentController::class);
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Nexora API is running',
    ]);
});