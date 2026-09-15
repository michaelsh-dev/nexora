<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use App\Models\StockAdjustment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        $query = StockAdjustment::with([
            'product.category',
            'warehouse',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('product', function ($productQuery) use ($search) {
                        $productQuery
                            ->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('warehouse_id')) {
            $query->where(
                'warehouse_id',
                $request->warehouse_id
            );
        }

        return response()->json(
            $query->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'adjustment_quantity' => 'required|numeric',
            'reason' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {

            $stock = Stock::where('product_id', $validated['product_id'])
                ->where('warehouse_id', $validated['warehouse_id'])
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                return response()->json([
                    'message' => 'Stok barang di gudang tersebut belum tersedia.'
                ], 422);
            }

            $before = (float) $stock->quantity;
            $adjustment = (float) $validated['adjustment_quantity'];
            $after = $before + $adjustment;

            if ($after < 0) {
                return response()->json([
                    'message' => 'Stok tidak boleh menjadi negatif.'
                ], 422);
            }

            $lastAdjustment = StockAdjustment::latest('id')->first();

            $nextNumber = $lastAdjustment
                ? ((int) str_replace('PS-', '', $lastAdjustment->number)) + 1
                : 1;

            $number = 'PS-' . str_pad(
                $nextNumber,
                6,
                '0',
                STR_PAD_LEFT
            );

            $adjustmentData = StockAdjustment::create([
                'number' => $number,
                'date' => $validated['date'],
                'product_id' => $validated['product_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'quantity_before' => $before,
                'adjustment_quantity' => $adjustment,
                'quantity_after' => $after,
                'reason' => $validated['reason'] ?? null,
            ]);

            $stock->update([
                'quantity' => $after,
            ]);

            return response()->json([
                'message' => 'Penyesuaian stok berhasil disimpan.',
                'data' => $adjustmentData->load([
                    'product.category',
                    'warehouse',
                ]),
            ], 201);
        });
    }

    public function show(StockAdjustment $stockAdjustment)
    {
        return response()->json(
            $stockAdjustment->load([
                'product.category',
                'warehouse',
            ])
        );
    }

    public function update(
        Request $request,
        StockAdjustment $stockAdjustment
    ) {
        $validated = $request->validate([
            'date' => 'required|date',
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'adjustment_quantity' => 'required|numeric',
            'reason' => 'nullable|string',
        ]);

        return DB::transaction(function () use (
            $validated,
            $stockAdjustment
        ) {

            /*
             * Kembalikan efek penyesuaian lama terlebih dahulu.
             */
            $oldStock = Stock::where('product_id', $stockAdjustment->product_id)
                ->where('warehouse_id', $stockAdjustment->warehouse_id)
                ->lockForUpdate()
                ->first();

            if (!$oldStock) {
                return response()->json([
                    'message' => 'Data stok lama tidak ditemukan.'
                ], 422);
            }

            $currentQuantity = (float) $oldStock->quantity;
            $oldAdjustment = (float) $stockAdjustment->adjustment_quantity;

            $restoredQuantity = $currentQuantity - $oldAdjustment;

            if ($restoredQuantity < 0) {
                return response()->json([
                    'message' => 'Penyesuaian tidak dapat diubah karena stok saat ini tidak memungkinkan.'
                ], 422);
            }

            /*
             * Cari stok tujuan.
             */
            $newStock = Stock::where('product_id', $validated['product_id'])
                ->where('warehouse_id', $validated['warehouse_id'])
                ->lockForUpdate()
                ->first();

            if (!$newStock) {
                return response()->json([
                    'message' => 'Stok barang di gudang tujuan belum tersedia.'
                ], 422);
            }

            /*
             * Kalau barang/gudang berubah, gunakan stok tujuan
             * sebagai stok sebelum.
             *
             * Kalau tetap sama, gunakan stok yang sudah
             * dikembalikan dari adjustment lama.
             */
            if (
                $stockAdjustment->product_id == $validated['product_id'] &&
                $stockAdjustment->warehouse_id == $validated['warehouse_id']
            ) {
                $before = $restoredQuantity;
            } else {
                $before = (float) $newStock->quantity;
            }

            $adjustment = (float) $validated['adjustment_quantity'];
            $after = $before + $adjustment;

            if ($after < 0) {
                return response()->json([
                    'message' => 'Stok tidak boleh menjadi negatif.'
                ], 422);
            }

            /*
             * Kalau barang/gudang berubah,
             * stok lama dikembalikan dan stok baru ditambah.
             */
            if (
                $stockAdjustment->product_id != $validated['product_id'] ||
                $stockAdjustment->warehouse_id != $validated['warehouse_id']
            ) {
                $oldStock->update([
                    'quantity' => $restoredQuantity,
                ]);
            }

            $newStock->update([
                'quantity' => $after,
            ]);

            $stockAdjustment->update([
                'date' => $validated['date'],
                'product_id' => $validated['product_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'quantity_before' => $before,
                'adjustment_quantity' => $adjustment,
                'quantity_after' => $after,
                'reason' => $validated['reason'] ?? null,
            ]);

            return response()->json([
                'message' => 'Penyesuaian stok berhasil diperbarui.',
                'data' => $stockAdjustment->load([
                    'product.category',
                    'warehouse',
                ]),
            ]);
        });
    }

    public function destroy(StockAdjustment $stockAdjustment)
    {
        return DB::transaction(function () use ($stockAdjustment) {

            $stock = Stock::where('product_id', $stockAdjustment->product_id)
                ->where('warehouse_id', $stockAdjustment->warehouse_id)
                ->lockForUpdate()
                ->first();

            if (!$stock) {
                return response()->json([
                    'message' => 'Data stok tidak ditemukan.'
                ], 422);
            }

            $currentQuantity = (float) $stock->quantity;
            $adjustment = (float) $stockAdjustment->adjustment_quantity;

            $newQuantity = $currentQuantity - $adjustment;

            if ($newQuantity < 0) {
                return response()->json([
                    'message' => 'Penyesuaian tidak dapat dihapus karena stok akan menjadi negatif.'
                ], 422);
            }

            $stock->update([
                'quantity' => $newQuantity,
            ]);

            $stockAdjustment->delete();

            return response()->json([
                'message' => 'Penyesuaian stok berhasil dihapus.'
            ]);
        });
    }
}