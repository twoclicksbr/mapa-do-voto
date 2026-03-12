<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('parties', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('abbreviation')->unique();
            $table->string('color_bg');
            $table->string('color_text');
            $table->string('color_gradient')->nullable();
            $table->timestamps();
        });

        $now = now();

        DB::table('parties')->insert([
            ['name' => 'Partido dos Trabalhadores',                       'abbreviation' => 'PT',            'color_bg' => '#fee2e2', 'color_text' => '#b91c1c', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Liberal',                                 'abbreviation' => 'PL',            'color_bg' => '#dbeafe', 'color_text' => '#1d4ed8', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'União Brasil',                                    'abbreviation' => 'UNIÃO',         'color_bg' => '#ffffff', 'color_text' => '#ffffff', 'color_gradient' => 'linear-gradient(180deg, #003087 50%, #C8970A 50%)',       'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Movimento Democrático Brasileiro',                'abbreviation' => 'MDB',           'color_bg' => '#ffffff', 'color_text' => '#ffffff', 'color_gradient' => 'linear-gradient(180deg, #007A33 50%, #FFD700 50%)',       'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Progressistas',                                   'abbreviation' => 'PP',            'color_bg' => '#dbeafe', 'color_text' => '#1e40af', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Republicanos',                                    'abbreviation' => 'REPUBLICANOS',  'color_bg' => '#ffedd5', 'color_text' => '#c2410c', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Social Democrático',                      'abbreviation' => 'PSD',           'color_bg' => '#e0f2fe', 'color_text' => '#0369a1', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido da Social Democracia Brasileira',         'abbreviation' => 'PSDB',          'color_bg' => '#dbeafe', 'color_text' => '#2563eb', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Democrático Trabalhista',                 'abbreviation' => 'PDT',           'color_bg' => '#fee2e2', 'color_text' => '#dc2626', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Socialista Brasileiro',                   'abbreviation' => 'PSB',           'color_bg' => '#ffedd5', 'color_text' => '#ea580c', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Solidariedade',                                   'abbreviation' => 'SOLIDARIEDADE', 'color_bg' => '#ffedd5', 'color_text' => '#ea580c', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Avante',                                          'abbreviation' => 'AVANTE',        'color_bg' => '#ffedd5', 'color_text' => '#c2410c', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Patriota',                                        'abbreviation' => 'PATRIOTA',      'color_bg' => '#dcfce7', 'color_text' => '#15803d', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Republicano da Ordem Social',             'abbreviation' => 'PROS',          'color_bg' => '#dcfce7', 'color_text' => '#16a34a', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Democracia Cristã',                               'abbreviation' => 'DC',            'color_bg' => '#dbeafe', 'color_text' => '#1d4ed8', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Comunista do Brasil',                     'abbreviation' => 'PCdoB',         'color_bg' => '#fee2e2', 'color_text' => '#991b1b', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Socialismo e Liberdade',                  'abbreviation' => 'PSOL',          'color_bg' => '#fef9c3', 'color_text' => '#854d0e', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Rede Sustentabilidade',                           'abbreviation' => 'REDE',          'color_bg' => '#ccfbf1', 'color_text' => '#0d9488', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido da Mobilização Nacional',                 'abbreviation' => 'PMN',           'color_bg' => '#f3e8ff', 'color_text' => '#7e22ce', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Agir',                                            'abbreviation' => 'AGIR',          'color_bg' => '#ccfbf1', 'color_text' => '#0f766e', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Renovação Trabalhista Brasileiro',        'abbreviation' => 'PRTB',          'color_bg' => '#fef9c3', 'color_text' => '#713f12', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Unidade Popular',                                 'abbreviation' => 'UP',            'color_bg' => '#fee2e2', 'color_text' => '#7f1d1d', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Socialista dos Trabalhadores Unificado',  'abbreviation' => 'PSTU',          'color_bg' => '#fee2e2', 'color_text' => '#7f1d1d', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Comunista Brasileiro',                    'abbreviation' => 'PCB',           'color_bg' => '#fee2e2', 'color_text' => '#991b1b', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido da Causa Operária',                       'abbreviation' => 'PCO',           'color_bg' => '#fee2e2', 'color_text' => '#7f1d1d', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Novo',                                            'abbreviation' => 'NOVO',          'color_bg' => '#ffedd5', 'color_text' => '#9a3412', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Podemos',                                         'abbreviation' => 'PODEMOS',       'color_bg' => '#dcfce7', 'color_text' => '#15803d', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Cidadania',                                       'abbreviation' => 'CIDADANIA',     'color_bg' => '#f3e8ff', 'color_text' => '#9333ea', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Verde',                                   'abbreviation' => 'PV',            'color_bg' => '#dcfce7', 'color_text' => '#14532d', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Partido Renovação Democrática',                   'abbreviation' => 'PRD',           'color_bg' => '#dbeafe', 'color_text' => '#1e3a8a', 'color_gradient' => null,                                                      'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('parties');
    }
};
