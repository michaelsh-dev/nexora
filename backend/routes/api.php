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
use App\Http\Controllers\Api\SalesInvoiceController;
use App\Http\Controllers\Api\SalesReceiptController;
use App\Http\Controllers\Api\SalesOrderController;
use App\Http\Controllers\Api\SalesQuotationController;

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
    Route::apiResource('/stock-adjustments', StockAdjustmentController::class);
    Route::apiResource('/sales-invoices', SalesInvoiceController::class);
    Route::apiResource('/sales-receipts', SalesReceiptController::class);
    Route::apiResource('/sales-orders',SalesOrderController::class);
    Route::apiResource('/sales-quotations', SalesQuotationController::class);
    
});

Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'message' => 'Nexora API is running',
    ]);
});
