<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->foreignId('people_id')->constrained('gabinete_clickmaps.people');
            $table->string('email')->unique();
            $table->string('password');
            $table->boolean('active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        $peopleId = DB::table('gabinete_clickmaps.people')
            ->where('name', 'Alex Alves de Almeida')
            ->value('id');

        DB::table('gabinete_clickmaps.users')->insert([
            'people_id'  => $peopleId,
            'email'      => 'alex@mapadovoto.com',
            'password'   => Hash::make('Alex1985@'),
            'active'     => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }

    public function down(): void
    {
        DB::statement('SET search_path TO gabinete_clickmaps');
        Schema::dropIfExists('users');
        DB::statement('SET search_path TO gabinete_clickmaps,maps,public');
    }
};
