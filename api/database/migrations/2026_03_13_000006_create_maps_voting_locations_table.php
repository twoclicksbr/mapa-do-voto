<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO maps');

        Schema::create('voting_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('zone_id')->constrained('maps.zones');
            $table->string('tse_number');
            $table->string('name');
            $table->string('address')->nullable();
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->timestamps();
        });

        DB::statement('SET search_path TO maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO maps');
        Schema::dropIfExists('voting_locations');
        DB::statement('SET search_path TO maps,public');
    }
};
