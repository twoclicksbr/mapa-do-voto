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

        Schema::create('fin_payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('fin_bank_id')->nullable();
            $table->unsignedBigInteger('fin_payment_method_type_id')->nullable();
            $table->integer('order')->default(1);
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    private function seedInSchema(string $schema): void
    {
        DB::statement("SET search_path TO \"{$schema}\"");

        $now = now();
        $ins = fn(array $data) => DB::table('fin_payment_methods')->insert(array_merge([
            'fin_bank_id'                => null,
            'fin_payment_method_type_id' => null,
            'active'                     => true,
            'created_at'                 => $now,
            'updated_at'                 => $now,
        ], $data));

        $ins(['name' => 'Dinheiro', 'fin_bank_id' => 1, 'fin_payment_method_type_id' => 1, 'order' => 1]);
        $ins(['name' => 'Pix',      'fin_bank_id' => 1, 'fin_payment_method_type_id' => 2, 'order' => 2]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    private function dropInSchema(string $schema): void
    {
        DB::statement("SET search_path TO \"{$schema}\"");
        Schema::dropIfExists('fin_payment_methods');
        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    public function up(): void
    {
        $this->createInSchema('gabinete_master');
        $this->seedInSchema('gabinete_master');

        $schemas = DB::table('gabinete_master.tenants')
            ->where('has_schema', true)
            ->whereNull('deleted_at')
            ->where('schema', '!=', 'gabinete_master')
            ->pluck('schema');

        foreach ($schemas as $schema) {
            $this->createInSchema($schema);
            $this->seedInSchema($schema);
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
