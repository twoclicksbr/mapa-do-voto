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
            $table->text('description')->nullable();
            $table->string('type'); // asset, liability, revenue, expense, cost
            $table->string('nature')->default('analytic'); // analytic, synthetic
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
                'code'        => null,
                'description' => null,
                'nature'      => 'analytic',
                'active'      => true,
                'created_at'  => $now,
                'updated_at'  => $now,
            ], $data));
        };

        // ── 1 RECEITAS ────────────────────────────────────────────────────────
        $r = $ins(['parent_id' => null, 'name' => 'Receitas', 'type' => 'revenue', 'nature' => 'synthetic', 'order' => 1,
            'description' => 'Todas as entradas de recursos do gabinete e da campanha']);

        $ins(['parent_id' => $r, 'name' => 'Doações de Pessoas Físicas',            'type' => 'revenue', 'order' => 1,
            'description' => 'Contribuições financeiras recebidas de eleitores e apoiadores']);
        $ins(['parent_id' => $r, 'name' => 'Fundo Partidário (FEFC)',               'type' => 'revenue', 'order' => 2,
            'description' => 'Recursos do Fundo Especial de Financiamento de Campanha repassados pelo partido']);
        $ins(['parent_id' => $r, 'name' => 'Recursos Próprios do Candidato',        'type' => 'revenue', 'order' => 3,
            'description' => 'Valores investidos diretamente pelo próprio candidato na campanha']);
        $ins(['parent_id' => $r, 'name' => 'Rendimentos de Aplicações Financeiras', 'type' => 'revenue', 'order' => 4,
            'description' => 'Juros e rendimentos gerados por recursos aplicados em conta ou investimentos']);
        $ins(['parent_id' => $r, 'name' => 'Outras Receitas',                       'type' => 'revenue', 'order' => 5,
            'description' => 'Entradas diversas não enquadradas nas categorias anteriores']);

        $r2 = $ins(['parent_id' => $r, 'name' => 'Caixa', 'type' => 'revenue', 'nature' => 'synthetic', 'order' => 6,
            'description' => 'Dinheiro em espécie disponível no comitê ou gabinete']);
        $ins(['parent_id' => $r2, 'name' => 'Caixa Geral', 'type' => 'revenue', 'order' => 1,
            'description' => 'Fundo de caixa para pequenas despesas do dia a dia']);

        $r3 = $ins(['parent_id' => $r, 'name' => 'Bancos', 'type' => 'revenue', 'nature' => 'synthetic', 'order' => 7,
            'description' => 'Saldos disponíveis em contas bancárias']);
        $ins(['parent_id' => $r3, 'name' => 'Conta Corrente', 'type' => 'revenue', 'order' => 1,
            'description' => 'Saldo na conta corrente utilizada para movimentações da campanha']);

        $r4 = $ins(['parent_id' => $r, 'name' => 'Aplicações Financeiras', 'type' => 'revenue', 'nature' => 'synthetic', 'order' => 8,
            'description' => 'Recursos investidos temporariamente enquanto aguardam utilização']);
        $ins(['parent_id' => $r4, 'name' => 'Renda Fixa', 'type' => 'revenue', 'order' => 1,
            'description' => 'CDB, Tesouro Direto ou poupança com liquidez imediata']);

        // ── 2 DESPESAS ────────────────────────────────────────────────────────
        $d = $ins(['parent_id' => null, 'name' => 'Despesas', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 2,
            'description' => 'Todos os gastos do gabinete e da campanha']);

        $d1 = $ins(['parent_id' => $d, 'name' => 'Pessoal', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 1,
            'description' => 'Gastos com equipe, colaboradores e obrigações trabalhistas']);
        $ins(['parent_id' => $d1, 'name' => 'Assessores',    'type' => 'expense', 'order' => 1,
            'description' => 'Remuneração de assessores políticos e técnicos']);
        $ins(['parent_id' => $d1, 'name' => 'Estagiários',   'type' => 'expense', 'order' => 2,
            'description' => 'Bolsas e auxílios pagos a estagiários']);
        $ins(['parent_id' => $d1, 'name' => 'Encargos Sociais', 'type' => 'expense', 'order' => 3,
            'description' => 'INSS, FGTS e demais encargos sobre a folha de pagamento']);

        $d2 = $ins(['parent_id' => $d, 'name' => 'Comunicação e Marketing', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 2,
            'description' => 'Gastos com divulgação, imagem e presença digital']);
        $ins(['parent_id' => $d2, 'name' => 'Marketing Digital',   'type' => 'expense', 'order' => 1,
            'description' => 'Impulsionamento em redes sociais, Google Ads e campanhas online']);
        $ins(['parent_id' => $d2, 'name' => 'Material Gráfico',    'type' => 'expense', 'order' => 2,
            'description' => 'Panfletos, banners, camisetas, adesivos e demais impressos']);
        $ins(['parent_id' => $d2, 'name' => 'Produção de Conteúdo', 'type' => 'expense', 'order' => 3,
            'description' => 'Criação de vídeos, fotos, textos e identidade visual']);
        $ins(['parent_id' => $d2, 'name' => 'Publicidade',         'type' => 'expense', 'order' => 4,
            'description' => 'Espaços em rádio, TV, outdoor e mídia tradicional']);

        $d3 = $ins(['parent_id' => $d, 'name' => 'Eventos', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 3,
            'description' => 'Custos com organização e realização de eventos políticos']);
        $ins(['parent_id' => $d3, 'name' => 'Comícios',          'type' => 'expense', 'order' => 1,
            'description' => 'Estrutura, sonorização e logística de comícios']);
        $ins(['parent_id' => $d3, 'name' => 'Reuniões',          'type' => 'expense', 'order' => 2,
            'description' => 'Espaço, coffee break e materiais para reuniões com lideranças']);
        $ins(['parent_id' => $d3, 'name' => 'Eventos de Campanha', 'type' => 'expense', 'order' => 3,
            'description' => 'Caminhadas, carreatas, lançamentos e demais eventos eleitorais']);

        $d4 = $ins(['parent_id' => $d, 'name' => 'Transporte', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 4,
            'description' => 'Gastos com deslocamento da equipe e do candidato']);
        $ins(['parent_id' => $d4, 'name' => 'Combustível',       'type' => 'expense', 'order' => 1,
            'description' => 'Abastecimento de veículos próprios utilizados na campanha']);
        $ins(['parent_id' => $d4, 'name' => 'Aluguel de Veículos', 'type' => 'expense', 'order' => 2,
            'description' => 'Locação de carros, vans e ônibus para deslocamentos']);

        $d5 = $ins(['parent_id' => $d, 'name' => 'Administrativo', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 5,
            'description' => 'Despesas operacionais do comitê e escritório do gabinete']);
        $ins(['parent_id' => $d5, 'name' => 'Aluguel de Comitê/Escritório', 'type' => 'expense', 'order' => 1,
            'description' => 'Locação do espaço físico do comitê de campanha ou gabinete']);
        $ins(['parent_id' => $d5, 'name' => 'Energia Elétrica',  'type' => 'expense', 'order' => 2,
            'description' => 'Conta de energia elétrica do comitê ou escritório']);
        $ins(['parent_id' => $d5, 'name' => 'Água e Saneamento', 'type' => 'expense', 'order' => 3,
            'description' => 'Conta de água e taxa de saneamento do imóvel']);
        $ins(['parent_id' => $d5, 'name' => 'Telefonia e Internet', 'type' => 'expense', 'order' => 4,
            'description' => 'Planos de telefone fixo, celular e acesso à internet']);
        $ins(['parent_id' => $d5, 'name' => 'Material de Escritório', 'type' => 'expense', 'order' => 5,
            'description' => 'Papelaria, cartuchos, pastas e insumos de escritório']);

        $d6 = $ins(['parent_id' => $d, 'name' => 'Jurídico', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 6,
            'description' => 'Despesas com assessoria e representação jurídica eleitoral']);
        $ins(['parent_id' => $d6, 'name' => 'Honorários Advocatícios', 'type' => 'expense', 'order' => 1,
            'description' => 'Pagamento a advogados eleitorais e escritórios jurídicos']);

        $d7 = $ins(['parent_id' => $d, 'name' => 'Pesquisa Eleitoral', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 7,
            'description' => 'Contratação de pesquisas para embasar estratégia de campanha']);
        $ins(['parent_id' => $d7, 'name' => 'Pesquisa de Intenção de Voto', 'type' => 'expense', 'order' => 1,
            'description' => 'Levantamento quantitativo de preferência do eleitorado']);
        $ins(['parent_id' => $d7, 'name' => 'Pesquisa de Rejeição',         'type' => 'expense', 'order' => 2,
            'description' => 'Avaliação dos índices de rejeição do candidato por segmento']);

        $d8 = $ins(['parent_id' => $d, 'name' => 'Contas a Pagar', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 8,
            'description' => 'Valores devidos a fornecedores e prestadores de serviço']);
        $ins(['parent_id' => $d8, 'name' => 'Fornecedores', 'type' => 'expense', 'order' => 1,
            'description' => 'Faturas pendentes com gráficas, agências e demais fornecedores']);
        $ins(['parent_id' => $d8, 'name' => 'Outras Contas', 'type' => 'expense', 'order' => 2,
            'description' => 'Demais obrigações financeiras não classificadas']);

        $d9 = $ins(['parent_id' => $d, 'name' => 'Obrigações Trabalhistas', 'type' => 'expense', 'nature' => 'synthetic', 'order' => 9,
            'description' => 'Valores devidos à equipe e aos órgãos previdenciários']);
        $ins(['parent_id' => $d9, 'name' => 'Salários a Pagar',    'type' => 'expense', 'order' => 1,
            'description' => 'Remunerações da equipe ainda não quitadas']);
        $ins(['parent_id' => $d9, 'name' => 'Encargos a Recolher', 'type' => 'expense', 'order' => 2,
            'description' => 'INSS e FGTS provisionados aguardando recolhimento']);

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
