<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseInvoice;
use App\Models\PurchasePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchasePaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = PurchasePayment::with([
            'purchaseInvoice.supplier',
        ]);

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($q) use ($search) {
                $q->where(
                    'number',
                    'like',
                    "%{$search}%"
                )
                ->orWhereHas(
                    'purchaseInvoice',
                    function ($invoice) use ($search) {
                        $invoice->where(
                            'number',
                            'like',
                            "%{$search}%"
                        );
                    }
                )
                ->orWhereHas(
                    'purchaseInvoice.supplier',
                    function ($supplier) use ($search) {
                        $supplier->where(
                            'name',
                            'like',
                            "%{$search}%"
                        );
                    }
                );
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
                'date'
            ],

            'purchase_invoice_id' => [
                'required',
                'exists:purchase_invoices,id'
            ],

            'amount' => [
                'required',
                'numeric',
                'gt:0'
            ],

            'payment_method' => [
                'required',
                'in:cash,bank_transfer,credit_card,debit_card,other'
            ],

            'notes' => [
                'nullable',
                'string'
            ],
        ]);

        return DB::transaction(
            function () use ($validated) {

                $invoice =
                    PurchaseInvoice::with('payments')
                        ->lockForUpdate()
                        ->findOrFail(
                            $validated[
                                'purchase_invoice_id'
                            ]
                        );

                if (
                    in_array(
                        $invoice->status,
                        ['draft', 'cancelled']
                    )
                ) {
                    return response()->json([
                        'message' =>
                            'Faktur belum dapat dibayar.'
                    ], 422);
                }

                $paid =
                    $invoice->payments->sum(
                        'amount'
                    );

                $remaining =
                    $invoice->total - $paid;

                $amount =
                    (float) $validated['amount'];

                if ($amount > $remaining) {
                    return response()->json([
                        'message' =>
                            'Jumlah pembayaran melebihi sisa tagihan.',
                        'remaining' =>
                            $remaining
                    ], 422);
                }

                $lastPayment =
                    PurchasePayment::latest('id')
                        ->first();

                $nextNumber =
                    $lastPayment
                        ? $lastPayment->id + 1
                        : 1;

                $number =
                    'PP-' .
                    str_pad(
                        $nextNumber,
                        6,
                        '0',
                        STR_PAD_LEFT
                    );

                $payment =
                    PurchasePayment::create([
                        'number' => $number,
                        'date' =>
                            $validated['date'],
                        'purchase_invoice_id' =>
                            $invoice->id,
                        'amount' => $amount,
                        'payment_method' =>
                            $validated[
                                'payment_method'
                            ],
                        'notes' =>
                            $validated['notes']
                            ?? null,
                    ]);

                $newPaid =
                    $paid + $amount;

                if ($newPaid >= $invoice->total) {
                    $invoice->status = 'paid';
                } else {
                    $invoice->status =
                        'partially_paid';
                }

                $invoice->save();

                return response()->json(
                    $payment->load(
                        'purchaseInvoice.supplier'
                    ),
                    201
                );
            }
        );
    }

    public function show(
        PurchasePayment $purchasePayment
    ) {
        return response()->json(
            $purchasePayment->load(
                'purchaseInvoice.supplier'
            )
        );
    }

    public function update(
        Request $request,
        PurchasePayment $purchasePayment
    ) {
        $validated = $request->validate([
            'date' => [
                'required',
                'date'
            ],

            'purchase_invoice_id' => [
                'required',
                'exists:purchase_invoices,id'
            ],

            'amount' => [
                'required',
                'numeric',
                'gt:0'
            ],

            'payment_method' => [
                'required',
                'in:cash,bank_transfer,credit_card,debit_card,other'
            ],

            'notes' => [
                'nullable',
                'string'
            ],
        ]);

        return DB::transaction(
            function () use (
                $validated,
                $purchasePayment
            ) {
                $oldInvoice =
                    PurchaseInvoice::with('payments')
                        ->lockForUpdate()
                        ->findOrFail(
                            $purchasePayment
                                ->purchase_invoice_id
                        );

                $newInvoice =
                    PurchaseInvoice::with('payments')
                        ->lockForUpdate()
                        ->findOrFail(
                            $validated[
                                'purchase_invoice_id'
                            ]
                        );

                if (
                    in_array(
                        $newInvoice->status,
                        ['draft', 'cancelled']
                    )
                ) {
                    return response()->json([
                        'message' =>
                            'Faktur belum dapat dibayar.'
                    ], 422);
                }

                /*
                 * Hitung pembayaran invoice lama
                 * tanpa payment yang sedang diedit.
                 */
                $oldPaid =
                    $oldInvoice->payments
                        ->where(
                            'id',
                            '!=',
                            $purchasePayment->id
                        )
                        ->sum('amount');

                $newPaid =
                    $newInvoice->payments
                        ->where(
                            'id',
                            '!=',
                            $purchasePayment->id
                        )
                        ->sum('amount');

                $amount =
                    (float) $validated['amount'];

                $remaining =
                    $newInvoice->total -
                    $newPaid;

                if ($amount > $remaining) {
                    return response()->json([
                        'message' =>
                            'Jumlah pembayaran melebihi sisa tagihan.',
                        'remaining' =>
                            $remaining
                    ], 422);
                }

                $purchasePayment->update([
                    'date' =>
                        $validated['date'],

                    'purchase_invoice_id' =>
                        $validated[
                            'purchase_invoice_id'
                        ],

                    'amount' =>
                        $amount,

                    'payment_method' =>
                        $validated[
                            'payment_method'
                        ],

                    'notes' =>
                        $validated['notes']
                        ?? null,
                ]);

                /*
                 * Update status invoice lama.
                 */
                if (
                    $oldPaid <= 0
                ) {
                    $oldInvoice->status =
                        'unpaid';
                } elseif (
                    $oldPaid >= $oldInvoice->total
                ) {
                    $oldInvoice->status =
                        'paid';
                } else {
                    $oldInvoice->status =
                        'partially_paid';
                }

                $oldInvoice->save();

                /*
                 * Update status invoice baru.
                 */
                $newTotalPaid =
                    $newPaid + $amount;

                if (
                    $newTotalPaid >=
                    $newInvoice->total
                ) {
                    $newInvoice->status =
                        'paid';
                } else {
                    $newInvoice->status =
                        'partially_paid';
                }

                $newInvoice->save();

                return response()->json(
                    $purchasePayment->load(
                        'purchaseInvoice.supplier'
                    )
                );
            }
        );
    }

    public function destroy(
        PurchasePayment $purchasePayment
    ) {
        return DB::transaction(
            function () use ($purchasePayment) {

                $invoice =
                    PurchaseInvoice::with('payments')
                        ->lockForUpdate()
                        ->findOrFail(
                            $purchasePayment
                                ->purchase_invoice_id
                        );

                $purchasePayment->delete();

                $paid =
                    $invoice->payments
                        ->where(
                            'id',
                            '!=',
                            $purchasePayment->id
                        )
                        ->sum('amount');

                if ($paid <= 0) {
                    $invoice->status =
                        'unpaid';
                } elseif (
                    $paid >= $invoice->total
                ) {
                    $invoice->status =
                        'paid';
                } else {
                    $invoice->status =
                        'partially_paid';
                }

                $invoice->save();

                return response()->json([
                    'message' =>
                        'Pembayaran Pembelian berhasil dihapus.'
                ]);
            }
        );
    }
}