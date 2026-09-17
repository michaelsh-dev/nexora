<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_invoices', function (Blueprint $table) {
            $table->id();

            $table->string('number')->unique();

            $table->date('date');

            $table->foreignId('supplier_id')
                ->constrained('suppliers')
                ->restrictOnDelete();

            $table->foreignId('purchase_order_id')
                ->nullable()
                ->constrained('purchase_orders')
                ->nullOnDelete();

            $table->foreignId('warehouse_id')
                ->constrained('warehouses')
                ->restrictOnDelete();

            $table->decimal('subtotal', 15, 2)->default(0);

            // Persentase diskon
            $table->decimal('discount', 8, 2)->default(0);

            // Persentase pajak
            $table->decimal('tax_rate', 8, 2)->default(0);

            // Nominal pajak
            $table->decimal('tax', 15, 2)->default(0);

            $table->decimal('total', 15, 2)->default(0);

            $table->enum('status', [
                'draft',
                'unpaid',
                'partially_paid',
                'paid',
                'cancelled'
            ])->default('unpaid');

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_invoices');
    }
};