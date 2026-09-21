<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CashBank;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('cashBank');

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where('number', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
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

            'category' => [
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

            $lastExpense =
                Expense::latest('id')->first();

            $nextNumber =
                $lastExpense
                    ? $lastExpense->id + 1
                    : 1;

            $number =
                'EX-' .
                str_pad(
                    $nextNumber,
                    6,
                    '0',
                    STR_PAD_LEFT
                );

            $expense = Expense::create([
                'number' => $number,

                'date' =>
                    $validated['date'],

                'cash_bank_id' =>
                    $validated['cash_bank_id'],

                'category' =>
                    $validated['category'],

                'amount' =>
                    $validated['amount'],

                'description' =>
                    $validated['description']
                    ?? null,
            ]);

            return response()->json(
                $expense->load('cashBank'),
                201
            );
        });
    }

    public function show(Expense $expense)
    {
        return response()->json(
            $expense->load('cashBank')
        );
    }

    public function update(
        Request $request,
        Expense $expense
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

            'category' => [
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

        $expense->update([
            'date' =>
                $validated['date'],

            'cash_bank_id' =>
                $validated['cash_bank_id'],

            'category' =>
                $validated['category'],

            'amount' =>
                $validated['amount'],

            'description' =>
                $validated['description']
                ?? null,
        ]);

        return response()->json(
            $expense->load('cashBank')
        );
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return response()->json([
            'message' =>
                'Pengeluaran berhasil dihapus.',
        ]);
    }
}