<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'number',
        'date',
        'product_id',
        'warehouse_id',
        'quantity_before',
        'adjustment_quantity',
        'quantity_after',
        'reason',
    ];

    protected $casts = [
        'date' => 'date',
        'quantity_before' => 'decimal:2',
        'adjustment_quantity' => 'decimal:2',
        'quantity_after' => 'decimal:2',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }
}