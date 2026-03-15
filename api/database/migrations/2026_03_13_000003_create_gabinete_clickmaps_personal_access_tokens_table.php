<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('tokenable_type');
            $table->unsignedBigInteger('tokenable_id');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('schema')->nullable();
            $table->timestamps();

            $table->index(['tokenable_type', 'tokenable_id']);
        });

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');
        Schema::dropIfExists('personal_access_tokens');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
