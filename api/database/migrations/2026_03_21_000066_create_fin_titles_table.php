<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function createInSchema(string $schema): void
    {
        DB::statement("SET search_path TO \"{$schema}\"");

        Schema::create('fin_titles', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // income, expense
            $table->string('description');
            $table->decimal('amount', 15, 2);
            $table->decimal('discount', 15, 2)->nullable();
            $table->decimal('interest', 15, 2)->nullable();
            $table->date('due_date');
            $table->date('paid_at')->nullable();
            $table->decimal('amount_paid', 15, 2)->nullable();
            $table->integer('installment_number')->nullable();
            $table->integer('installment_total')->nullable();
            $table->unsignedBigInteger('account_id')->nullable();
            $table->unsignedBigInteger('payment_method_id')->nullable();
            $table->unsignedBigInteger('bank_id')->nullable();
            $table->unsignedBigInteger('people_id'); // cross-schema: gabinete_master.people
            $table->string('document_number')->nullable();
            $table->string('invoice_number')->nullable();
            $table->string('barcode')->nullable();
            $table->string('pix_key')->nullable();
            $table->string('status')->default('pending'); // pending, paid, partial, cancelled, reversed
            $table->timestamps();
            $table->softDeletes();
        });

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    private function dropInSchema(string $schema): void
    {
        DB::statement("SET search_path TO \"{$schema}\"");
        Schema::dropIfExists('fin_titles');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function up(): void
    {
        $this->createInSchema('gabinete_master');

        $schemas = DB::table('gabinete_master.tenants')
            ->where('has_schema', true)
            ->whereNull('deleted_at')
            ->where('schema', '!=', 'gabinete_master')
            ->pluck('schema');

        foreach ($schemas as $schema) {
            $this->createInSchema($schema);
        }
    }

    public function down(): void
    {
        $this->dropInSchema('gabinete_master');

        $schemas = DB::table('gabinete_master.tenants')
            ->where('has_schema', true)
            ->whereNull('deleted_at')
            ->where('schema', '!=', 'gabinete_master')
            ->pluck('schema');

        foreach ($schemas as $schema) {
            $this->dropInSchema($schema);
        }
    }
};
