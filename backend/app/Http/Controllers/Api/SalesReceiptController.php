<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SalesInvoice;
use App\Models\SalesReceipt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesReceiptController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->search;

        $receipts = SalesReceipt::with([
            'salesInvoice.customer',
        ])
            ->when($search, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('number', 'like', "%{$search}%")
                        ->orWhereHas('salesInvoice', function ($invoice) use ($search) {
                            $invoice->where('number', 'like', "%{$search}%")
                                ->orWhereHas('customer', function ($customer) use ($search) {
                                    $customer->where(
                                        'name',
                                        'like',
                                        "%{$search}%"
                                    );
                                });
                        });
                });
            })
            ->latest('date')
            ->latest('id')
            ->get();

        return response()->json($receipts);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'sales_invoice_id' => 'required|exists:sales_invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank_transfer,credit_card,debit_card,other',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {

            $invoice = SalesInvoice::lockForUpdate()
                ->with('receipts')
                ->findOrFail($validated['sales_invoice_id']);

            if ($invoice->status === 'cancelled') {
                abort(422, 'Faktur yang dibatalkan tidak dapat menerima pembayaran.');
            }

            if ($invoice->status === 'draft') {
                abort(422, 'Faktur draft belum dapat menerima pembayaran.');
            }

            $totalPaid = $invoice->receipts->sum(
                fn ($receipt) => (float) $receipt->amount
            );

            $remaining = (float) $invoice->total - $totalPaid;

            if ($remaining <= 0) {
                abort(422, 'Faktur sudah lunas.');
            }

            $amount = (float) $validated['amount'];

            if ($amount > $remaining) {
                abort(
                    422,
                    'Jumlah pembayaran melebihi sisa tagihan.'
                );
            }

            $receipt = SalesReceipt::create([
                'number' => $this->generateNumber(),
                'date' => $validated['date'],
                'sales_invoice_id' => $invoice->id,
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
            ]);

            $newTotalPaid = $totalPaid + $amount;

            $invoice->update([
                'status' => $newTotalPaid >= (float) $invoice->total
                    ? 'paid'
                    : 'unpaid',
            ]);

            return response()->json(
                $receipt->load('salesInvoice.customer'),
                201
            );
        });
    }

    public function show(SalesReceipt $salesReceipt)
    {
        return response()->json(
            $salesReceipt->load('salesInvoice.customer')
        );
    }

    public function update(
        Request $request,
        SalesReceipt $salesReceipt
    ) {
        $validated = $request->validate([
            'date' => 'required|date',
            'sales_invoice_id' => 'required|exists:sales_invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,bank_transfer,credit_card,debit_card,other',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use (
            $validated,
            $salesReceipt
        ) {
            $oldInvoice = SalesInvoice::lockForUpdate()
                ->with('receipts')
                ->findOrFail($salesReceipt->sales_invoice_id);

            $newInvoice = SalesInvoice::lockForUpdate()
                ->with('receipts')
                ->findOrFail($validated['sales_invoice_id']);

            if (
                $newInvoice->status === 'cancelled' ||
                $newInvoice->status === 'draft'
            ) {
                abort(
                    422,
                    'Faktur tujuan tidak dapat menerima pembayaran.'
                );
            }

            /*
             * Hitung pembayaran invoice baru
             * tanpa pembayaran yang sedang diedit.
             */
            $existingPaid = $newInvoice->receipts
                ->filter(
                    fn ($receipt) =>
                        $receipt->id !== $salesReceipt->id
                )
                ->sum(
                    fn ($receipt) =>
                        (float) $receipt->amount
                );

            $remaining =
                (float) $newInvoice->total - $existingPaid;

            $amount = (float) $validated['amount'];

            if ($amount > $remaining) {
                abort(
                    422,
                    'Jumlah pembayaran melebihi sisa tagihan.'
                );
            }

            $salesReceipt->update([
                'date' => $validated['date'],
                'sales_invoice_id' => $newInvoice->id,
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'notes' => $validated['notes'] ?? null,
            ]);

            /*
             * Update status invoice lama.
             */
            $oldInvoice->refresh();

            $oldPaid = $oldInvoice->receipts()
                ->sum('amount');

            $oldInvoice->update([
                'status' =>
                    $oldPaid >= (float) $oldInvoice->total
                        ? 'paid'
                        : 'unpaid',
            ]);

            /*
             * Update status invoice baru.
             */
            $newInvoice->refresh();

            $newPaid = $newInvoice->receipts()
                ->sum('amount');

            $newInvoice->update([
                'status' =>
                    $newPaid >= (float) $newInvoice->total
                        ? 'paid'
                        : 'unpaid',
            ]);

            return response()->json(
                $salesReceipt->load('salesInvoice.customer')
            );
        });
    }

    public function destroy(SalesReceipt $salesReceipt)
    {
        return DB::transaction(function () use ($salesReceipt) {

            $invoice = SalesInvoice::lockForUpdate()
                ->findOrFail($salesReceipt->sales_invoice_id);

            $salesReceipt->delete();

            $totalPaid = $invoice->receipts()
                ->sum('amount');

            $invoice->update([
                'status' =>
                    $totalPaid >= (float) $invoice->total
                        ? 'paid'
                        : 'unpaid',
            ]);

            return response()->json([
                'message' =>
                    'Penerimaan penjualan berhasil dihapus.',
            ]);
        });
    }

    private function generateNumber(): string
    {
        $lastReceipt = SalesReceipt::latest('id')->first();

        $nextNumber = $lastReceipt
            ? $lastReceipt->id + 1
            : 1;

        return 'RCV-' . str_pad(
            $nextNumber,
            6,
            '0',
            STR_PAD_LEFT
        );
    }
}