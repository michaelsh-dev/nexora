<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseInvoice;
use App\Models\PurchaseOrder;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseInvoice::with([
            'supplier',
            'purchaseOrder',
            'warehouse',
            'items.product',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($supplier) use ($search) {
                        $supplier->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where(
                'status',
                $request->status
            );
        }

        return response()->json(
            $query->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],

            'supplier_id' => [
                'required',
                'exists:suppliers,id'
            ],

            'purchase_order_id' => [
                'nullable',
                'exists:purchase_orders,id'
            ],

            'warehouse_id' => [
                'required',
                'exists:warehouses,id'
            ],

            'discount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100'
            ],

            'tax_rate' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100'
            ],

            'status' => [
                'nullable',
                'in:draft,unpaid,partially_paid,paid,cancelled'
            ],

            'notes' => [
                'nullable',
                'string'
            ],

            'items' => [
                'required',
                'array',
                'min:1'
            ],

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

        if (!empty($validated['purchase_order_id'])) {
            $purchaseOrder = PurchaseOrder::find(
                $validated['purchase_order_id']
            );

            if (
                $purchaseOrder &&
                $purchaseOrder->supplier_id !=
                $validated['supplier_id']
            ) {
                return response()->json([
                    'message' =>
                        'Supplier faktur harus sama dengan supplier Pesanan Pembelian.'
                ], 422);
            }
        }

        return DB::transaction(function () use ($validated) {

            $subtotal = 0;

            foreach ($validated['items'] as $item) {
                $gross =
                    $item['quantity'] *
                    $item['price'];

                $itemDiscount =
                    $item['discount'] ?? 0;

                $discountAmount =
                    $gross *
                    ($itemDiscount / 100);

                $itemSubtotal =
                    $gross -
                    $discountAmount;

                if ($itemSubtotal < 0) {
                    abort(
                        422,
                        'Diskon item tidak valid.'
                    );
                }

                $subtotal += $itemSubtotal;
            }

            $discount =
                $validated['discount'] ?? 0;

            $taxRate =
                $validated['tax_rate'] ?? 0;

            $discountAmount =
                $subtotal *
                ($discount / 100);

            $afterDiscount =
                $subtotal -
                $discountAmount;

            if ($afterDiscount < 0) {
                abort(
                    422,
                    'Diskon tidak valid.'
                );
            }

            $taxAmount =
                $afterDiscount *
                ($taxRate / 100);

            $total =
                $afterDiscount +
                $taxAmount;

            $lastInvoice =
                PurchaseInvoice::latest('id')->first();

            $nextNumber =
                $lastInvoice
                    ? $lastInvoice->id + 1
                    : 1;

            $number =
                'PI-' .
                str_pad(
                    $nextNumber,
                    6,
                    '0',
                    STR_PAD_LEFT
                );

            $status =
                $validated['status'] ?? 'unpaid';

            $purchaseInvoice =
                PurchaseInvoice::create([
                    'number' => $number,
                    'date' => $validated['date'],
                    'supplier_id' =>
                        $validated['supplier_id'],
                    'purchase_order_id' =>
                        $validated['purchase_order_id']
                        ?? null,
                    'warehouse_id' =>
                        $validated['warehouse_id'],
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax_rate' => $taxRate,
                    'tax' => $taxAmount,
                    'total' => $total,
                    'status' => $status,
                    'notes' =>
                        $validated['notes']
                        ?? null,
                ]);

            foreach ($validated['items'] as $item) {
                $gross =
                    $item['quantity'] *
                    $item['price'];

                $itemDiscount =
                    $item['discount'] ?? 0;

                $discountAmount =
                    $gross *
                    ($itemDiscount / 100);

                $itemSubtotal =
                    $gross -
                    $discountAmount;

                $purchaseInvoice->items()->create([
                    'product_id' =>
                        $item['product_id'],
                    'quantity' =>
                        $item['quantity'],
                    'price' =>
                        $item['price'],
                    'discount' =>
                        $itemDiscount,
                    'subtotal' =>
                        $itemSubtotal,
                ]);
            }

            /*
             * Stok bertambah jika faktur bukan
             * draft atau cancelled.
             */
            if (
                !in_array(
                    $status,
                    ['draft', 'cancelled']
                )
            ) {
                $this->increaseStock(
                    $purchaseInvoice
                );
            }

            return response()->json(
                $purchaseInvoice->load([
                    'supplier',
                    'purchaseOrder',
                    'warehouse',
                    'items.product',
                ]),
                201
            );
        });
    }

    public function show(
        PurchaseInvoice $purchaseInvoice
    ) {
        return response()->json(
            $purchaseInvoice->load([
                'supplier',
                'purchaseOrder',
                'warehouse',
                'items.product',
            ])
        );
    }

    public function update(
        Request $request,
        PurchaseInvoice $purchaseInvoice
    ) {
        $validated = $request->validate([
            'date' => ['required', 'date'],

            'supplier_id' => [
                'required',
                'exists:suppliers,id'
            ],

            'purchase_order_id' => [
                'nullable',
                'exists:purchase_orders,id'
            ],

            'warehouse_id' => [
                'required',
                'exists:warehouses,id'
            ],

            'discount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100'
            ],

            'tax_rate' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100'
            ],

            'status' => [
                'required',
                'in:draft,unpaid,partially_paid,paid,cancelled'
            ],

            'notes' => [
                'nullable',
                'string'
            ],

            'items' => [
                'required',
                'array',
                'min:1'
            ],

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

        if (!empty($validated['purchase_order_id'])) {
            $purchaseOrder = PurchaseOrder::find(
                $validated['purchase_order_id']
            );

            if (
                $purchaseOrder &&
                $purchaseOrder->supplier_id !=
                $validated['supplier_id']
            ) {
                return response()->json([
                    'message' =>
                        'Supplier faktur harus sama dengan supplier Pesanan Pembelian.'
                ], 422);
            }
        }

        return DB::transaction(function () use (
            $validated,
            $purchaseInvoice
        ) {

            /*
             * Kalau invoice lama sudah menambah stok,
             * kembalikan dulu stok lamanya.
             */
            if (
                !in_array(
                    $purchaseInvoice->status,
                    ['draft', 'cancelled']
                )
            ) {
                $this->decreaseStock(
                    $purchaseInvoice
                );
            }

            $subtotal = 0;

            foreach ($validated['items'] as $item) {
                $gross =
                    $item['quantity'] *
                    $item['price'];

                $itemDiscount =
                    $item['discount'] ?? 0;

                $discountAmount =
                    $gross *
                    ($itemDiscount / 100);

                $itemSubtotal =
                    $gross -
                    $discountAmount;

                if ($itemSubtotal < 0) {
                    abort(
                        422,
                        'Diskon item tidak valid.'
                    );
                }

                $subtotal += $itemSubtotal;
            }

            $discount =
                $validated['discount'] ?? 0;

            $taxRate =
                $validated['tax_rate'] ?? 0;

            $discountAmount =
                $subtotal *
                ($discount / 100);

            $afterDiscount =
                $subtotal -
                $discountAmount;

            if ($afterDiscount < 0) {
                abort(
                    422,
                    'Diskon tidak valid.'
                );
            }

            $taxAmount =
                $afterDiscount *
                ($taxRate / 100);

            $total =
                $afterDiscount +
                $taxAmount;

            $purchaseInvoice->update([
                'date' =>
                    $validated['date'],

                'supplier_id' =>
                    $validated['supplier_id'],

                'purchase_order_id' =>
                    $validated['purchase_order_id']
                    ?? null,

                'warehouse_id' =>
                    $validated['warehouse_id'],

                'subtotal' =>
                    $subtotal,

                'discount' =>
                    $discount,

                'tax_rate' =>
                    $taxRate,

                'tax' =>
                    $taxAmount,

                'total' =>
                    $total,

                'status' =>
                    $validated['status'],

                'notes' =>
                    $validated['notes']
                    ?? null,
            ]);

            $purchaseInvoice->items()->delete();

            foreach ($validated['items'] as $item) {
                $gross =
                    $item['quantity'] *
                    $item['price'];

                $itemDiscount =
                    $item['discount'] ?? 0;

                $discountAmount =
                    $gross *
                    ($itemDiscount / 100);

                $itemSubtotal =
                    $gross -
                    $discountAmount;

                $purchaseInvoice->items()->create([
                    'product_id' =>
                        $item['product_id'],

                    'quantity' =>
                        $item['quantity'],

                    'price' =>
                        $item['price'],

                    'discount' =>
                        $itemDiscount,

                    'subtotal' =>
                        $itemSubtotal,
                ]);
            }

            /*
             * Terapkan stok berdasarkan data invoice
             * yang baru.
             */
            if (
                !in_array(
                    $validated['status'],
                    ['draft', 'cancelled']
                )
            ) {
                $this->increaseStock(
                    $purchaseInvoice
                );
            }

            return response()->json(
                $purchaseInvoice->load([
                    'supplier',
                    'purchaseOrder',
                    'warehouse',
                    'items.product',
                ])
            );
        });
    }

    public function destroy(
        PurchaseInvoice $purchaseInvoice
    ) {
        return DB::transaction(
            function () use ($purchaseInvoice) {

                /*
                 * Kalau invoice aktif,
                 * kembalikan stok terlebih dahulu.
                 */
                if (
                    !in_array(
                        $purchaseInvoice->status,
                        ['draft', 'cancelled']
                    )
                ) {
                    $this->decreaseStock(
                        $purchaseInvoice
                    );
                }

                $purchaseInvoice->delete();

                return response()->json([
                    'message' =>
                        'Faktur Pembelian berhasil dihapus.'
                ]);
            }
        );
    }

    private function increaseStock(
        PurchaseInvoice $purchaseInvoice
    ): void {
        foreach (
            $purchaseInvoice->items
            as $item
        ) {
            $stock = Stock::firstOrCreate(
                [
                    'product_id' =>
                        $item->product_id,

                    'warehouse_id' =>
                        $purchaseInvoice->warehouse_id,
                ],
                [
                    'quantity' => 0,
                ]
            );

            $stock->quantity =
                $stock->quantity +
                $item->quantity;

            $stock->save();
        }
    }

    private function decreaseStock(
        PurchaseInvoice $purchaseInvoice
    ): void {
        foreach (
            $purchaseInvoice->items
            as $item
        ) {
            $stock = Stock::where(
                'product_id',
                $item->product_id
            )
                ->where(
                    'warehouse_id',
                    $purchaseInvoice->warehouse_id
                )
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                abort(
                    422,
                    'Stok tidak ditemukan.'
                );
            }

            $newQuantity =
                $stock->quantity -
                $item->quantity;

            if ($newQuantity < 0) {
                abort(
                    422,
                    'Stok tidak boleh menjadi negatif.'
                );
            }

            $stock->quantity =
                $newQuantity;

            $stock->save();
        }
    }
}