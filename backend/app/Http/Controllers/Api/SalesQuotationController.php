<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesQuotation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesQuotationController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesQuotation::with([
            'customer',
            'items.product'
        ]);

        if ($request->search) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customer) use ($search) {
                        $customer->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json(
            $query->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,sent,accepted,rejected,expired',
            'valid_until' => 'nullable|date',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {

            $subtotal = 0;

            foreach ($validated['items'] as $item) {

                $itemDiscount = $item['discount'] ?? 0;

                $gross = $item['quantity'] * $item['price'];

                $itemDiscountAmount =
                    $gross * ($itemDiscount / 100);

                $itemSubtotal =
                    $gross - $itemDiscountAmount;

                if ($itemSubtotal < 0) {
                    abort(
                        422,
                        'Diskon item tidak valid.'
                    );
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
                abort(
                    422,
                    'Diskon tidak valid.'
                );
            }

            $taxAmount =
                $afterDiscount * ($taxRate / 100);

            $total =
                $afterDiscount + $taxAmount;

            $last = SalesQuotation::latest('id')->first();

            $number = 'QUO-' . str_pad(
                ($last?->id ?? 0) + 1,
                6,
                '0',
                STR_PAD_LEFT
            );

            $quotation = SalesQuotation::create([
                'number' => $number,
                'date' => $validated['date'],
                'customer_id' => $validated['customer_id'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $taxAmount,
                'total' => $total,
                'status' => $validated['status'],
                'valid_until' => $validated['valid_until'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $itemDiscount = $item['discount'] ?? 0;

                $itemSubtotal =
                    ($item['quantity'] * $item['price'])
                    - $itemDiscount;

                $quotation->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ]);
            }

            return response()->json(
                $quotation->load([
                    'customer',
                    'items.product'
                ]),
                201
            );
        });
    }

    public function show(SalesQuotation $salesQuotation)
    {
        return response()->json(
            $salesQuotation->load([
                'customer',
                'items.product'
            ])
        );
    }

    public function update(
        Request $request,
        SalesQuotation $salesQuotation
    ) {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,sent,accepted,rejected,expired',
            'valid_until' => 'nullable|date',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
        ]);

        return DB::transaction(function () use (
            $validated,
            $salesQuotation
        ) {

            $subtotal = 0;

            foreach ($validated['items'] as $item) {

                $itemDiscount = $item['discount'] ?? 0;

                $gross = $item['quantity'] * $item['price'];

                $itemDiscountAmount =
                    $gross * ($itemDiscount / 100);

                $itemSubtotal =
                    $gross - $itemDiscountAmount;

                if ($itemSubtotal < 0) {
                    abort(
                        422,
                        'Diskon item tidak valid.'
                    );
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
                abort(
                    422,
                    'Diskon tidak valid.'
                );
            }

            $taxAmount =
                $afterDiscount * ($taxRate / 100);

            $total =
                $afterDiscount + $taxAmount;

            $salesQuotation->update([
                'date' => $validated['date'],
                'customer_id' => $validated['customer_id'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $taxAmount,
                'total' => $total,
                'status' => $validated['status'],
                'valid_until' => $validated['valid_until'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            $salesQuotation->items()->delete();

            foreach ($validated['items'] as $item) {
                $itemDiscount = $item['discount'] ?? 0;

                $itemSubtotal =
                    ($item['quantity'] * $item['price'])
                    - $itemDiscount;

                $salesQuotation->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ]);
            }

            return response()->json(
                $salesQuotation->load([
                    'customer',
                    'items.product'
                ])
            );
        });
    }

    public function destroy(SalesQuotation $salesQuotation)
    {
        $salesQuotation->delete();

        return response()->json([
            'message' => 'Penawaran berhasil dihapus.'
        ]);
    }
}
