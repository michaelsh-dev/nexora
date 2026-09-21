<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();

            $table->string('company_name')->default('Nexora');

            $table->string('email')->nullable();

            $table->string('phone')->nullable();

            $table->text('address')->nullable();

            $table->string('tax_number')->nullable();

            $table->string('website')->nullable();

            $table->string('currency')->default('IDR');

            $table->string('timezone')->default('Asia/Jakarta');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};