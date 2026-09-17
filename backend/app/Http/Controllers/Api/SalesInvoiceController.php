<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use App\Models\SalesInvoiceItem;
use App\Models\Stock;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->search;

        $invoices = SalesInvoice::with([
            'customer',
            'items.product',
            'warehouse',
        ])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($customer) use ($search) {
                            $customer->where('name', 'like', "%{$search}%");
                        });
                });
            })
            ->latest('date')
            ->latest('id')
            ->get();

        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:draft,unpaid,paid',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',

            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'warehouse_id' => [
                'required',
                'exists:warehouses,id'
            ],
        ]);

        return DB::transaction(function () use ($validated) {

            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax'] ?? 0;

            $subtotal = 0;

            foreach ($validated['items'] as $item) {
                $itemDiscount = $item['discount'] ?? 0;

                $itemSubtotal =
                    ($item['quantity'] * $item['price'])
                    - $itemDiscount;

                if ($itemSubtotal < 0) {
                    abort(422, 'Diskon item tidak boleh lebih besar dari harga.');
                }

                $subtotal += $itemSubtotal;
            }

            $total = $subtotal - $discount + $tax;

            if ($total < 0) {
                abort(422, 'Total faktur tidak boleh negatif.');
            }

            $invoice = SalesInvoice::create([
                'number' => $this->generateNumber(),
                'date' => $validated['date'],
                'customer_id' => $validated['customer_id'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'status' => $validated['status'] ?? 'unpaid',
                'notes' => $validated['notes'] ?? null,
                'warehouse_id' =>
                $validated['warehouse_id'],
            ]);

            foreach ($validated['items'] as $item) {

                $itemDiscount = $item['discount'] ?? 0;

                $itemSubtotal =
                    ($item['quantity'] * $item['price'])
                    - $itemDiscount;

                SalesInvoiceItem::create([
                    'sales_invoice_id' => $invoice->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ]);

                // Draft belum mengurangi stok.
                if (($validated['status'] ?? 'unpaid') !== 'draft') {
                    $this->reduceStock(
                        $item['product_id'],
                        $validated['warehouse_id'],
                        $item['quantity']
                    );
                }
            }

            return response()->json(
                $invoice->load('customer', 'items.product'),
                201
            );
        });
    }

    public function show(SalesInvoice $salesInvoice)
    {
        return response()->json(
            $salesInvoice->load('customer', 'items.product')
        );
    }

    public function update(Request $request, SalesInvoice $salesInvoice)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'customer_id' => 'required|exists:customers,id',
            'warehouse_id' => [
                'required',
                'exists:warehouses,id'
            ],
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
            'status' => 'required|in:draft,unpaid,paid,cancelled',
            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',

            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',

        ]);

        return DB::transaction(function () use ($validated, $salesInvoice) {

            /*
             * Kembalikan stok dari transaksi lama
             * apabila transaksi lama bukan draft/cancelled.
             */
            if (
                $salesInvoice->status !== 'draft' &&
                $salesInvoice->status !== 'cancelled'
            ) {
                foreach ($salesInvoice->items as $oldItem) {
                    $this->restoreStock(
                        $oldItem->product_id,
                        $salesInvoice->warehouse_id ?? $validated['warehouse_id'],
                        $oldItem->quantity
                    );
                }
            }

            $discount = $validated['discount'] ?? 0;
            $tax = $validated['tax'] ?? 0;

            $subtotal = 0;

            foreach ($validated['items'] as $item) {
                $itemDiscount = $item['discount'] ?? 0;

                $itemSubtotal =
                    ($item['quantity'] * $item['price'])
                    - $itemDiscount;

                if ($itemSubtotal < 0) {
                    abort(422, 'Diskon item tidak boleh lebih besar dari harga.');
                }

                $subtotal += $itemSubtotal;
            }

            $total = $subtotal - $discount + $tax;

            if ($total < 0) {
                abort(422, 'Total faktur tidak boleh negatif.');
            }

            $salesInvoice->update([
                'date' => $validated['date'],
                'customer_id' => $validated['customer_id'],
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'warehouse_id' =>
                $validated['warehouse_id'],
            ]);

            $salesInvoice->items()->delete();

            foreach ($validated['items'] as $item) {

                $itemDiscount = $item['discount'] ?? 0;

                $itemSubtotal =
                    ($item['quantity'] * $item['price'])
                    - $itemDiscount;

                SalesInvoiceItem::create([
                    'sales_invoice_id' => $salesInvoice->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ]);

                if (
                    $validated['status'] !== 'draft' &&
                    $validated['status'] !== 'cancelled'
                ) {
                    $this->reduceStock(
                        $item['product_id'],
                        $validated['warehouse_id'],
                        $item['quantity']
                    );
                }
            }

            return response()->json(
                $salesInvoice->load('customer', 'items.product')
            );
        });
    }

    public function destroy(SalesInvoice $salesInvoice)
    {
        return DB::transaction(function () use ($salesInvoice) {

            if (
                $salesInvoice->status !== 'draft' &&
                $salesInvoice->status !== 'cancelled'
            ) {
                foreach ($salesInvoice->items as $item) {
                    $this->restoreStock(
                        $item->product_id,
                        $salesInvoice->warehouse_id,
                        $item->quantity
                    );
                }
            }

            $salesInvoice->delete();

            return response()->json([
                'message' => 'Faktur penjualan berhasil dihapus.',
            ]);
        });
    }

    private function generateNumber(): string
    {
        $lastInvoice = SalesInvoice::latest('id')->first();

        $nextNumber = $lastInvoice
            ? $lastInvoice->id + 1
            : 1;

        return 'INV-' . str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }

    private function reduceStock(int $productId, int $warehouseId, float $quantity): void
    {
        /*
        * Kurangi stok dari gudang yang dipilih
        * pada invoice.
        */
        $stock = Stock::where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->lockForUpdate()
            ->first();

        if (!$stock) {
            abort(422, 'Stok produk tidak ditemukan di gudang yang dipilih.');
        }

        if ((float) $stock->quantity < $quantity) {
            abort(
                422,
                "Stok {$stock->product->name} tidak mencukupi."
            );
        }

        $stock->decrement('quantity', $quantity);
    }

    private function restoreStock(
        int $productId,
        int $warehouseId,
        float $quantity
    ): void {
        $stock = Stock::where('product_id', $productId)
            ->where('warehouse_id', $warehouseId)
            ->lockForUpdate()
            ->first();

        if ($stock) {
            $stock->increment('quantity', $quantity);
        }
    }
}
