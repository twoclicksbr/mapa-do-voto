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

        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
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
        $ins = fn(array $data) => DB::table('departments')->insert(array_merge([
            'active'     => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $data));

        $ins(['name' => 'Marketing', 'order' => 1]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    private function dropInSchema(string $schema): void
    {
        DB::statement("SET search_path TO \"{$schema}\"");
        Schema::dropIfExists('departments');
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
