<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashBank;
use Illuminate\Http\Request;

class CashBankController extends Controller
{
    public function index(Request $request)
    {
        $query = CashBank::query();

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json(
            $query->orderBy('id', 'asc')->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                'unique:cash_banks,code',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'type' => [
                'required',
                'in:cash,bank',
            ],

            'opening_balance' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'status' => [
                'required',
                'in:active,inactive',
            ],

            'description' => [
                'nullable',
                'string',
            ],
        ]);

        $cashBank = CashBank::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'opening_balance' =>
                $validated['opening_balance'] ?? 0,
            'status' => $validated['status'],
            'description' =>
                $validated['description'] ?? null,
        ]);

        return response()->json(
            $cashBank,
            201
        );
    }

    public function show(CashBank $cashBank)
    {
        return response()->json($cashBank);
    }

    public function update(
        Request $request,
        CashBank $cashBank
    ) {
        $validated = $request->validate([
            'code' => [
                'required',
                'string',
                'max:50',
                'unique:cash_banks,code,' . $cashBank->id,
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'type' => [
                'required',
                'in:cash,bank',
            ],

            'opening_balance' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'status' => [
                'required',
                'in:active,inactive',
            ],

            'description' => [
                'nullable',
                'string',
            ],
        ]);

        $cashBank->update([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'type' => $validated['type'],
            'opening_balance' =>
                $validated['opening_balance'] ?? 0,
            'status' => $validated['status'],
            'description' =>
                $validated['description'] ?? null,
        ]);

        return response()->json($cashBank);
    }

    public function destroy(CashBank $cashBank)
    {
        $cashBank->delete();

        return response()->json([
            'message' => 'Kas & Bank berhasil dihapus.',
        ]);
    }
}