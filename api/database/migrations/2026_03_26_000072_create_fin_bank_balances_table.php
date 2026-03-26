<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gabinete_master.fin_bank_balances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fin_bank_id');
            $table->date('data');
            $table->decimal('valor', 15, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gabinete_master.fin_bank_balances');
    }
};
