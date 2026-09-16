<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesOrderController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->search;
        $status = $request->status;

        $orders = SalesOrder::with([
            'customer',
            'items.product',
        ])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where(
                        'number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas('customer', function ($customer) use ($search) {
                        $customer->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    });
                });
            })
            ->when($status, function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->latest('date')
            ->latest('id')
            ->get();

        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',

            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',

            'status' => 'nullable|in:draft,processing,completed,cancelled',

            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',

            'items.*.product_id' =>
                'required|exists:products,id',

            'items.*.quantity' =>
                'required|numeric|min:0.01',

            'items.*.price' =>
                'required|numeric|min:0',

            'items.*.discount' =>
                'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {

            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax'] ?? 0;

            $subtotal = 0;

            foreach ($validated['items'] as $item) {

                $itemDiscount =
                    $item['discount'] ?? 0;

                $itemSubtotal =
                    ($item['quantity'] * $item['price'])
                    - $itemDiscount;

                if ($itemSubtotal < 0) {
                    abort(
                        422,
                        'Diskon item tidak boleh lebih besar dari harga.'
                    );
                }

                $subtotal += $itemSubtotal;
            }

            $total =
                $subtotal
                - $discount
                + $tax;

            if ($total < 0) {
                abort(
                    422,
                    'Total pesanan tidak boleh negatif.'
                );
            }

            $order = SalesOrder::create([
                'number' => $this->generateNumber(),
                'date' => $validated['date'],
                'customer_id' => $validated['customer_id'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'status' =>
                    $validated['status'] ?? 'draft',
                'notes' =>
                    $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {

                $itemDiscount =
                    $item['discount'] ?? 0;

                $itemSubtotal =
                    ($item['quantity'] * $item['price'])
                    - $itemDiscount;

                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ]);
            }

            return response()->json(
                $order->load(
                    'customer',
                    'items.product'
                ),
                201
            );
        });
    }

    public function show(SalesOrder $salesOrder)
    {
        return response()->json(
            $salesOrder->load(
                'customer',
                'items.product'
            )
        );
    }

    public function update(
        Request $request,
        SalesOrder $salesOrder
    ) {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' =>
                'required|exists:customers,id',

            'discount' =>
                'nullable|numeric|min:0',

            'tax' =>
                'nullable|numeric|min:0',

            'status' =>
                'required|in:draft,processing,completed,cancelled',

            'notes' =>
                'nullable|string',

            'items' =>
                'required|array|min:1',

            'items.*.product_id' =>
                'required|exists:products,id',

            'items.*.quantity' =>
                'required|numeric|min:0.01',

            'items.*.price' =>
                'required|numeric|min:0',

            'items.*.discount' =>
                'nullable|numeric|min:0',
        ]);

        return DB::transaction(
            function () use (
                $validated,
                $salesOrder
            ) {

                $discount =
                    $validated['discount'] ?? 0;

                $tax =
                    $validated['tax'] ?? 0;

                $subtotal = 0;

                foreach ($validated['items'] as $item) {

                    $itemDiscount =
                        $item['discount'] ?? 0;

                    $itemSubtotal =
                        ($item['quantity'] * $item['price'])
                        - $itemDiscount;

                    if ($itemSubtotal < 0) {
                        abort(
                            422,
                            'Diskon item tidak boleh lebih besar dari harga.'
                        );
                    }

                    $subtotal += $itemSubtotal;
                }

                $total =
                    $subtotal
                    - $discount
                    + $tax;

                if ($total < 0) {
                    abort(
                        422,
                        'Total pesanan tidak boleh negatif.'
                    );
                }

                $salesOrder->update([
                    'date' =>
                        $validated['date'],

                    'customer_id' =>
                        $validated['customer_id'],

                    'subtotal' =>
                        $subtotal,

                    'discount' =>
                        $discount,

                    'tax' =>
                        $tax,

                    'total' =>
                        $total,

                    'status' =>
                        $validated['status'],

                    'notes' =>
                        $validated['notes'] ?? null,
                ]);

                $salesOrder->items()->delete();

                foreach ($validated['items'] as $item) {

                    $itemDiscount =
                        $item['discount'] ?? 0;

                    $itemSubtotal =
                        ($item['quantity'] * $item['price'])
                        - $itemDiscount;

                    SalesOrderItem::create([
                        'sales_order_id' =>
                            $salesOrder->id,

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

                return response()->json(
                    $salesOrder->load(
                        'customer',
                        'items.product'
                    )
                );
            }
        );
    }

    public function destroy(SalesOrder $salesOrder)
    {
        $salesOrder->delete();

        return response()->json([
            'message' =>
                'Pesanan penjualan berhasil dihapus.',
        ]);
    }

    private function generateNumber(): string
    {
        $lastOrder =
            SalesOrder::latest('id')->first();

        $nextNumber =
            $lastOrder
                ? $lastOrder->id + 1
                : 1;

        return 'SO-' .
            str_pad(
                $nextNumber,
                6,
                '0',
                STR_PAD_LEFT
            );
    }
}