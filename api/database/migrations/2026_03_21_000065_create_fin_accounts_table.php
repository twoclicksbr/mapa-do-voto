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

        Schema::create('fin_accounts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->string('code')->nullable();
            $table->string('name');
            $table->string('type'); // asset, liability, revenue, expense, cost
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
        $ins = function (array $data) use ($now): int {
            return DB::table('fin_accounts')->insertGetId(array_merge([
                'code'       => null,
                'active'     => true,
                'created_at' => $now,
                'updated_at' => $now,
            ], $data));
        };

        // ── 1 ATIVO ──────────────────────────────────────────────────────────
        $a = $ins(['parent_id' => null, 'name' => 'Ativo',         'type' => 'asset', 'order' => 1]);
        $a1 = $ins(['parent_id' => $a,  'name' => 'Circulante',    'type' => 'asset', 'order' => 1]);

        $a11 = $ins(['parent_id' => $a1, 'name' => 'Caixa',                   'type' => 'asset', 'order' => 1]);
        $ins(['parent_id' => $a11, 'name' => 'Caixa Geral',                   'type' => 'asset', 'order' => 1]);

        $a12 = $ins(['parent_id' => $a1, 'name' => 'Bancos Conta Movimento',  'type' => 'asset', 'order' => 2]);
        $ins(['parent_id' => $a12, 'name' => 'Banco A',                        'type' => 'asset', 'order' => 1]);

        $a13 = $ins(['parent_id' => $a1, 'name' => 'Contas a Receber',        'type' => 'asset', 'order' => 3]);
        $ins(['parent_id' => $a13, 'name' => 'Clientes',                       'type' => 'asset', 'order' => 1]);
        $ins(['parent_id' => $a13, 'name' => 'Outras Contas a Receber',        'type' => 'asset', 'order' => 2]);

        $a14 = $ins(['parent_id' => $a1, 'name' => 'Estoques',                'type' => 'asset', 'order' => 4]);
        $ins(['parent_id' => $a14, 'name' => 'Mercadorias',                    'type' => 'asset', 'order' => 1]);
        $ins(['parent_id' => $a14, 'name' => 'Produtos Acabados',              'type' => 'asset', 'order' => 2]);
        $ins(['parent_id' => $a14, 'name' => 'Insumos',                        'type' => 'asset', 'order' => 3]);
        $ins(['parent_id' => $a14, 'name' => 'Outros',                         'type' => 'asset', 'order' => 4]);

        $a2 = $ins(['parent_id' => $a,  'name' => 'Não Circulante',           'type' => 'asset', 'order' => 2]);

        $a21 = $ins(['parent_id' => $a2, 'name' => 'Contas a Receber',        'type' => 'asset', 'order' => 1]);
        $ins(['parent_id' => $a21, 'name' => 'Clientes',                       'type' => 'asset', 'order' => 1]);
        $ins(['parent_id' => $a21, 'name' => 'Outras Contas',                  'type' => 'asset', 'order' => 2]);

        $a22 = $ins(['parent_id' => $a2, 'name' => 'Investimentos',           'type' => 'asset', 'order' => 2]);
        $ins(['parent_id' => $a22, 'name' => 'Participações Societárias',      'type' => 'asset', 'order' => 1]);

        $a23 = $ins(['parent_id' => $a2, 'name' => 'Imobilizado',             'type' => 'asset', 'order' => 3]);
        $ins(['parent_id' => $a23, 'name' => 'Terrenos',                       'type' => 'asset', 'order' => 1]);
        $ins(['parent_id' => $a23, 'name' => 'Máquinas e Ferramentas',         'type' => 'asset', 'order' => 2]);
        $ins(['parent_id' => $a23, 'name' => 'Veículos',                       'type' => 'asset', 'order' => 3]);
        $ins(['parent_id' => $a23, 'name' => '(-) Depreciação Acumulada',      'type' => 'asset', 'order' => 4]);
        $ins(['parent_id' => $a23, 'name' => '(-) Amortização Acumulada',      'type' => 'asset', 'order' => 5]);

        $a24 = $ins(['parent_id' => $a2, 'name' => 'Intangível',              'type' => 'asset', 'order' => 4]);
        $ins(['parent_id' => $a24, 'name' => 'Marcas',                         'type' => 'asset', 'order' => 1]);
        $ins(['parent_id' => $a24, 'name' => 'Softwares',                      'type' => 'asset', 'order' => 2]);
        $ins(['parent_id' => $a24, 'name' => '(-) Amortização Acumulada',      'type' => 'asset', 'order' => 3]);

        // ── 2 PASSIVO ─────────────────────────────────────────────────────────
        $p = $ins(['parent_id' => null, 'name' => 'Passivo',           'type' => 'liability', 'order' => 2]);
        $p1 = $ins(['parent_id' => $p,  'name' => 'Circulante',        'type' => 'liability', 'order' => 1]);

        $p11 = $ins(['parent_id' => $p1, 'name' => 'Impostos e Contribuições a Recolher', 'type' => 'liability', 'order' => 1]);
        $ins(['parent_id' => $p11, 'name' => 'Simples a Recolher',     'type' => 'liability', 'order' => 1]);
        $ins(['parent_id' => $p11, 'name' => 'INSS',                   'type' => 'liability', 'order' => 2]);
        $ins(['parent_id' => $p11, 'name' => 'FGTS',                   'type' => 'liability', 'order' => 3]);

        $p12 = $ins(['parent_id' => $p1, 'name' => 'Contas a Pagar',  'type' => 'liability', 'order' => 2]);
        $ins(['parent_id' => $p12, 'name' => 'Fornecedores',           'type' => 'liability', 'order' => 1]);
        $ins(['parent_id' => $p12, 'name' => 'Outras Contas',          'type' => 'liability', 'order' => 2]);

        $p13 = $ins(['parent_id' => $p1, 'name' => 'Empréstimos Bancários', 'type' => 'liability', 'order' => 3]);
        $ins(['parent_id' => $p13, 'name' => 'Banco A - Operação X',   'type' => 'liability', 'order' => 1]);

        $p2 = $ins(['parent_id' => $p,  'name' => 'Não Circulante',   'type' => 'liability', 'order' => 2]);

        $p21 = $ins(['parent_id' => $p2, 'name' => 'Empréstimos Bancários', 'type' => 'liability', 'order' => 1]);
        $ins(['parent_id' => $p21, 'name' => 'Banco A - Operação X',  'type' => 'liability', 'order' => 1]);

        $p3 = $ins(['parent_id' => $p,  'name' => 'Patrimônio Líquido', 'type' => 'liability', 'order' => 3]);

        $p31 = $ins(['parent_id' => $p3, 'name' => 'Capital Social',  'type' => 'liability', 'order' => 1]);
        $ins(['parent_id' => $p31, 'name' => 'Capital Social Subscrito',   'type' => 'liability', 'order' => 1]);
        $ins(['parent_id' => $p31, 'name' => 'Capital Social a Realizar',  'type' => 'liability', 'order' => 2]);

        $p32 = $ins(['parent_id' => $p3, 'name' => 'Reservas',        'type' => 'liability', 'order' => 2]);
        $ins(['parent_id' => $p32, 'name' => 'Reservas de Capital',   'type' => 'liability', 'order' => 1]);
        $ins(['parent_id' => $p32, 'name' => 'Reservas de Lucros',    'type' => 'liability', 'order' => 2]);

        $p33 = $ins(['parent_id' => $p3, 'name' => 'Prejuízos Acumulados', 'type' => 'liability', 'order' => 3]);
        $ins(['parent_id' => $p33, 'name' => 'Prejuízos Acumulados de Exercícios Anteriores', 'type' => 'liability', 'order' => 1]);
        $ins(['parent_id' => $p33, 'name' => 'Prejuízos do Exercício Atual',                  'type' => 'liability', 'order' => 2]);

        // ── 3 CUSTOS E DESPESAS ───────────────────────────────────────────────
        $c = $ins(['parent_id' => null, 'name' => 'Custos e Despesas', 'type' => 'cost', 'order' => 3]);

        $c1 = $ins(['parent_id' => $c,  'name' => 'Custo dos Produtos Vendidos',   'type' => 'cost', 'order' => 1]);
        $c11 = $ins(['parent_id' => $c1, 'name' => 'Custos dos Materiais',         'type' => 'cost', 'order' => 1]);
        $ins(['parent_id' => $c11, 'name' => 'Custos dos Materiais Aplicados',     'type' => 'cost', 'order' => 1]);
        $c12 = $ins(['parent_id' => $c1, 'name' => 'Custos da Mão de Obra',        'type' => 'cost', 'order' => 2]);
        $ins(['parent_id' => $c12, 'name' => 'Salários',                            'type' => 'cost', 'order' => 1]);
        $ins(['parent_id' => $c12, 'name' => 'Encargos Sociais',                    'type' => 'cost', 'order' => 2]);

        $c2 = $ins(['parent_id' => $c,  'name' => 'Custo das Mercadorias Vendidas', 'type' => 'cost', 'order' => 2]);
        $c21 = $ins(['parent_id' => $c2, 'name' => 'Custo das Mercadorias',         'type' => 'cost', 'order' => 1]);
        $ins(['parent_id' => $c21, 'name' => 'Custo das Mercadorias Vendidas',      'type' => 'cost', 'order' => 1]);

        $c3 = $ins(['parent_id' => $c,  'name' => 'Custo dos Serviços Prestados',  'type' => 'cost', 'order' => 3]);
        $c31 = $ins(['parent_id' => $c3, 'name' => 'Custo dos Serviços',           'type' => 'cost', 'order' => 1]);
        $ins(['parent_id' => $c31, 'name' => 'Materiais Aplicados',                'type' => 'cost', 'order' => 1]);
        $ins(['parent_id' => $c31, 'name' => 'Mão de Obra',                        'type' => 'cost', 'order' => 2]);
        $ins(['parent_id' => $c31, 'name' => 'Encargos Sociais',                   'type' => 'cost', 'order' => 3]);

        $c4 = $ins(['parent_id' => $c,  'name' => 'Despesas Operacionais',         'type' => 'expense', 'order' => 4]);
        $c41 = $ins(['parent_id' => $c4, 'name' => 'Despesas Gerais',              'type' => 'expense', 'order' => 1]);
        $ins(['parent_id' => $c41, 'name' => 'Mão de Obra',                        'type' => 'expense', 'order' => 1]);
        $ins(['parent_id' => $c41, 'name' => 'Encargos Sociais',                   'type' => 'expense', 'order' => 2]);
        $ins(['parent_id' => $c41, 'name' => 'Aluguéis',                           'type' => 'expense', 'order' => 3]);

        $c5 = $ins(['parent_id' => $c,  'name' => 'Perdas de Capital',             'type' => 'expense', 'order' => 5]);
        $c51 = $ins(['parent_id' => $c5, 'name' => 'Baixa de Bens do Ativo Não Circulante', 'type' => 'expense', 'order' => 1]);
        $ins(['parent_id' => $c51, 'name' => 'Custos de Alienação de Investimentos', 'type' => 'expense', 'order' => 1]);
        $ins(['parent_id' => $c51, 'name' => 'Custos de Alienação do Imobilizado',   'type' => 'expense', 'order' => 2]);

        // ── 4 RECEITAS ────────────────────────────────────────────────────────
        $r = $ins(['parent_id' => null, 'name' => 'Receitas',                      'type' => 'revenue', 'order' => 4]);

        $r1 = $ins(['parent_id' => $r,  'name' => 'Receita Líquida',              'type' => 'revenue', 'order' => 1]);
        $r11 = $ins(['parent_id' => $r1, 'name' => 'Receita Bruta de Vendas',     'type' => 'revenue', 'order' => 1]);
        $ins(['parent_id' => $r11, 'name' => 'De Mercadorias',                     'type' => 'revenue', 'order' => 1]);
        $ins(['parent_id' => $r11, 'name' => 'De Produtos',                        'type' => 'revenue', 'order' => 2]);
        $ins(['parent_id' => $r11, 'name' => 'De Serviços Prestados',              'type' => 'revenue', 'order' => 3]);
        $r12 = $ins(['parent_id' => $r1, 'name' => 'Deduções da Receita Bruta',   'type' => 'revenue', 'order' => 2]);
        $ins(['parent_id' => $r12, 'name' => 'Devoluções',                         'type' => 'revenue', 'order' => 1]);
        $ins(['parent_id' => $r12, 'name' => 'Serviços Cancelados',                'type' => 'revenue', 'order' => 2]);

        $r2 = $ins(['parent_id' => $r,  'name' => 'Outras Receitas Operacionais', 'type' => 'revenue', 'order' => 2]);
        $r21 = $ins(['parent_id' => $r2, 'name' => 'Vendas de Ativos Não Circulantes', 'type' => 'revenue', 'order' => 1]);
        $ins(['parent_id' => $r21, 'name' => 'Receitas de Alienação de Investimentos', 'type' => 'revenue', 'order' => 1]);
        $ins(['parent_id' => $r21, 'name' => 'Receitas de Alienação do Imobilizado',   'type' => 'revenue', 'order' => 2]);

        DB::statement('SET search_path TO gabinete_master,maps,public');
    }

    private function dropInSchema(string $schema): void
    {
        DB::statement("SET search_path TO \"{$schema}\"");
        Schema::dropIfExists('fin_accounts');
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
