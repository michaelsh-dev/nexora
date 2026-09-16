<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Stock;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index(Request $request)
    {
        $query = Stock::with([
            'product.category',
            'warehouse',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->whereHas('product', function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        return response()->json(
            $query->orderBy('code', 'asc')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0',
        ]);

        $exists = Stock::where('product_id', $validated['product_id'])
            ->where('warehouse_id', $validated['warehouse_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Stok untuk barang dan gudang tersebut sudah ada.'
            ], 422);
        }

        $stock = Stock::create($validated);

        return response()->json([
            'message' => 'Stok berhasil ditambahkan.',
            'data' => $stock->load([
                'product.category',
                'warehouse',
            ]),
        ], 201);
    }

    public function show(Stock $stock)
    {
        return response()->json(
            $stock->load([
                'product.category',
                'warehouse',
            ])
        );
    }

    public function update(Request $request, Stock $stock)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'quantity' => 'required|numeric|min:0',
        ]);

        $exists = Stock::where('product_id', $validated['product_id'])
            ->where('warehouse_id', $validated['warehouse_id'])
            ->where('id', '!=', $stock->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'Stok untuk barang dan gudang tersebut sudah ada.'
            ], 422);
        }

        $stock->update($validated);

        return response()->json([
            'message' => 'Stok berhasil diperbarui.',
            'data' => $stock->load([
                'product.category',
                'warehouse',
            ]),
        ]);
    }

    public function destroy(Stock $stock)
    {
        $stock->delete();

        return response()->json([
            'message' => 'Stok berhasil dihapus.'
        ]);
    }
}