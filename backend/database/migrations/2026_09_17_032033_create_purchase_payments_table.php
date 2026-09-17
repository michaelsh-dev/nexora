<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_payments', function (Blueprint $table) {
            $table->id();

            $table->string('number')->unique();

            $table->date('date');

            $table->foreignId('purchase_invoice_id')
                ->constrained('purchase_invoices')
                ->restrictOnDelete();

            $table->decimal('amount', 15, 2);

            $table->enum('payment_method', [
                'cash',
                'bank_transfer',
                'credit_card',
                'debit_card',
                'other'
            ])->default('cash');

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_payments');
    }
};