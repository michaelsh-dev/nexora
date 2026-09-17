<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseOrder::with([
            'supplier',
            'purchaseRequest',
            'items.product',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($supplier) use ($search) {
                        $supplier->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(
            $query->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'purchase_request_id' => [
                'nullable',
                'exists:purchase_requests,id'
            ],
            'discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status' => [
                'nullable',
                'in:draft,ordered,received,cancelled'
            ],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],

            'items.*.product_id' => [
                'required',
                'exists:products,id'
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0'
            ],

            'items.*.price' => [
                'required',
                'numeric',
                'min:0'
            ],

            'items.*.discount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100'
            ],
        ]);

        if (!empty($validated['purchase_request_id'])) {
            $purchaseRequest = \App\Models\PurchaseRequest::find(
                $validated['purchase_request_id']
            );

            if (
                $purchaseRequest &&
                $purchaseRequest->supplier_id != $validated['supplier_id']
            ) {
                return response()->json([
                    'message' => 'Supplier PO harus sama dengan supplier Permintaan Pembelian.'
                ], 422);
            }
        }

        return DB::transaction(function () use ($validated) {

            $subtotal = 0;

            foreach ($validated['items'] as $item) {
                $gross = $item['quantity'] * $item['price'];

                $itemDiscount = $item['discount'] ?? 0;

                $discountAmount =
                    $gross * ($itemDiscount / 100);

                $itemSubtotal =
                    $gross - $discountAmount;

                if ($itemSubtotal < 0) {
                    abort(422, 'Diskon item tidak valid.');
                }

                $subtotal += $itemSubtotal;
            }

            $discount = $validated['discount'] ?? 0;
            $taxRate = $validated['tax'] ?? 0;

            $discountAmount =
                $subtotal * ($discount / 100);

            $afterDiscount =
                $subtotal - $discountAmount;

            if ($afterDiscount < 0) {
                abort(422, 'Diskon tidak valid.');
            }

            $taxAmount =
                $afterDiscount * ($taxRate / 100);

            $total =
                $afterDiscount + $taxAmount;

            $lastOrder = PurchaseOrder::latest('id')->first();

            $nextNumber = $lastOrder
                ? $lastOrder->id + 1
                : 1;

            $number =
                'PO-' . str_pad(
                    $nextNumber,
                    6,
                    '0',
                    STR_PAD_LEFT
                );

            $purchaseOrder = PurchaseOrder::create([
                'number' => $number,
                'date' => $validated['date'],
                'supplier_id' => $validated['supplier_id'],
                'purchase_request_id' =>
                    $validated['purchase_request_id'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $taxAmount,
                'total' => $total,
                'status' => $validated['status'] ?? 'draft',
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $gross =
                    $item['quantity'] * $item['price'];

                $itemDiscount =
                    $item['discount'] ?? 0;

                $discountAmount =
                    $gross * ($itemDiscount / 100);

                $itemSubtotal =
                    $gross - $discountAmount;

                $purchaseOrder->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ]);
            }

            return response()->json(
                $purchaseOrder->load([
                    'supplier',
                    'purchaseRequest',
                    'items.product',
                ]),
                201
            );
        });
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        return response()->json(
            $purchaseOrder->load([
                'supplier',
                'purchaseRequest',
                'items.product',
            ])
        );
    }

    public function update(
        Request $request,
        PurchaseOrder $purchaseOrder
    ) {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            'supplier_id' => ['required', 'exists:suppliers,id'],
            'purchase_request_id' => [
                'nullable',
                'exists:purchase_requests,id'
            ],
            'discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'status' => [
                'required',
                'in:draft,ordered,received,cancelled'
            ],
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],

            'items.*.product_id' => [
                'required',
                'exists:products,id'
            ],

            'items.*.quantity' => [
                'required',
                'numeric',
                'gt:0'
            ],

            'items.*.price' => [
                'required',
                'numeric',
                'min:0'
            ],

            'items.*.discount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100'
            ],
        ]);

        if (!empty($validated['purchase_request_id'])) {
            $purchaseRequest = \App\Models\PurchaseRequest::find(
                $validated['purchase_request_id']
            );

            if (
                $purchaseRequest &&
                $purchaseRequest->supplier_id != $validated['supplier_id']
            ) {
                return response()->json([
                    'message' => 'Supplier PO harus sama dengan supplier Permintaan Pembelian.'
                ], 422);
            }
        }

        return DB::transaction(function () use (
            $validated,
            $purchaseOrder
        ) {

            $subtotal = 0;

            foreach ($validated['items'] as $item) {
                $gross =
                    $item['quantity'] * $item['price'];

                $itemDiscount =
                    $item['discount'] ?? 0;

                $discountAmount =
                    $gross * ($itemDiscount / 100);

                $itemSubtotal =
                    $gross - $discountAmount;

                if ($itemSubtotal < 0) {
                    abort(422, 'Diskon item tidak valid.');
                }

                $subtotal += $itemSubtotal;
            }

            $discount = $validated['discount'] ?? 0;
            $taxRate = $validated['tax'] ?? 0;

            $discountAmount =
                $subtotal * ($discount / 100);

            $afterDiscount =
                $subtotal - $discountAmount;

            if ($afterDiscount < 0) {
                abort(422, 'Diskon tidak valid.');
            }

            $taxAmount =
                $afterDiscount * ($taxRate / 100);

            $total =
                $afterDiscount + $taxAmount;

            $purchaseOrder->update([
                'date' => $validated['date'],
                'supplier_id' => $validated['supplier_id'],
                'purchase_request_id' =>
                    $validated['purchase_request_id'] ?? null,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $taxAmount,
                'total' => $total,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $purchaseOrder->items()->delete();

            foreach ($validated['items'] as $item) {
                $gross =
                    $item['quantity'] * $item['price'];

                $itemDiscount =
                    $item['discount'] ?? 0;

                $discountAmount =
                    $gross * ($itemDiscount / 100);

                $itemSubtotal =
                    $gross - $discountAmount;

                $purchaseOrder->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ]);
            }

            return response()->json(
                $purchaseOrder->load([
                    'supplier',
                    'purchaseRequest',
                    'items.product',
                ])
            );
        });
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->delete();

        return response()->json([
            'message' => 'Pesanan Pembelian berhasil dihapus.'
        ]);
    }
}