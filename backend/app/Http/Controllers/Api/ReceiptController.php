<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashBank;
use App\Models\Receipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = Receipt::with('cashBank');

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhere('source', 'like', "%{$search}%")
                    ->orWhereHas('cashBank', function ($cashBank) use ($search) {
                        $cashBank->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    });
            });
        }

        return response()->json(
            $query->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => [
                'required',
                'date',
            ],

            'cash_bank_id' => [
                'required',
                'exists:cash_banks,id',
            ],

            'source' => [
                'required',
                'string',
                'max:255',
            ],

            'amount' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'description' => [
                'nullable',
                'string',
            ],
        ]);

        $cashBank = CashBank::findOrFail(
            $validated['cash_bank_id']
        );

        if ($cashBank->status !== 'active') {
            return response()->json([
                'message' =>
                    'Kas atau Bank sedang nonaktif.',
            ], 422);
        }

        return DB::transaction(function () use ($validated) {
            $lastReceipt =
                Receipt::latest('id')->first();

            $nextNumber =
                $lastReceipt
                    ? $lastReceipt->id + 1
                    : 1;

            $number =
                'RC-' .
                str_pad(
                    $nextNumber,
                    6,
                    '0',
                    STR_PAD_LEFT
                );

            $receipt = Receipt::create([
                'number' => $number,

                'date' =>
                    $validated['date'],

                'cash_bank_id' =>
                    $validated['cash_bank_id'],

                'source' =>
                    $validated['source'],

                'amount' =>
                    $validated['amount'],

                'description' =>
                    $validated['description']
                    ?? null,
            ]);

            return response()->json(
                $receipt->load('cashBank'),
                201
            );
        });
    }

    public function show(Receipt $receipt)
    {
        return response()->json(
            $receipt->load('cashBank')
        );
    }

    public function update(
        Request $request,
        Receipt $receipt
    ) {
        $validated = $request->validate([
            'date' => [
                'required',
                'date',
            ],

            'cash_bank_id' => [
                'required',
                'exists:cash_banks,id',
            ],

            'source' => [
                'required',
                'string',
                'max:255',
            ],

            'amount' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'description' => [
                'nullable',
                'string',
            ],
        ]);

        $cashBank = CashBank::findOrFail(
            $validated['cash_bank_id']
        );

        if ($cashBank->status !== 'active') {
            return response()->json([
                'message' =>
                    'Kas atau Bank sedang nonaktif.',
            ], 422);
        }

        $receipt->update([
            'date' =>
                $validated['date'],

            'cash_bank_id' =>
                $validated['cash_bank_id'],

            'source' =>
                $validated['source'],

            'amount' =>
                $validated['amount'],

            'description' =>
                $validated['description']
                ?? null,
        ]);

        return response()->json(
            $receipt->load('cashBank')
        );
    }

    public function destroy(Receipt $receipt)
    {
        $receipt->delete();

        return response()->json([
            'message' =>
                'Penerimaan berhasil dihapus.',
        ]);
    }
}