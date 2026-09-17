<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchaseRequest::with([
            'supplier',
            'items.product',
        ]);

        if ($request->search) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhereHas('supplier', function ($supplier) use ($search) {
                        $supplier->where('name', 'like', "%{$search}%");
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

            'supplier_id' => 'required|exists:suppliers,id',

            'status' => 'required|in:draft,submitted,approved,rejected,completed',

            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',

            'items.*.product_id' =>
                'required|exists:products,id',

            'items.*.quantity' =>
                'required|numeric|min:0.01',

            'items.*.notes' =>
                'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {

            $last = PurchaseRequest::latest('id')->first();

            $number = 'PR-' . str_pad(
                ($last?->id ?? 0) + 1,
                6,
                '0',
                STR_PAD_LEFT
            );

            $purchaseRequest = PurchaseRequest::create([
                'number' => $number,
                'date' => $validated['date'],
                'supplier_id' => $validated['supplier_id'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $purchaseRequest->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return response()->json(
                $purchaseRequest->load([
                    'supplier',
                    'items.product',
                ]),
                201
            );
        });
    }

    public function show(PurchaseRequest $purchaseRequest)
    {
        return response()->json(
            $purchaseRequest->load([
                'supplier',
                'items.product',
            ])
        );
    }

    public function update(
        Request $request,
        PurchaseRequest $purchaseRequest
    ) {
        $validated = $request->validate([
            'date' => 'required|date',

            'supplier_id' => 'required|exists:suppliers,id',

            'status' => 'required|in:draft,submitted,approved,rejected,completed',

            'notes' => 'nullable|string',

            'items' => 'required|array|min:1',

            'items.*.product_id' =>
                'required|exists:products,id',

            'items.*.quantity' =>
                'required|numeric|min:0.01',

            'items.*.notes' =>
                'nullable|string',
        ]);

        return DB::transaction(function () use (
            $validated,
            $purchaseRequest
        ) {

            $purchaseRequest->update([
                'date' => $validated['date'],
                'supplier_id' => $validated['supplier_id'],
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $purchaseRequest->items()->delete();

            foreach ($validated['items'] as $item) {
                $purchaseRequest->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            return response()->json(
                $purchaseRequest->load([
                    'supplier',
                    'items.product',
                ])
            );
        });
    }

    public function destroy(PurchaseRequest $purchaseRequest)
    {
        $purchaseRequest->delete();

        return response()->json([
            'message' => 'Permintaan pembelian berhasil dihapus.',
        ]);
    }
}