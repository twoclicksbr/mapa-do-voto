# CLAUDE.md — Mapa do Voto
<!-- Atualizado em: 27/03/2026 (Agenda: all_day em event_types + people_id nullable + recurrence em events — migrations 000077-000079; multi-pessoa em eventos via event_people; EventModal Google-style; APP_TIMEZONE=America/Sao_Paulo) -->
<!-- https://github.com/twoclicksbr/mapa-do-voto/blob/main/CLAUDE.md -->

> Plataforma de mapas geoespaciais para inteligência eleitoral. Permite visualizar dados de votação, atendimentos e estratégias de campanha em mapa interativo.

---

## Leitura obrigatória

Sempre ler os dois arquivos abaixo ao iniciar uma nova conversa:

- https://github.com/twoclicksbr/mapa-do-voto/blob/main/CLAUDE.md
- https://github.com/twoclicksbr/mapa-do-voto/blob/main/DATABASE.md

---

## Inputs Monetários

O projeto tem dois modos de input de valor monetário. Ao implementar um novo campo de valor, perguntar qual modo aplicar.

### Modo Calculadora
Dígitos empurram da direita para a esquerda (shift right nos centavos). Teclas aceitas: `0–9`, `,` ou `.` (entra em modo decimal), `Backspace`. `caret-transparent` no input (cursor invisível).

**Comportamento:**
- Digitar `1` → `0,01`
- Digitar `1`, `2` → `0,12`
- Digitar `1`, `2`, `3` → `1,23`
- Digitar `,` → ativa `decMode`, próximos dígitos vão para centavos
- `Backspace` → remove último dígito

**Implementação:** `makeCalcKeyDown(valueProp, setValue, decMode, setDecMode, afterUpdate?, freshRef?)` em `fin-title-modal.tsx` — função reutilizável que retorna um handler `onKeyDown`. Estado `decMode` + `freshRef` (MutableRefObject<boolean>) por campo. Funções auxiliares: `maskCurrency(digits)` (formata string de dígitos puros), `parseCurrency(masked)` (converte máscara para float), `numberToMask(value)` (float → string formatada).

**Onde usar:** campos de valor monetário na aba Baixar (juros R$, multa R$, desconto R$, valor líquido); saldo bancário no `fin-bank-modal.tsx`.

---

### Modo Natural
O usuário digita normalmente; a vírgula separa inteiro dos centavos. Cada lado é independente. Auto-completa centavos ao sair do campo (`onBlur`).

**Comportamento:**
- `123` → `R$ 123,00`
- `123,5` → `R$ 123,50`
- `123,54` → `R$ 123,54`
- `1234` → `R$ 1.234,00`
- `1234,5` → `R$ 1.234,50`
- `1234,54` → `R$ 1.234,54`

**Implementação:** `maskCurrencyNatural(value)` — limpa não-numéricos exceto vírgula, separa em `[inteiro, centavos]`, formata inteiro com separador de milhar (`.`), completa centavos com zeros até 2 casas; `parseCurrency(masked)` para converter de volta a float.

**Onde usar:** filtros, campo de valor principal de título financeiro (criação/edição), qualquer campo onde o usuário digita o valor diretamente sem interação dígito-a-dígito. Também existe `maskPercentNatural`/`maskPercentNaturalBlur` para campos de percentual (juros/multa/desconto em % na aba Baixar).

---

- NÃO fazer git add/commit/push sem ser solicitado
- Implementar SOMENTE o que for pedido na tarefa
- Ao final de cada tarefa, gerar um resumo compacto em um único bloco de código para copiar com um clique
- **NÃO rodar seeders** (`db:seed`) sem ser solicitado — o projeto não utiliza seed inicial; dados são inseridos manualmente ou via importação TSE
- **PROIBIDO** executar qualquer comando que destrua o banco inteiro: `migrate:refresh`, `migrate:reset`, `migrate:fresh`, `db:wipe`. A senha é `Alex1985@`. Solicitar a senha em **qualquer** uma das situações abaixo:
  - O usuário pedir para **executar** um desses comandos
  - O usuário pedir para **gerar** um desses comandos (ex: "me manda o comando")
  - O Claude achar que deve rodar um desses comandos por conta própria

## Regras do Chat (claude.ai)

- Não usar caixas de perguntas (widgets de seleção). Sempre perguntar em texto direto.
- Ao enviar prompts para o Claude Code, sempre envolver o prompt inteiro em um único bloco de código para que o usuário copie com um clique. Texto explicativo fica fora do bloco.
- Não se antecipar — aguardar direção explícita antes de sugerir ou implementar algo.

---

## Repositório

- **GitHub:** https://github.com/twoclicksbr/mapa-do-voto.git

---

## Decisão Arquitetural

Mapa do Voto é um produto **independente** da TwoClicks:
- Clientes são políticos — perfil diferente do SaaS genérico
- Backend simples — candidatos, partidos, dados TSE, autenticação
- **Dois bancos PostgreSQL separados:** `cm_politico` (schema `gabinete_master` — auth/tenants) e `cm_maps` (schema `maps` — dados eleitorais)
- **Multi-tenant por subdomínio:** `{slug}.mapadovoto.com` → identifica o gabinete via `gabinete_master.tenants.slug`
- Marca própria: **Mapa do Voto** | Domínio: `mapadovoto.com`

---

## Visão do Produto

### Funcionalidades planejadas

- Visualização geográfica de votos por município/seção (heatmap)
- Split view — comparar candidato vs concorrente lado a lado
- Autocomplete de busca de candidato para o lado direito do split
- Atendimentos — cada atendimento do político vira um pin no mapa *(guardado)*
- Módulo de Inteligência de Alianças — relatório que rankeia melhores alianças *(guardado)*

---

## Módulo Eleitoral

### Dados do TSE (gratuitos)

Fonte: https://dadosabertos.tse.jus.br

- Candidatos: nome, foto, partido, número, redes sociais, bens, certidões criminais
- Resultados por seção eleitoral desde 2008 (CSV por UF)
- Eleitorado por local de votação
- API JSON em tempo real no dia da eleição

### Estratégia de importação TSE

- Começar por SP 2024, expandir estado a estado via background jobs
- CSV → Laravel processa → PostgreSQL → descarta CSV
- Dados processados estimados: 20-40GB para histórico nacional

### Dados TSE Importados

| UF | Ano | Tabela staging | Linhas | Status |
|---|---|---|---|---|
| SP | 2024 | tse_votacao_secao_2024 | 9.611.090 | ✅ importado |
| SP | 2022 | tse_votacao_secao_2022 | 18.761.482 | ✅ importado |

**Total votes:** 28.372.572 linhas

Comandos de importação:
- `php artisan tse:import-votacao-raw {file} {--uf=} {--ano=}` — popula staging
- `php artisan tse:import-cities {--uf=} {--ano=}` — popula cities
- `php artisan tse:import-zones {--uf=} {--ano=}` — popula zones
- `php artisan tse:import-voting-locations {--uf=} {--ano=}` — popula voting_locations
- `php artisan tse:import-sections {--uf=} {--ano=}` — popula sections
- `php artisan tse:import-votes {--uf=} {--ano=}` — popula votes (PDO cursor, chunk 2000)
- `php artisan tse:import-state-geometry {uf}` — baixa GeoJSON do estado via giuliano-macedo/geodata-br-states e salva no campo geometry da tabela states
- `php artisan db:backup` — backup via pg_dump → storage/app/backups/

### Cliente piloto — Neto Bota (Caraguatatuba/SP)

- Nome completo: José Mendes de Souza Neto Bota
- Partido: PL | Cargo 2026: Deputado Estadual
- Histórico: Vereador 2008 ✅ | Vereador 2012 ✅ | Dep. Estadual 2022 ❌ suplente | Prefeito 2024 ❌ 2º lugar

#### Dados confirmados no banco
- **Neto Bota** | PL | Prefeito Caraguatatuba 2024 | 20.313 votos | sq_candidato: 250002019567
- **Neto Bota** | PP | Dep. Estadual SP 2022 | 28.663 votos (estado) / 18.950 votos (Caraguatatuba)

---

## Escalas de Mapa por Cargo

| Cargo | Escala | Área |
|---|---|---|
| Vereador / Prefeito | Municipal | Seções/bairros da cidade |
| Dep. Estadual / Dep. Federal / Senador / Governador | Estadual | Municípios do estado |
| Presidente | Nacional | Municípios do Brasil |

O sistema detecta a escala automaticamente pelo cargo do candidato.

---

## Alianças por Cargo

Cada cargo faz aliança com **todos dentro da sua área de disputa**:

- **Vereador** → prefeito + todos do município
- **Prefeito** → todos do município + dep. estaduais + dep. federais
- **Dep. Estadual / Federal / Senador** → todos os municípios do estado
- **Governador** → todos do estado, todos os níveis
- **Presidente** → todos do Brasil, todos os níveis

---

## Modelo de Negócio

### Precificação por eleição

| Cargo | Preço |
|---|---|
| Vereador | R$ 1.497 |
| Prefeito | R$ 2.997 |
| Dep. Estadual / Federal | R$ 4.997 |
| Senador / Governador | R$ 9.997 |
| Presidente | sob consulta |

### Go-to-market 2026

- Eleições estaduais/federais — ticket maior
- Canal: marqueteiros eleitorais com carteira de candidatos
- Margem ~95% (dados TSE gratuitos, VPS pago até 2027)

---

## Stack

- **Frontend:** React 19 + Vite + TypeScript + Metronic v9.4.5 (Layout 33) + Tailwind CSS 4
- **Mapa:** Leaflet + react-leaflet + CartoDB Positron
- **Backend:** Laravel 12 + Sanctum v4.3.1 (independente da TwoClicks)
- **DB:** PostgreSQL 17 (dois bancos: `cm_politico` + `cm_maps`)
- **Auth:** Sanctum token-based (Bearer)

---

## Estrutura Local

```
C:\Herd\mapa-do-voto\
├── api\           → Laravel 12 (backend REST API)
├── maps\          → Vite + React + Metronic (app do mapa)
├── site\          → Next.js (landing page — não iniciada ainda)
├── tse\           → Scripts/dados de importação TSE
├── mkt\           → Materiais de marketing (não versionado no deploy)
├── start.bat      → Inicia todos os serviços locais (Herd + Next.js porta 3000 + Vite porta 5173) em janelas cmd separadas
├── run_import.bat → Script de importação TSE (Windows)
└── .git
```

> ⚠️ `cm_maps_dump.sql` (2.7GB) está na raiz — deve ser adicionado ao `.gitignore`.

---

## Frontend (maps\)

### Layout em uso

**Layout 33** do Metronic. URL local: `http://localhost:5173`

**Sidebar fixa removida do desktop** — `wrapper.tsx` não monta `<Sidebar />` nem aplica padding lateral; mapa ocupa 100% da largura. Sidebar continua acessível em mobile via Sheet (Header).

### Terminologia do projeto

- **background-maps** = o `div` wrapper do `<MapaDoVotoMap />` em `src/pages/home/page.tsx`

### Arquivos chave

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/home/page.tsx` | Página principal. Sistema de abas: Gabinetes (só `master`), Mapa, Atendimentos, Agenda, Alianças, Finanças, Configurações. Detecta `isMaster` pelo subdomínio. Aba Gabinetes carrega `GET /api/tenants` e exibe `GabinetesDataGrid`. Aba Configurações exibe `AppMegaMenu` com seções: Permissões (DataGrid + Modal com DnD), Pessoas (DataGrid + Modal), Tipos de Pessoa, Tipos de Contato, Tipos de Endereço, Tipos de Documento. Botão split só visível no `isMaster`. Navbar exibe dropdown de seleção de gabinete. Estado `finTitleInitialTab` controla qual aba do `FinTitleModal` abre: `onEdit` → `"geral"`, `onBaixar` → `"baixar"`; resetado para `"geral"` ao fechar. `FinCompositionModal.onConfirm` chama `POST /fin-titles/compose` e recarrega o DataGrid correspondente. `FinTitlesFilterModal` abre ao clicar em Pesquisar nos DataGrids de títulos; filtragem client-side via `applyFinFilters(list, filters)` + `useMemo` — **estados separados por tipo**: `finTitlesFilters` (expense) e `finTitlesIncomeFilters` (income). `finTitlesClearKey`/`finTitlesIncomeClearKey` — incrementados após reload ou bulk cancel para resetar seleção. Seção `fin-extract`: `FinExtractFilterModal` (Pesquisar) + `FinExtractModal` (Novo Lançamento); filtragem client-side via `applyExtractFilters(list, filters)` + `useMemo`. **Seção `fin-dashboard`**: renderiza `<FinDashboardTab />`. **Seção `fin-wallet`**: renderiza `<FinWalletTab />`. **Seção `settings-dashboard`** (Configurações): renderiza `<SettingsDashboardTab />`. **Modais de pesquisa avançada** em todas as seções: Gabinetes (`GabinetesFilterModal`), Tipos de Pessoa, Tipos de Contato, Tipos de Endereço, Tipos de Documento, Pessoas (`PeopleFilterModal` com `applyPeopleFilters()` + `matchesDateFilter()`), Permissões, Bancos (`FinBanksFilterModal`), Tipos de Modalidade (`FinPaymentMethodTypesFilterModal`), **Modalidades** (`FinPaymentMethodsFilterModal` com `applyFinPaymentMethodsFilters()` + `filteredFinPaymentMethods`), **Departamentos** (`DepartmentsFilterModal` com `applyDepartmentsFilters()` + `filteredDepartments`), **Plano de Contas** (`FinAccountsFilterModal` com `filterFinAccountTree()` + `flattenFinAccounts()` + `filteredFinAccounts`), Tipos de Evento (`EventTypesFilterModal`) — cada seção tem estado `*FilterOpen` + `*Filters`. Todos os footers inline foram substituídos pelo componente `PageFooter`. Aba `metrics` (Agenda) renderiza `<AgendaTab />`. Layout: `html/body/#root` com `overflow: hidden`; containers internos usam `flex-1 min-h-0` |
| `src/components/map/mapa-do-voto-map.tsx` | Mapa Leaflet + CandidateCard + StatsCard (overlay flutuante) + CitySearch interno + heatmap + botões flutuantes. `CitySearch` interno: prop `stateUf`, busca normalizada (unaccent via `normalizeName`), exibe "CIDADE - UF". `StatsCard`: exibe "0 votos nesta cidade" quando city sem votos. `MapCore`: `focusedCityBoundsRef` guarda bounds da cidade focada (clique ou CitySearch); crosshair usa cidade quando disponível senão estado; `clearCityHighlight` e toggle "Exibir Cidades" voltam zoom ao estado via `polygonLayerRef` com maxZoom:7. Termômetro do heatmap: tooltip hover com valor abreviado (250/2.5k/1.5m votos) seguindo mouse verticalmente. `fmtShort()` formata números. |
| `src/components/map/candidate-search.tsx` | Autocomplete com avatar, PartyBadge, CandidateInfo — variants: `map`, `sidebar`, `modal`; no modal busca apenas id/name/photo_url sem party/role; dropdown com `onMouseDown`+`preventDefault` para funcionar dentro de Radix Dialog; placeholder "Digite nome, cargo, ano, cidade, UF ou partido"; clicar em qualquer lugar do campo foca o input |
| `src/components/mapa-do-voto/sidebar.tsx` | Painel lateral: stats reais, turno dinâmico, badge Status TSE flutuante |
| `src/components/map/active-candidate-context.tsx` | Contexto global: activeCandidate, setActiveCandidate, showCities, setShowCities, showCard, setShowCard, mapClickedCity (inclui city_id), focusCityOnMap, clearCityHighlight |
| `src/components/auth/login-modal.tsx` | Modal de login automático; usa logo SVG `/media/logo/logo.svg`; exibe link "Crie sua conta!" quando gabinete não encontrado |
| `src/components/auth/login-modal-context.tsx` | Contexto global do modal. Escuta o evento `auth:logout` (disparado pelo interceptor 401 do axios) — redefine user/loggedIn e reabre o modal de login |
| `src/components/layout/active-tab-context.tsx` | Contexto `ActiveTabProvider`/`useActiveTab` — persiste aba ativa no `localStorage` (chave `mapadovoto:activeTab`); default: `overview` |
| `src/components/gabinetes/gabinetes-data-grid.tsx` | Data grid de tenants: colunas ID, Nome (clicável → `onEdit`), Subdomínio (link externo), Validade (badge com alerta vencimento), Status, Ações (editar/excluir); prop `onEdit` |
| `src/components/gabinetes/gabinete-create-modal.tsx` | Modal de criação de gabinete com **4 steps** + timeline horizontal: Step 1 Dados Pessoais (name, birth_date, type_people_id, active); Step 2 Acesso (email + senha com indicador de força 5 requisitos + confirmação); Step 3 grid 2 cols: Nome do Gabinete + Candidato (busca em `maps.candidates` via `/map-candidates/search`) / Subdomínio (2/3, check em tempo real) + Validade (1/3, `BirthDatePicker` minYear=hoje maxYear=hoje+10, default hoje+7d) + RadioGroup Plano (Mapa=`has_schema:false` default / Mapa+CRM=`has_schema:true`); Step 4 Candidaturas (multi-select cards via `/map-candidates/{id}/candidacies`). Submit: POST /people → POST /people/{id}/user → POST /tenants (com `name=gabineteName`, `has_schema`) → POST /people/{id}/candidacies. Rollback automático deleta person órfão se passo 2+ falhar. |
| `src/components/reui/timeline.tsx` | Timeline horizontal customizada (sem shadcn CLI) — componentes: `Timeline`, `TimelineItem`, `TimelineHeader`, `TimelineSeparator`, `TimelineIndicator`, `TimelineTitle`, `TimelineContent`. Usa React context para `value` (step atual) e `orientation`. |
| `src/components/gabinetes/gabinete-edit-modal.tsx` | Modal de edição de tenant |
| `src/components/common/app-mega-menu.tsx` | Wrapper reutilizável do MegaMenu do Layout 1 — props: `onNavigate`, `activeSection` (destaca o botão do módulo ativo) |
| `src/components/people/people-data-grid.tsx` | DataGrid de pessoas: colunas ID, Avatar, Nome (clicável), Aniversário (com ícone `PartyPopper` pulsante no dia), Tipo, Status, Ações. Interface `Person` inclui `created_at?`, `updated_at?`, `deleted_at?`, `contacts[]?`, `documents[]?`, `addresses[]?` (carregados inline pela API) |
| `src/components/people/people-modal.tsx` | Modal de pessoas: Create (small) + Detail (large 2 painéis). Abas: Geral, Contatos, Endereços, Documentos, Notas, Arquivos, Usuário, Permissões. Aba Endereços: layout 2 colunas com ViaCEP + mapa Leaflet; CEP armazenado como dígitos puros (formatado apenas na exibição). Aba Contatos: quando tipo selecionado for WhatsApp ou qualquer tipo com máscara, salva dígitos puros; exibe WhatsApp com `formatPhoneNumber` (`react-phone-number-input`). Aba Permissões: grid 3 colunas de Frame cards com Checkbox por ação. **Auto-evento de aniversário**: ao criar pessoa com `birth_date` → cria `POST /events` (type Aniversário, modulo='people', all_day=true, recurrence='yearly'); ao editar e alterar `birth_date` → upsert do evento existente ou cria novo. |
| `src/components/people/birth-date-picker.tsx` | Date picker customizado baseado no `@reui/p-calendar-26` — Popover + Calendar com navegação mês/ano, locale ptBR, formato DD/MM/YYYY; props opcionais `minYear` (default 1920) e `maxYear` (default ano atual); validação usa `startDate`/`endDate` dinâmicos; input estilizado com `shadow-xs`, `transition-[color,box-shadow]`, `focus-visible:ring-[3px]`; size sm: `h-7 px-2.5 text-xs`; disabled: `opacity-60` |
| `src/components/people/people-files-tab.tsx` | Aba de arquivos reutilizável. Prop `basePath` opcional (default `/people/{personId}/files`) — permite usar o componente para qualquer entidade (ex: `basePath=/files/fin_title/{id}` no `FinTitleModal`). CRUD: upload, download, delete, lightbox de imagens; views grid/lista |
| `src/components/reui/phone-input.tsx` | Input de telefone com seletor de país — usa `react-phone-number-input` + Popover + ScrollArea; `defaultCountry="BR"`; sem dependência de combobox |
| `src/components/permission-actions/permission-actions-data-grid.tsx` | DataGrid de permission_actions: agrupado por módulo com expand/collapse, DnD (`@dnd-kit`) para reordenar módulos e ações dentro de módulos; persistência via `PUT /permission-actions/reorder` |
| `src/components/permission-actions/permission-actions-modal.tsx` | Modal de criação/edição de permission_action: campos module (chave), name_module, action (chave), name_action, description |
| `src/components/type-people/` | CRUD de tipos de pessoa (DataGrid + Modal) |
| `src/components/type-contacts/` | CRUD de tipos de contato (DataGrid + Modal) |
| `src/components/type-addresses/` | CRUD de tipos de endereço (DataGrid + Modal) |
| `src/components/type-documents/` | CRUD de tipos de documento (DataGrid + Modal) |
| `src/components/financeiro/fin-mega-menu.tsx` | NavigationMenu da aba Finanças — seções: Títulos a Pagar, Bancos, Modalidades, Tipos de Modalidade, Departamentos, Plano de Contas, Extrato, **Carteira** (`fin-wallet`); persiste `finSection` no `localStorage` (`mapadovoto:finSection`) |
| `src/components/financeiro/fin-titles-data-grid.tsx` | DataGrid de títulos financeiros (FinTitle). Interface inclui `reversed_at` e `cancelled_at`. `onSelectionChange(count, allPending, selectedIds, allSamePeople, selectedTitles)` — usa `useRef` para evitar loop infinito com callbacks inline. Prop `clearSelectionKey` — incrementar reseta seleção (usado após bulk cancel e reload). Ações em massa: **Status → Cancelar** (visível só quando `allPending`); **Composição** (visível quando `allPending && allSamePeople`). Ações por linha: `onEdit` (lápis) + `onBaixar` (ArrowDownToLine, verde — visível apenas quando `status === "pending"`). Botão Excluir removido. Coluna `id` removida. Linha expandida: componente `ExpandedContent` renderiza tabela de eventos (Banco, Conta Financeira, Modalidade, Evento, Data, Valor) para títulos paid/partial/reversed/cancelled — mostra linhas de Baixa, Estorno ou Cancelamento. Ícones `SquarePlusIcon`/`SquareMinusIcon` para expand/collapse. |
| `src/components/financeiro/fin-extract-data-grid.tsx` | DataGrid do extrato financeiro. Dois modos de visualização: **grid** (TanStack Table, paginado) e **timeline** (duas colunas: saídas à esquerda, entradas à direita, dot central). Props: `entries`, `initialBalance` (saldo inicial da última `fin_bank_balances` por banco), `isLoading`, `view`. Colunas: Data, Pessoa, Conta, Banco, Modalidade, Origem (badge: Manual/Baixa/Estorno), Entrada, Saída. `TimelineCard` exibe título/pessoa, data, conta, banco, modalidade, badge origem. Footer: exibe **Saldo Inicial** (quando disponível), Entradas, Saídas, **Saldo Final** (= saldo inicial + entradas − saídas) ou "Saldo" (somente se não houver saldo inicial); breakdown por modalidade em grid 4 colunas alinhadas. Exporta `FinExtractEntry`, `ExtractView`, `ExtractViewToggle`, `EXTRACT_VIEW_KEY`. |
| `src/components/financeiro/fin-titles-filter-modal.tsx` | Modal de pesquisa avançada de títulos. Prop `titleType: 'income' \| 'expense'`. Filtros: Nº do Título (invoice_number), Pessoa (autocomplete), Nº Documento, Status (multi-select com badges — popover com `tempStatuses`), campo de data (seletor: Cadastro/Emissão/Vencimento/Baixa/Estorno/Cancelamento) + DateSelector; **Banco** (select), **Conta Financeira** (select com `flattenAccounts` hierárquico), **Modalidade** (select), **Campo de valor** (select: Valor/Juros/Multa/Desconto/Valor Pago) + **Valor** (input). Exporta `FinTitlesFilters` (inclui `amountField`, `amountValue`, `bankId`, `accountId`, `paymentMethodId`). Filtragem client-side em `page.tsx` via `applyFinFilters(list, filters)` — estados independentes por tipo. |
| `src/components/financeiro/fin-extract-filter-modal.tsx` | Modal de pesquisa avançada do extrato. Filtros: **Pessoa** (autocomplete), **Tipo** (Todos/Entradas/Saídas), **Origem** (multi-select: Manual/Baixa/Estorno — popover com badges), **Período** (DateSelector — campo `date`), **Valor R$** (modo calculadora), **Banco** (select), **Conta Financeira** (select), **Modalidade** (select). Exporta `FinExtractFilters`. Filtragem client-side via `applyExtractFilters()` em `page.tsx`. |
| `src/components/financeiro/fin-extract-modal.tsx` | Modal de criação de lançamento manual no extrato. Layout em 3 linhas grid-cols-2: **Linha 1**: Tipo + Data; **Linha 2**: Banco + Conta Financeira; **Linha 3**: Modalidade + Valor R$. `handleBankChange` reseta Modalidade ao trocar Banco. Modalidade filtrada pelo banco selecionado (`m.fin_bank_id === Number(bankId)`). `RefPaymentMethod` inclui `fin_bank_id`. Todos os campos obrigatórios com `*`. `SelectContent` Conta Financeira com `max-h-52`. POST `/fin-extract` — `source='manual'` definido pelo backend. `onSaved()` recarrega o extrato. |
| `src/components/financeiro/fin-composition-modal.tsx` | Modal de composição de títulos. Layout 3 colunas: N° Parcelas, Intervalo das Parcelas (dias), Vencimento 1ª Parcela (`BirthDatePicker` minYear=2020 maxYear=2035). Dois grids com scroll (5 linhas visíveis): "Títulos selecionados" e "Registros a gerar" (preview calculado em tempo real — valor dividido igualmente, datas calculadas com base no intervalo). Ao confirmar chama `POST /fin-titles/compose` e recarrega o DataGrid. |
| `src/components/financeiro/fin-title-modal.tsx` | Modal criar/editar título financeiro (FinTitle). Props: `initialTab` (default `"geral"`) — controla qual aba abre; usado pelo botão Baixar do DataGrid para abrir direto na aba `"baixar"`. Título: "Editar"/"Novo"/"Visualizar" (quando status != pending). **Abas:** `Dados` (ícone ClipboardList — formulário principal), `Centro de Custo` (ícone PieChart — centro de custo em aba separada), `Baixar` (ícone ArrowDownToLine), `Notas` (ícone StickyNote — CRUD via `/fin-titles/{id}/notes`), `Arquivos` (ícone Folder — via `PeopleFilesTab` com `basePath=/files/fin_title/{id}`), `Composição` (ícone GitMerge — condicional). Aba Dados: inputs read-only estilizados com `bg-muted/60`. Campo Valor usa `maskCurrencyNatural`/`maskCurrencyNaturalBlur` (Modo Natural). Aba Baixar: **select Banco filtra Modalidade** (`pm.fin_bank_id === payBankId` — troca de banco reseta modalidade); `RefPaymentMethod` inclui `fin_bank_id` e `type_name`; **exibe saldo da carteira** quando tipo selecionado é Carteira (`GET /fin-wallets/balance/{people_id}`); **excedente**: `handlePay()` detecta excesso → abre dialog com opções "Enviar para Carteira" (`excess_action=wallet`) ou "Dar o Troco" (`excess_action=change`); botão Baixar desabilitado quando `walletBalance <= 0`; campos de % (juros/multa/desconto) usam `maskPercentNatural`; campos de R$ usam `makeCalcKeyDown` (Modo Calculadora); `interest`/`multa`/`discount`+`excess_action` enviados no payload do `pay`. Botão `+` ao lado de "Pessoa" abre `PeopleModal` inline. Parcelamento via `POST /fin-titles/installments` (batch atômico). `makeCalcKeyDown` helper reutilizável no arquivo. |
| `src/components/financeiro/fin-installment-modal.tsx` | Modal de parcelamento: divide/repete valor em N parcelas com intervalo e vencimento configuráveis, preview de parcelas. Botões: "Dividir o Valor" / "Repetir o Valor" |
| `src/components/financeiro/fin-banks-data-grid.tsx` | DataGrid de bancos com reordenação. Interface `FinBank` inclui `last_balance_data`, `last_balance_valor`, `current_balance` (retornados pela API). Coluna **Saldo** exibe data do último saldo (text-xs muted) + `current_balance` em verde/vermelho. |
| `src/components/financeiro/fin-bank-modal.tsx` | Modal criar/editar banco. Modo edição: seção **Saldos** com CRUD inline — lista histórico de saldos, formulário para adicionar (data + valor em Modo Calculadora), delete. Exibe saldo atual calculado (última balance + movimentações posteriores do extrato). Largura `max-w-md` no modo edição. |
| `src/components/financeiro/fin-payment-methods-data-grid.tsx` | DataGrid de modalidades de pagamento. Interface `FinPaymentMethod` inclui `created_at?`, `updated_at?` |
| `src/components/financeiro/fin-payment-method-modal.tsx` | Modal criar/editar modalidade |
| `src/components/financeiro/fin-payment-method-types-data-grid.tsx` | DataGrid de tipos de modalidade com DnD. Interface `FinPaymentMethodType` inclui `created_at?`, `updated_at?` |
| `src/components/financeiro/fin-payment-method-type-modal.tsx` | Modal criar/editar tipo de modalidade |
| `src/components/financeiro/departments-data-grid.tsx` | DataGrid de departamentos. Interface `Department` inclui `created_at?`, `updated_at?` |
| `src/components/financeiro/department-modal.tsx` | Modal criar/editar departamento |
| `src/components/financeiro/fin-accounts-tree.tsx` | Árvore hierárquica do plano de contas com reordenação (FinAccount, ReorderItem). Interface `FinAccount` inclui `created_at?`, `updated_at?` |
| `src/components/financeiro/fin-account-modal.tsx` | Modal criar/editar conta do plano de contas (aceita parentAccount) |
| `src/components/ui/field.tsx` | Componentes de formulário semânticos: `Field`, `FieldLabel`, `FieldTitle`, `FieldGroup`, `FieldContent`, `FieldDescription`, `FieldError`, `FieldSeparator`, `FieldSet`, `FieldLegend` — baseados em `@radix-ui/react-label` |
| `src/lib/api.ts` | axios com interceptor Bearer + timeout 30s. Detecta `isProd` pelo hostname: em produção sempre usa `VITE_API_URL`; em dev usa `http://{subdomain}.mapadovoto-api.test/api`. Interceptor de resposta: respostas 401 removem o token do localStorage e disparam `window.dispatchEvent(new Event('auth:logout'))` |
| `src/lib/helpers.ts` | Utilitários: `formatDate` (fix timezone — strings `YYYY-MM-DD` parseadas com `T00:00:00` para evitar desvio UTC), `formatDateTime`, `formatRecordCount` (ex: "Encontrei 3 registros"), `throttle`, `debounce`, `uid`, `getInitials`, `timeAgo` |
| `src/lib/party-colors.ts` | Cores + hex dos 30 partidos |
| `src/lib/leaflet-icon-fix.ts` | Fix ícone Leaflet no Vite |
| `src/routing/app-routing-setup.tsx` | Rotas |
| `src/components/common/page-footer.tsx` | Rodapé reutilizável exibido em todas as seções — "ClickMaps \| Mapa do Voto © 2012 - ano \| Grupo: TwoClicks". Substitui os footers inline anteriores em `page.tsx` |
| `src/components/reui/date-selector.tsx` | Seletor de data avançado (reui) — suporta operadores de filtro (is/before/after/between), tipos de período (dia/mês/trimestre/semestre/ano), calendário duplo para ranges, input de texto, scroll de anos. Exporta `DateSelector`, `DateSelectorValue`, `DateSelectorI18nConfig`, `formatDateValue` |
| `src/components/patterns/p-date-selector-3.tsx` | Padrão de uso do `DateSelector` dentro de um Dialog (interno — referência) |
| `src/components/reui/data-grid/data-grid-table.tsx` | Tabela do DataGrid com suporte a linha expandida dupla: `expandedCellContent` (primeira sub-linha, já existia) + `expandedCellContent2` (segunda sub-linha — renderizada apenas se ao menos uma célula retornar conteúdo não-nulo). Ambas iteram as células com `expandedColSpan` |
| `src/components/agenda/agenda-tab.tsx` | Aba Agenda com FullCalendar (dayGridMonth / timeGridWeek / timeGridDay / listWeek). Sidebar esquerda: data de hoje + eventos do dia + legenda de tipos. `ViewSwitcher` dropdown (Mês/Semana/Dia/Lista). `handleNewEvent` abre `EventModal` com próxima hora cheia. `dateClick` abre `EventModal` com data/hora do clique. **Títulos financeiros pendentes integrados ao calendário**: busca `GET /fin-titles?status=pending&date_from&date_to` em paralelo com `GET /events`; renderiza como eventos `allDay` com cores de `Financeiro Pagar`/`Financeiro Receber`; clicar abre `FinTitleDetailModal`. Clicar num evento agenda abre `EventDetailModal` com botão Editar (para eventos sem `modulo`). `allDaySlot=true`. `todayIso()` usa data local (não UTC). `_fc_id` usado para eventos recorrentes. |
| `src/components/agenda/event-modal.tsx` | Modal de criação/edição de evento — layout Google Calendar. Título: input grande no topo. Campos em linhas com ícones: **Tipo** (dropdown customizado com dots coloridos + nav ↑↓ Enter Esc), **Data/Hora** (BirthDatePicker + select de horários em 30min; mudança no início preserva duração; allDay oculta horários), **Dia inteiro** (checkbox) + **Repetir** (select: none/daily/weekly/monthly/yearly), **Pessoas** (multi-select chips com foto/iniciais + autocomplete), **Descrição** (textarea). Props: `event` (null = criar), `initialDate` (date + time + allDay — para pré-preencher do clique no calendário), `eventTypes`. Helpers: `isoToDate`/`isoToTime` usam `new Date()` local; `getDurationMinutes`/`shiftDateTime` para deslocar fim ao mudar início. Payload envia `people_ids[]`, `all_day`, `recurrence`. |
| `src/components/event-types/event-types-data-grid.tsx` | DataGrid de tipos de evento: colunas ID, Nome, Cor (dot), **Dia Inteiro** (badge Sim/—), Order, Status, Ações. Interface `EventType` inclui `created_at?`, `updated_at?` |
| `src/components/event-types/event-types-modal.tsx` | Modal criar/editar tipo de evento: campos Nome, Cor, **Switch "Dia inteiro por padrão"** (all_day), Status |
| `src/components/event-types/event-types-filter-modal.tsx` | Modal de pesquisa avançada de tipos de evento — filtros: Nome, Status, Dia Inteiro, Período (created_at/updated_at via DateSelector). Exporta `EventTypesFilterModal`, `EventTypesFilters` |
| `src/components/financeiro/fin-dashboard-tab.tsx` | **Dashboard Financeiro** — KPIs (Saldo em Bancos, A Pagar Pendente, A Receber Pendente, Saldo Líquido), gráfico de barras Fluxo de Caixa (6 meses — `recharts` via `ChartContainer`), donut Status dos Títulos, listas Títulos Vencidos e A Vencer em 30 dias, barras de Saldo por Conta. Busca em paralelo: `GET /fin-banks`, `GET /fin-titles?type=expense&status=pending`, `GET /fin-titles?type=income&status=pending`, `GET /fin-titles`, `GET /fin-extract?date_from&date_to`. |
| `src/components/settings/settings-dashboard-tab.tsx` | **Dashboard de Configurações** — KPIs (Gabinetes Ativos, Pessoas, Módulos de Permissão, Tipos Cadastrados), lista de Gabinetes ordenada por vencimento (badge de validade colorido), donut Pessoas por Tipo, grid de 5 cards de Tipos (Pessoa, Contato, Endereço, Documento, Evento). Busca em paralelo: `GET /tenants`, `GET /people`, `GET /type-people`, `GET /type-contacts`, `GET /type-addresses`, `GET /type-documents`, `GET /event-types`, `GET /permission-actions`. |
| `src/components/financeiro/fin-wallet-tab.tsx` | Aba da Carteira Financeira — filtros: Pessoa (autocomplete + Limpar) + **Período** (DateSelector dialog — botão com CalendarIcon, converte `DateSelectorValue` em `date_from`/`date_to` via `extractDateRange()`). Totalizadores (Total Saídas / Total Entradas / Saldo). Tabela de lançamentos (Data, Pessoa, Descrição, Origem, Entrada, Saída). Carrega `GET /fin-wallets` com params `people_id`, `date_from`, `date_to`; botão "Novo Lançamento" abre `FinWalletModal`. |
| `src/components/financeiro/fin-wallet-modal.tsx` | Modal de criação de lançamento manual na carteira. Layout em 5 linhas: **Linha 1**: Tipo + Data; **Linha 2**: Pessoa (autocomplete full-width + saldo disponível quando type=out); **Linha 3**: Banco + Conta Financeira; **Linha 4**: Modalidade + Valor R$; **Linha 5**: Descrição. `handleBankChange` reseta Modalidade. Modalidade filtrada pelo banco (`m.fin_bank_id`). Todos os campos obrigatórios. `POST /fin-wallets` — valida saldo na API ao salvar. |
| `src/components/financeiro/fin-banks-filter-modal.tsx` | Modal de pesquisa avançada de bancos — filtros: Nome, Status, Período (created_at/updated_at). Exporta `FinBanksFilterModal`, `FinBanksFilters` |
| `src/components/financeiro/fin-payment-method-types-filter-modal.tsx` | Modal de pesquisa avançada de tipos de modalidade — filtros: Nome, Período (created_at/updated_at). Exporta `FinPaymentMethodTypesFilterModal`, `FinPaymentMethodTypesFilters` |
| `src/components/financeiro/fin-payment-methods-filter-modal.tsx` | Modal de pesquisa avançada de modalidades de pagamento — layout ID(2)+Nome(7)+Status(3) / Pesquisar por(2)+Período(4)+Banco(3)+Tipo(3). **Banco** e **Tipo** usam Popover+Checkbox multi-select (`bankIds?: number[]`, `typeIds?: number[]`). Auto-busca `/fin-banks` e `/fin-payment-method-types` ao abrir. `onWheel stopPropagation` nas listas scrolláveis. Exporta `FinPaymentMethodsFilterModal`, `FinPaymentMethodsFilters` |
| `src/components/financeiro/departments-filter-modal.tsx` | Modal de pesquisa avançada de departamentos — filtros: ID(2)+Nome(7)+Status(3) / Pesquisar por(2)+Período(4). Status via Popover+Checkbox. Exporta `DepartmentsFilterModal`, `DepartmentsFilters` |
| `src/components/financeiro/fin-accounts-filter-modal.tsx` | Modal de pesquisa avançada do plano de contas — filtros: Nome(9)+Status(3) / Pesquisar por(2)+Período(4)+Tipo(3)+Natureza(3). **Tipo** (5 opções: asset/liability/revenue/expense/cost) e **Natureza** (2 opções: analytic/synthetic) via Popover+Checkbox. Filtragem preserva hierarquia: nós correspondentes + todos os seus ancestrais (via `filterFinAccountTree` em `page.tsx`). Exporta `FinAccountsFilterModal`, `FinAccountsFilters` |
| `src/components/gabinetes/gabinetes-filter-modal.tsx` | Modal de pesquisa avançada de gabinetes — Exporta `GabinetesFilterModal`, `GabinetesFilters` |
| `src/components/people/people-filter-modal.tsx` | Modal de pesquisa avançada de pessoas — filtros: ID, Pessoa (autocomplete), Tipo de Pessoa (multi-select), Status (Ativo/Inativo), Data (created_at/updated_at/deleted_at via DateSelector), Aniversário (só mês/dia), Contato (tipo + valor), Documento (tipo + valor), Endereço. `applyPeopleFilters()` em `page.tsx` com `matchesDateFilter()`. Exporta `PeopleFilterModal`, `PeopleFilters` |
| `src/components/permission-actions/permission-actions-filter-modal.tsx` | Modal de pesquisa avançada de permission_actions. Exporta `PermissionActionsFilterModal`, `PermissionActionsFilters` |
| `src/components/type-addresses/type-addresses-filter-modal.tsx` | Modal de pesquisa avançada de tipos de endereço. Exporta `TypeAddressesFilterModal`, `TypeAddressesFilters` |
| `src/components/type-contacts/type-contacts-filter-modal.tsx` | Modal de pesquisa avançada de tipos de contato. Exporta `TypeContactsFilterModal`, `TypeContactsFilters` |
| `src/components/type-documents/type-documents-filter-modal.tsx` | Modal de pesquisa avançada de tipos de documento. Exporta `TypeDocumentsFilterModal`, `TypeDocumentsFilters` |
| `src/components/type-people/type-people-filter-modal.tsx` | Modal de pesquisa avançada de tipos de pessoa. Exporta `TypePeopleFilterModal`, `TypePeopleFilters` |
| `src/styles/components/fullcalendar.css` | Override de estilos do FullCalendar para o tema Metronic — botões outline, cabeçalho de dias sem fundo cinza, hoje com círculo primary, eventos com border-left 3px + fundo translúcido. Importado via `config.metronic.css`. |

### Logo Mapa do Voto

Ícone `MapPin` vermelho (#E63946) + "Mapa"(normal) + "do Voto"(bold), text-xl. Exibido no `header.tsx` (mobile) e no `sidebar-header.tsx` foi removido.

### Abas da Toolbar

Abas: **Mapa**, **Atendimentos**, **Agenda**, **Alianças**, **Finanças** (ícone `DollarSign`), **Configurações** (ícone `Settings`, visível para todos). Aba **Gabinetes** (`isMaster`) existe como `TabsContent` mas não tem `TabsTrigger` — acesso via lógica interna. Aba ativa persiste via `ActiveTabProvider` no `localStorage`.

Aba **Finanças** exibe `<FinMegaMenu />` acima do conteúdo. Seção ativa persiste em `localStorage` (`mapadovoto:finSection`). Seções disponíveis: **`fin-dashboard`** (renderiza `<FinDashboardTab />`), `fin-banks`, `fin-payment-methods`, `fin-payment-method-types`, `fin-departments`, `fin-accounts`, `fin-extract`, **`fin-wallet`**.

Abas **Gabinetes** e **Configurações** exibem `<AppMegaMenu />` (NavigationMenu do Layout 1) acima do conteúdo. Na aba Configurações, `activeSection={settingsSection}` destaca visualmente o botão do módulo aberto. Seção **`settings-dashboard`** renderiza `<SettingsDashboardTab />`; demais seções: `type-people`, `type-contact`, `type-address`, `type-document`, `pessoas`, `gabinetes`, `permission-actions`, `event-types`.

Quando `isMaster`: exibe dropdown "Gabinete: Master" na toolbar que lista todos os tenants e redireciona para `{slug}.{baseDomain}` ao clicar.

### Navbar (desktop — canto superior direito)

Botões atuais: **Eye/EyeOff** (toggle `showCard`), **Maximize/Minimize** (fullscreen), **UserDropdownMenu**. Botão **Columns2** (split view) visível apenas quando `isMaster`. Botões antigos removidos: `MessageSquareCode`, `Pin`, `Reports`, `Add`.

### UserDropdownMenu

Simplificado e traduzido para PT-BR. Itens: submenu "Gabinete: {nome}" (lista tenants via `GET /api/tenants`), Meu Perfil, Preferências, Segurança, toggle Modo Dark/Light, Sair. Remove itens genéricos do template Metronic.

### Modal de Login

- Abre automaticamente ao carregar
- Ao montar: GET `/auth/tenant` valida o subdomínio antes de exibir o formulário
  - `null` → "Verificando..."
  - `false` → "Gabinete não encontrado" (sem campos de login)
  - `true` → formulário normal
- Ao entrar: POST `/auth/login` → salva token no `localStorage` + `setUser(data.user)` → fecha modal
- Ao sair: POST `/auth/logout` → remove token → reabre modal
- `LoginModalContext` expõe: `open`, `setOpen`, `loggedIn`, `setLoggedIn`, `user`, `setUser`, `logout`
- `/auth/me` retorna o objeto do usuário diretamente (sem wrapper) → `setUser(res.data)`

---

## Backend (api\)

### Ambiente local

- **URL:** `http://mapadovoto-api.test` (via Herd symlink)
- **Laravel:** 12 | **PHP:** 8.4 (runtime) / `^8.2` (composer.json) | **PostgreSQL:** 17.7
- **Bancos:** `cm_politico` (gabinete_master) + `cm_maps` (maps) | **Usuário:** `mapadovoto`

### Rotas da API

| Método | Endpoint | Auth | Middleware | Descrição |
|--------|----------|------|------------|-----------|
| GET | `/api/tenants` | pública | — | Lista todos os tenants ativos (id, name, slug, active, valid_until) |
| POST | `/api/tenants` | Bearer | — | Cria novo tenant: valida slug único, opcionalmente cria schema PostgreSQL (`has_schema: bool`), aceita `people_id` opcional para vincular person ao tenant |
| POST | `/api/tenants/{id}/clients` | Bearer | — | Cria tenant filho vinculado a um reseller (`tenant_id = id`); aceita `has_schema` |
| PUT | `/api/tenants/{id}` | Bearer | — | Atualiza tenant (name, slug, active, valid_until) |
| GET | `/api/tenants/{id}/person` | Bearer | — | Retorna person do tenant + lista de type_people |
| POST | `/api/tenants/{id}/person` | Bearer | — | Cria person vinculada ao tenant |
| GET | `/api/type-people` | Bearer | — | Lista tipos de pessoa ativos ordenados por order |
| POST | `/api/type-people` | Bearer | — | Cria tipo de pessoa |
| PUT | `/api/type-people/{id}` | Bearer | — | Atualiza tipo de pessoa; reordena automaticamente se order duplicado |
| DELETE | `/api/type-people/{id}` | Bearer | — | Soft delete do tipo de pessoa |
| GET | `/api/type-contacts` | Bearer | — | Lista tipos de contato |
| POST | `/api/type-contacts` | Bearer | — | Cria tipo de contato |
| PUT | `/api/type-contacts/{id}` | Bearer | — | Atualiza tipo de contato |
| DELETE | `/api/type-contacts/{id}` | Bearer | — | Soft delete do tipo de contato |
| GET | `/api/type-addresses` | Bearer | — | Lista tipos de endereço |
| POST | `/api/type-addresses` | Bearer | — | Cria tipo de endereço |
| PUT | `/api/type-addresses/{id}` | Bearer | — | Atualiza tipo de endereço |
| DELETE | `/api/type-addresses/{id}` | Bearer | — | Soft delete do tipo de endereço |
| GET | `/api/type-documents` | Bearer | — | Lista tipos de documento |
| POST | `/api/type-documents` | Bearer | — | Cria tipo de documento |
| PUT | `/api/type-documents/{id}` | Bearer | — | Atualiza tipo de documento |
| DELETE | `/api/type-documents/{id}` | Bearer | — | Soft delete do tipo de documento |
| GET | `/api/people` | Bearer | — | Lista pessoas do tenant ordenadas por nome |
| POST | `/api/people` | Bearer | — | Cria pessoa |
| PUT | `/api/people/{id}` | Bearer | — | Atualiza pessoa (name, birth_date, type_people_id, active) |
| DELETE | `/api/people/{id}` | Bearer | — | Exclui pessoa |
| GET | `/api/people/{id}/contacts` | Bearer | — | Lista contatos da pessoa |
| POST | `/api/people/{id}/contacts` | Bearer | — | Adiciona contato |
| PUT | `/api/people/{id}/contacts/{cid}` | Bearer | — | Atualiza contato |
| DELETE | `/api/people/{id}/contacts/{cid}` | Bearer | — | Remove contato |
| GET | `/api/people/{id}/addresses` | Bearer | — | Lista endereços da pessoa |
| POST | `/api/people/{id}/addresses` | Bearer | — | Adiciona endereço (campos ViaCEP + lat/lng) |
| PUT | `/api/people/{id}/addresses/{aid}` | Bearer | — | Atualiza endereço (inclui geocoding lat/lng) |
| DELETE | `/api/people/{id}/addresses/{aid}` | Bearer | — | Remove endereço |
| GET | `/api/people/{id}/documents` | Bearer | — | Lista documentos da pessoa |
| POST | `/api/people/{id}/documents` | Bearer | — | Adiciona documento |
| PUT | `/api/people/{id}/documents/{did}` | Bearer | — | Atualiza documento |
| DELETE | `/api/people/{id}/documents/{did}` | Bearer | — | Remove documento |
| GET | `/api/people/{id}/notes` | Bearer | — | Lista notas da pessoa |
| POST | `/api/people/{id}/notes` | Bearer | — | Adiciona nota |
| PUT | `/api/people/{id}/notes/{nid}` | Bearer | — | Atualiza nota |
| DELETE | `/api/people/{id}/notes/{nid}` | Bearer | — | Remove nota |
| POST | `/api/people/{id}/avatar` | Bearer | — | Upload de avatar — gera 3 versões: original.jpg, md.jpg, sm.jpg via Intervention Image |
| DELETE | `/api/people/{id}/avatar` | Bearer | — | Remove avatar e arquivos do storage |
| GET | `/api/people/{id}/files` | Bearer | — | Lista arquivos da pessoa |
| POST | `/api/people/{id}/files` | Bearer | — | Upload de arquivo |
| GET | `/api/people/{id}/files/{fid}/download` | Bearer | — | Download de arquivo |
| DELETE | `/api/people/{id}/files/{fid}` | Bearer | — | Remove arquivo |
| GET | `/api/people/{id}/user` | Bearer | — | Retorna usuário vinculado à pessoa (id, email) ou null |
| POST | `/api/people/{id}/user` | Bearer | — | Cria usuário para a pessoa (email + password + confirmed) |
| PUT | `/api/people/{id}/user` | Bearer | — | Atualiza email e/ou senha do usuário |
| GET | `/api/people/{id}/permissions` | Bearer | — | Lista todas as permission_actions (ordenadas por `order`) com `allowed` da pessoa (default true se sem registro); retorna `name_module` e `name_action` |
| PUT | `/api/people/{id}/permissions/{actionId}` | Bearer | — | Upsert de uma permissão (allowed: bool) |
| GET | `/api/permission-actions` | Bearer | — | Lista todas as permission_actions ordenadas por `order`, `id` |
| POST | `/api/permission-actions` | Bearer | — | Cria permission_action (module, name_module, action, name_action, description); order = max+1 automático |
| PUT | `/api/permission-actions/reorder` | Bearer | — | Reordena em lote: `[{id, order}]` |
| PUT | `/api/permission-actions/{id}` | Bearer | — | Atualiza permission_action |
| DELETE | `/api/permission-actions/{id}` | Bearer | — | Soft delete de permission_action |
| GET | `/api/auth/tenant` | pública | `tenant` | Valida se o subdomínio corresponde a um tenant ativo; retorna 200 ou 404 |
| POST | `/api/auth/login` | pública | `tenant` | Retorna token + user + people; identifica gabinete pelo subdomínio |
| POST | `/api/auth/logout` | Bearer | — | Revoga token atual |
| GET | `/api/auth/me` | Bearer | — | Retorna usuário autenticado + people |
| GET | `/api/candidates/search?q=` | Bearer | — | Busca em `maps.candidacies` por nome/cargo/ano/partido/UF/cidade (unaccent) — exclui cargos VICE-* — master: todas as candidacies; outros: apenas `people_candidacies` do user |
| GET | `/api/candidates` | Bearer | — | Lista candidaturas; master vê todas, user vê apenas as vinculadas via people_candidacies |
| GET | `/api/map-candidates/search?q=` | Bearer | — | Busca em `maps.candidates` (pessoas candidatas, não candidaturas) por nome com unaccent ILIKE; retorna id, name, photo_url; usado no modal Novo Gabinete step 3 |
| GET | `/api/map-candidates/{id}/candidacies` | Bearer | — | Lista candidaturas de um `maps.candidate` pelo `candidate_id`; retorna ballot_name, role, year, number, status, party, party_color_bg/text/gradient, state_uf, city_name |
| POST | `/api/people/{personId}/candidacies` | Bearer | — | Vincula candidaturas à pessoa via `people_candidacies`; body: `{candidacy_ids: number[]}`; ignora duplicatas |
| GET | `/api/candidacies/{id}/stats?city_id=` | Bearer | — | Retorna votos por turno: qty_votes, %, brancos, nulos, legenda, total partido, status TSE — query única CTE com partition pruning por year |
| GET | `/api/candidacies/{id}/cities` | Bearer | — | Retorna cidades do estado do candidato com qty_votes agregados (vote_type=candidate, maior turno) — filtrado por year |
| GET | `/api/cities/search?q=&state_id=` | Bearer | — | Busca cidades com unaccent, filtro state_id, limit 10 |
| GET | `/api/states/{uf}/geometry` | pública | — | Retorna geometry GeoJSON do estado (campo geometry da tabela states) |
| GET | `/api/fin-banks` | Bearer | — | Lista bancos do tenant ordenados por order |
| POST | `/api/fin-banks` | Bearer | — | Cria banco |
| PUT | `/api/fin-banks/{id}` | Bearer | — | Atualiza banco (aceita só `order` para reordenar) |
| DELETE | `/api/fin-banks/{id}` | Bearer | — | Soft delete do banco |
| GET | `/api/fin-banks/{bankId}/balances` | Bearer | — | Lista saldos do banco ordenados por data desc |
| POST | `/api/fin-banks/{bankId}/balances` | Bearer | — | Cria registro de saldo (data, valor) |
| PUT | `/api/fin-banks/{bankId}/balances/{id}` | Bearer | — | Atualiza saldo |
| DELETE | `/api/fin-banks/{bankId}/balances/{id}` | Bearer | — | Remove saldo |
| GET | `/api/fin-payment-method-types` | Bearer | — | Lista tipos de modalidade de pagamento |
| POST | `/api/fin-payment-method-types` | Bearer | — | Cria tipo de modalidade |
| PUT | `/api/fin-payment-method-types/reorder` | Bearer | — | Reordena em lote: `[{id, order}]` |
| PUT | `/api/fin-payment-method-types/{id}` | Bearer | — | Atualiza tipo de modalidade |
| DELETE | `/api/fin-payment-method-types/{id}` | Bearer | — | Soft delete do tipo de modalidade |
| GET | `/api/fin-payment-methods` | Bearer | — | Lista modalidades de pagamento com bank e type |
| POST | `/api/fin-payment-methods` | Bearer | — | Cria modalidade de pagamento |
| PUT | `/api/fin-payment-methods/{id}` | Bearer | — | Atualiza modalidade (aceita só `order` para reordenar) |
| DELETE | `/api/fin-payment-methods/{id}` | Bearer | — | Soft delete da modalidade |
| GET | `/api/fin-extract` | Bearer | — | Lista lançamentos do extrato — retorna `{entries, initial_balance}`; suporta filtros `bank_id`, `date_from`, `date_to`, `type`, `account_id`, `payment_method_id`; `initial_balance` calculado dinamicamente: quando `date_from` passado, soma o net do extrato entre o último saldo e `date_from` |
| POST | `/api/fin-extract` | Bearer | — | Cria lançamento manualmente |
| GET | `/api/departments` | Bearer | — | Lista departamentos ordenados por order |
| POST | `/api/departments` | Bearer | — | Cria departamento |
| PUT | `/api/departments/{id}` | Bearer | — | Atualiza departamento |
| DELETE | `/api/departments/{id}` | Bearer | — | Soft delete do departamento |
| GET | `/api/fin-wallets` | Bearer | — | Lista lançamentos da carteira — retorna `{entries, summary: {total_in, total_out, balance}}`; filtros: `people_id`, `date_from`, `date_to` |
| POST | `/api/fin-wallets` | Bearer | — | Cria lançamento manual na carteira (valida saldo se `type='out'`; cria `FinExtract` também) |
| GET | `/api/fin-wallets/balance/{peopleId}` | Bearer | — | Retorna saldo calculado de uma pessoa (`{people_id, balance}`) |
| GET | `/api/fin-accounts` | Bearer | — | Lista plano de contas hierárquico (árvore completa) |
| POST | `/api/fin-accounts` | Bearer | — | Cria conta (aceita `parent_id` para sub-conta) |
| PUT | `/api/fin-accounts/reorder` | Bearer | — | Reordena contas em lote |
| PUT | `/api/fin-accounts/{id}` | Bearer | — | Atualiza conta |
| DELETE | `/api/fin-accounts/{id}` | Bearer | — | Soft delete da conta |
| GET | `/api/fin-titles` | Bearer | — | Lista títulos com filtros: `type`, `status`, `people_id`, `account_id`, `bank_id`, `date_from`, `date_to` |
| GET | `/api/fin-titles/{id}` | Bearer | — | Detalhe do título com cost_centers e composições |
| POST | `/api/fin-titles` | Bearer | — | Cria título (aceita `cost_centers[]` com department_id/percentage) |
| POST | `/api/fin-titles/installments` | Bearer | — | Cria N parcelas em lote atômico (transaction); body: campos base do título + `total`, `divide` (bool), `interval` (dias), `first_due_date`; parcelas 2+ recebem `invoice_number` baseado no ID da primeira (`{id}-{n}/{total}`) |
| PUT | `/api/fin-titles/{id}` | Bearer | — | Atualiza título; ao mudar `status` para `cancelled` gera nota automática em `fin_titles` |
| DELETE | `/api/fin-titles/{id}` | Bearer | — | Soft delete do título |
| POST | `/api/fin-titles/compose` | Bearer | — | Composição de títulos: cancela originais e gera N novos com valor dividido, intervalo e data configuráveis; registra vínculos em `fin_title_compositions`; body: `{title_ids, quantity, interval, first_due_date}` |
| POST | `/api/fin-titles/{id}/pay` | Bearer | — | Baixa o título: aceita `interest`, `multa`, `discount` (percentuais opcionais — sobrescrevem os do título); gera extrato, atualiza status (paid/partial); baixa parcial gera novo título com saldo restante; pagamento excedente credita carteira; gera nota automática |
| POST | `/api/fin-titles/{id}/reverse` | Bearer | — | Estorna título pago: status → reversed, gera `FinExtract` com `source='estorno'`, clona título original como `pending` copiando cost_centers; gera nota automática nos dois títulos |
| POST | `/api/fin-titles/{id}/clone` | Bearer | — | Clona título (status pending) copiando cost_centers |
| GET | `/api/fin-titles/{id}/notes` | Bearer | — | Lista notas do título (modulo=fin_titles, record_id={id}) ordenadas por order |
| POST | `/api/fin-titles/{id}/notes` | Bearer | — | Cria nota no título; body: `{value}` |
| DELETE | `/api/fin-titles/{id}/notes/{noteId}` | Bearer | — | Remove nota do título |
| GET | `/api/event-types` | Bearer | — | Lista tipos de evento ordenados por order — retorna `all_day` |
| POST | `/api/event-types` | Bearer | — | Cria tipo de evento |
| PUT | `/api/event-types/{id}` | Bearer | — | Atualiza tipo de evento; reordena automaticamente se order duplicado |
| DELETE | `/api/event-types/{id}` | Bearer | — | Soft delete do tipo de evento |
| GET | `/api/events` | Bearer | — | Lista eventos com filtros: `people_id`, `event_type_id`, `modulo`, `start_from`, `start_to`; retorna event_type {id, name, color}, `all_day`, `recurrence` e `people[]` com name + photo_sm |
| GET | `/api/events/{id}` | Bearer | — | Detalhe do evento |
| POST | `/api/events` | Bearer | — | Cria evento |
| PUT | `/api/events/{id}` | Bearer | — | Atualiza evento |
| DELETE | `/api/events/{id}` | Bearer | — | Soft delete do evento |
| GET | `/api/files/{modulo}/{recordId}` | Bearer | — | Lista arquivos de qualquer entidade por `modulo` e `record_id` — retorna URL pública |
| POST | `/api/files/{modulo}/{recordId}` | Bearer | — | Upload de arquivo genérico (max 50 MB); armazena em `{slug}/files/{modulo}/{recordId}/` |
| GET | `/api/files/{modulo}/{recordId}/{fileId}/download` | Bearer | — | Download de arquivo genérico |
| DELETE | `/api/files/{modulo}/{recordId}/{fileId}` | Bearer | — | Remove arquivo genérico |

### Schemas e Tabelas

**Schema `gabinete_master`** — auth, tenants, usuários da plataforma:

| Tabela | Descrição |
|--------|-----------|
| `gabinete_master.tenants` | Gabinetes (id, name, slug unique, schema unique, active, valid_until) — slug identifica o tenant pelo subdomínio |
| `gabinete_master.type_people` | Tipos de pessoa (id, name, order, active, deleted_at) — seeds: Admin(1), Político(2), Equipe(3), Eleitor(4) |
| `gabinete_master.people` | Usuários da plataforma (id, tenant_id nullable FK, type_people_id nullable FK, name, birth_date nullable, photo_path nullable, active) |
| `gabinete_master.type_contacts` | Tipos de contato (id, name, mask nullable, order, active, deleted_at) |
| `gabinete_master.type_addresses` | Tipos de endereço (id, name, order, active, deleted_at) |
| `gabinete_master.type_documents` | Tipos de documento (id, name, mask nullable, order, active, deleted_at) |
| `gabinete_master.contacts` | Contatos polimórficos (modulo, record_id, type_contact_id, value, order, active) |
| `gabinete_master.addresses` | Endereços polimórficos (modulo, record_id, type_address_id, cep, logradouro, numero, complemento, bairro, cidade, uf, ibge, lat, lng, order, active) |
| `gabinete_master.documents` | Documentos polimórficos (modulo, record_id, type_document_id, value, validity nullable, order, active) |
| `gabinete_master.notes` | Notas polimórficas (modulo, record_id, value, order, active) |
| `gabinete_master.files` | Arquivos polimórficos (modulo, record_id, ...) |
| `gabinete_master.users` | Acesso (id, people_id, email, password, active) |
| `gabinete_master.people_candidacies` | Vínculo people ↔ candidacy (id, people_id, candidacy_id, order, active) |
| `gabinete_master.split_candidacies` | Candidato do split direito (id, people_candidacy_id, candidacy_id, order, active) |
| `gabinete_master.personal_access_tokens` | Tokens Sanctum customizados (inclui campo `schema`) |
| `gabinete_master.permission_actions` | Ações de permissão por módulo (id, module, name_module, action, name_action, description, order) |
| `gabinete_master.permissions` | Permissões por people (people_id, permission_action_id, allowed) |
| `gabinete_master.attendances` | Atendimentos (people_id, title, description, address, lat, lng, status, opened_at, resolved_at) |
| `gabinete_master.attendance_history` | Histórico de status dos atendimentos |
| `gabinete_master.fin_banks` | Bancos/contas bancárias do gabinete (id, name, bank, agency, account, main, order, active) — seed: Caixa, Conta Corrente, Conta Poupança |
| `gabinete_master.fin_payment_method_types` | Tipos de modalidade de pagamento (id, name, order) |
| `gabinete_master.fin_payment_methods` | Modalidades de pagamento (id, name, fin_bank_id, fin_payment_method_type_id, order, active) |
| `gabinete_master.departments` | Departamentos para rateio de centro de custo (id, name, order, active) |
| `gabinete_master.fin_accounts` | Plano de contas hierárquico (id, parent_id, code, name, type, order, active) — seed completo com Ativo/Passivo/Custos e Despesas/Receitas |
| `gabinete_master.fin_titles` | Títulos financeiros a pagar/receber (id, type, description, amount, discount, interest, due_date, paid_at, reversed_at, cancelled_at, amount_paid, installment_number, installment_total, account_id, payment_method_id, bank_id, people_id, document_number, invoice_number, barcode, pix_key, status) |
| `gabinete_master.fin_extract` | Extrato financeiro — lançamentos gerados por baixas ou manualmente (id, title_id nullable, account_id, type, amount, date, payment_method_id, bank_id, source: manual/baixa/estorno) |
| `gabinete_master.fin_wallets` | Carteira por pessoa — **ledger de lançamentos** (id, people_id, type: in/out, amount, date, description, title_id, source: manual/baixa/estorno) — saldo calculado via `SUM(in) - SUM(out)` |
| `gabinete_master.fin_cost_centers` | Rateio de centro de custo por título (id, title_id, department_id, percentage) |
| `gabinete_master.fin_title_compositions` | Composição entre títulos — rastreia origem/destino de clones e parcelamentos (id, origin_title_id, destination_title_id) |
| `gabinete_master.fin_bank_balances` | Saldos pontuais de banco (id, fin_bank_id, data date, valor decimal(15,2), timestamps) — usado para calcular saldo atual: último valor + net do extrato após essa data |
| `gabinete_master.event_types` | Tipos de evento da agenda (id, name, color varchar, **all_day boolean default false**, order, active, timestamps, deleted_at) — seeds (5): Aniversário (#3fb6ea, all_day=true), Financeiro Pagar (#ec637f, all_day=true), Financeiro Receber (#4fb589, all_day=true), Compromisso (#fbb810), Atendimento (#b665ec) |
| `gabinete_master.events` | Eventos da agenda (id, **people_id bigint NULL** sem FK, event_type_id FK → event_types, modulo varchar NULL, name, description text NULL, start_at timestamp, end_at timestamp NULL, **all_day boolean default false**, **recurrence varchar default 'none'**, gcal_event_id varchar NULL, active, timestamps, deleted_at) |
| `gabinete_master.event_people` | Pivot evento ↔ pessoa (id, event_id FK → events cascade delete, people_id bigint sem FK, active, timestamps, deleted_at) — UNIQUE(event_id, people_id) |
| `gabinete_master.cache` / `gabinete_master.jobs` | Infraestrutura Laravel |

**Schema `maps`** — dados eleitorais TSE:

| Tabela | Descrição |
|--------|-----------|
| `maps.countries` | País (id, name) |
| `maps.states` | 27 estados (id, country_id, name, uf, geometry) — geometry preenchida via `tse:import-state-geometry {uf}` |
| `maps.cities` | Municípios (id, state_id, name, ibge_code, tse_code, geometry) — ⚠️ `ibge_code` NULL em todas as cities, match por nome até ser populado |
| `maps.zones` | Zonas eleitorais (id, city_id, zone_number, geometry) |
| `maps.voting_locations` | Locais de votação (id, zone_id, tse_number, name, address, lat, lng) |
| `maps.sections` | Seções (id, voting_location_id, section_number) |
| `maps.genders` | 3 registros |
| `maps.candidates` | Pessoa do candidato (id, gender_id, name, cpf, photo_url) |
| `maps.parties` | 30 partidos (id, name, abbreviation, color_bg, color_text, color_gradient) |
| `maps.candidacies` | Candidatura por eleição (id, sq_candidato unique, candidate_id, party_id, country_id, state_id, city_id, year, role, ballot_name, number, status) |
| `maps.votes` | Votos por seção, particionada RANGE(year) (id, candidacy_id, country_id, state_id, city_id, zone_id, voting_location_id, section_id, year, round, qty_votes, vote_type) — partições: `votes_default`, `votes_2022`, `votes_2024` |
| `maps.tse_votacao_secao_2024` | Staging bruta TSE 2024 (26 colunas text) — dados SP importados |
| `maps.tse_votacao_secao_2022` | Staging bruta TSE 2022 (26 colunas text) — dados SP importados |
| `maps.tse_votacao_secao_2020` | Staging bruta TSE 2020 (26 colunas text) — estrutura criada, sem dados |
| `maps.tse_votacao_secao_2018` | Staging bruta TSE 2018 (26 colunas text) — estrutura criada, sem dados |
| `maps.tse_votacao_secao_2016` | Staging bruta TSE 2016 (26 colunas text) — estrutura criada, sem dados |
| `maps.tse_votacao_secao_2014` | Staging bruta TSE 2014 (26 colunas text) — estrutura criada, sem dados |
| `maps.tse_votacao_secao_2012` | Staging bruta TSE 2012 (26 colunas text) — estrutura criada, sem dados |
| `maps.tse_votacao_secao_2010` | Staging bruta TSE 2010 (26 colunas text) — estrutura criada, sem dados |
| `maps.tse_votacao_secao_2008` | Staging bruta TSE 2008 (26 colunas text) — estrutura criada, sem dados |

### Models e relacionamentos

Todos os models têm `$table` explícito com schema qualificado.

- `Tenant` (`gabinete_master.tenants`) — com SoftDeletes; campos `name`, `slug`, `schema`, `active`, `valid_until`; cast `valid_until` → `date`
- `TypePeople` (`gabinete_master.type_people`) — com SoftDeletes; `$fillable`: `name`, `order`, `active`; evento `creating`: auto `max+1` se order vazio, reordena se duplicado; evento `updating`: reordena se order alterado; relacionamento `people()`
- `People` (`gabinete_master.people`) — sem SoftDeletes, sem uuid; `$fillable`: `tenant_id`, `type_people_id`, `name`, `birth_date`, `photo_path`, `active`; cast `birth_date` → `date:Y-m-d`; relacionamentos `typePeople()`, `peopleCandidacies()`, `contacts()` (HasMany → Contact, `where('modulo','people')`), `documents()` (HasMany → Document, `where('modulo','people')`), `addresses()` (HasMany → Address, `where('modulo','people')`)
- `Permission` (`gabinete_master.permissions`) — com SoftDeletes; `$fillable`: `people_id`, `permission_action_id`, `allowed`; cast `allowed` → `boolean`; `belongsTo(PermissionAction)`
- `PermissionAction` (`gabinete_master.permission_actions`) — com SoftDeletes; `$fillable`: `module`, `name_module`, `action`, `name_action`, `description`, `order`
- `TypeContact` (`gabinete_master.type_contacts`) — com SoftDeletes; campos `name`, `mask`, `order`, `active`
- `TypeAddress` (`gabinete_master.type_addresses`) — com SoftDeletes; campos `name`, `order`, `active`
- `TypeDocument` (`gabinete_master.type_documents`) — com SoftDeletes; campos `name`, `mask`, `validity`, `order`, `active`; cast `validity` → `boolean` (indica se o tipo exige data de validade)
- `Contact` (`gabinete_master.contacts`) — polimórfico por `modulo`+`record_id`; `$fillable`: `modulo`, `record_id`, `type_contact_id`, `value`, `order`, `active`
- `Address` (`gabinete_master.addresses`) — polimórfico; `$fillable`: `modulo`, `record_id`, `type_address_id`, `cep`, `logradouro`, `numero`, `complemento`, `bairro`, `cidade`, `uf`, `ibge`, `lat`, `lng`, `order`, `active`
- `Document` (`gabinete_master.documents`) — polimórfico; `$fillable`: `modulo`, `record_id`, `type_document_id`, `value`, `validity`, `order`, `active`
- `Note` (`gabinete_master.notes`) — polimórfico; `$fillable`: `modulo`, `record_id`, `value`, `order`, `active`
- `User` (`gabinete_master.users`) → `belongsTo(People)`, `HasApiTokens`
- `PersonalAccessToken` (`gabinete_master.personal_access_tokens`) — model customizado registrado via `Sanctum::usePersonalAccessTokenModel()` no `AppServiceProvider`
- `Party` (`maps.parties`) — sem SoftDeletes, sem uuid; campos `color_bg`, `color_text`, `color_gradient`
- `Candidate` (`maps.candidates`) — sem SoftDeletes, sem uuid, sem sq_candidato; campos: `gender_id`, `name`, `cpf`, `photo_url`; relacionamentos `gender()` e `candidacies()`
- `Candidacy` (`maps.candidacies`) → `belongsTo(Candidate)`, `belongsTo(Party)`, `belongsTo(City)`, `belongsTo(State)`
- `PeopleCandidacy` (`gabinete_master.people_candidacies`) → `belongsTo(People)`, `belongsTo(Candidacy)`
- `SplitCandidacy` (`gabinete_master.split_candidacies`)
- `FinBank` (`gabinete_master.fin_banks`) — com SoftDeletes; `$fillable`: `name`, `bank`, `agency`, `account`, `main`, `order`, `active`
- `FinPaymentMethodType` (`gabinete_master.fin_payment_method_types`) — sem SoftDeletes; `$fillable`: `name`, `order`
- `FinPaymentMethod` (`gabinete_master.fin_payment_methods`) — com SoftDeletes; `$fillable`: `name`, `fin_bank_id`, `fin_payment_method_type_id`, `order`, `active`; `belongsTo(FinBank)`, `belongsTo(FinPaymentMethodType)`
- `Department` (`gabinete_master.departments`) — com SoftDeletes; `$fillable`: `name`, `order`, `active`
- `FinAccount` (`gabinete_master.fin_accounts`) — com SoftDeletes; `$fillable`: `parent_id`, `code`, `name`, `type`, `order`, `active`; `belongsTo(FinAccount, 'parent_id')`, `hasMany(FinAccount, 'parent_id')`
- `FinTitle` (`gabinete_master.fin_titles`) — com SoftDeletes; `$fillable`: todos os campos incluindo `reversed_at` e `cancelled_at`; casts: `amount/discount/interest/amount_paid` → decimal, `due_date/paid_at/reversed_at/cancelled_at` → date; boot: hook `updating` auto-preenche `cancelled_at = now()` quando `status` muda para `cancelled`; `belongsTo(FinAccount, 'account_id')`, `belongsTo(FinPaymentMethod)`, `belongsTo(FinBank)`, `belongsTo(People)`; `hasMany(FinCostCenter)`, `hasMany(FinTitleComposition, 'origin_title_id')`, `hasMany(FinTitleComposition, 'destination_title_id')`
- `FinExtract` (`gabinete_master.fin_extract`) — sem SoftDeletes; `$fillable`: `title_id` (nullable), `account_id`, `type`, `amount`, `date`, `payment_method_id`, `bank_id`, `source` (manual/baixa/estorno)
- `FinWallet` (`gabinete_master.fin_wallets`) — sem SoftDeletes; **redesenhado como ledger**; `$fillable`: `people_id`, `type`, `amount`, `date`, `description`, `title_id`, `source`; casts: `amount` → `decimal:2`, `date` → `date:Y-m-d`; `belongsTo(People, 'people_id')` (removido `title()` relationship)
- `FinCostCenter` (`gabinete_master.fin_cost_centers`) — sem SoftDeletes; `$fillable`: `title_id`, `department_id`, `percentage`; `belongsTo(Department)`
- `FinTitleComposition` (`gabinete_master.fin_title_compositions`) — sem SoftDeletes; `$fillable`: `origin_title_id`, `destination_title_id`
- `FinBankBalance` (`gabinete_master.fin_bank_balances`) — sem SoftDeletes; `$fillable`: `fin_bank_id`, `data`, `valor`; casts: `data` → `date:Y-m-d`, `valor` → `decimal:2`; `belongsTo(FinBank, 'fin_bank_id')`
- `EventType` (`gabinete_master.event_types`) — com SoftDeletes; `$fillable`: `name`, `color`, `all_day`, `order`, `active`; casts: `all_day`/`active` → `boolean`; boot: auto-order no creating, shiftOrder no updating
- `Event` (`gabinete_master.events`) — com SoftDeletes; `$fillable`: `people_id`, `event_type_id`, `modulo`, `name`, `description`, `start_at`, `end_at`, `all_day`, `recurrence`, `gcal_event_id`, `active`; casts: `start_at`/`end_at` → `datetime`, `all_day`/`active` → `boolean`; `belongsTo(EventType)`, `belongsTo(People)`, `hasMany(EventPeople)`
- `EventPeople` (`gabinete_master.event_people`) — com SoftDeletes; `$fillable`: `event_id`, `people_id`, `active`; cast `active` → `boolean`; `belongsTo(People, 'people_id')`
- `City` (`maps.cities`), `State` (`maps.states`), `Country` (`maps.countries`), `Zone` (`maps.zones`), `Section` (`maps.sections`), `VotingLocation` (`maps.voting_locations`), `Vote` (`maps.votes`), `Gender` (`maps.genders`)

### Seeders

> ⚠️ Os arquivos de seeder **não estão versionados** no repositório (`api/database/seeders/` está vazio). Os dados abaixo foram executados em algum momento e existem no banco, mas os `.php` precisam ser recriados.

- `DatabaseSeeder` — cria people + user (Alex / alex@mapadovoto.com, role=admin)
- `PartySeeder` — 30 partidos com color_bg, color_text, color_gradient
- `CandidacySeeder` — Neto Bota (candidacies 2024 Prefeito + 2022 Dep. Estadual)
- `PeopleCandidacySeeder` — vincula Alex → Neto Bota

### TenantMiddleware

`app/Http/Middleware/TenantMiddleware.php` — identifica o gabinete pelo subdomínio (dois ambientes):
1. **Dev:** extrai slug do `Host` header (ex: `master` de `master.mapadovoto-api.test`) — funciona pois a API tem subdomínio
2. **Prod:** API está em `api.mapadovoto.com` → Host dá `api`, não o slug. Fallback: lê o header `Origin` (ex: `https://master.mapadovoto.com`) e extrai o slug
3. Busca em `gabinete_master.tenants` por `slug` + `active=true` + `deleted_at IS NULL`
4. Retorna 404 se tenant não encontrado
5. Armazena tenant em `$request->attributes->set('tenant', $tenant)` — sem `$request->merge()`
6. Executa `SET search_path TO {tenant.schema},maps,public`
7. Registrado via alias `'tenant'` em `bootstrap/app.php`
8. **Obrigatório no grupo auth:** `Route::middleware(['tenant', 'auth:sanctum'])` — sem isso, `$request->attributes->get('tenant')` retorna null nas rotas autenticadas

### Migrations (numeração atual)

| Range | Schema | Conteúdo |
|-------|--------|----------|
| `000001`–`000013` | `gabinete_master` | schema, tenants, PAT, cache, jobs, sessions, type_people, people (inclui birth_date + photo_path), users, permission_actions (inclui order + name_module + name_action), permissions, people_candidacies, split_candidacies |
| `000051`–`000052` | `gabinete_master` | attendances, attendance_history |
| `000053`–`000060` | `gabinete_master` | type_contacts, type_addresses, type_documents, contacts, addresses (campos ViaCEP + lat/lng), documents, notes, files |
| `000061`–`000068` | `gabinete_master` (+ schemas tenant) | fin_banks (seeds: **Tesouraria** main=true + **Nubank PJ**), fin_payment_method_types (seeds: **7 tipos** — Carteira/Dinheiro/Pix/Cartão Débito/Cartão Crédito/Boleto/Transferência), fin_payment_methods (seeds: 7 modalidades vinculadas), departments, fin_accounts (seed: plano de contas completo), fin_titles, fin_extract (`title_id` nullable, `source` default `'manual'`), **fin_wallets** (ledger: `type`, `amount`, `date`, `description`, `title_id`, `source`), fin_cost_centers, fin_title_compositions — **aplicadas em todos os schemas tenant** (`has_schema=true`) |
| `000070`–`000071` | `gabinete_master` (+ schemas tenant) | `000070`: adiciona `reversed_at` (date nullable) em `fin_titles`; `000071`: adiciona `cancelled_at` (date nullable) em `fin_titles` — aplicadas em todos os schemas tenant |
| `000072` | `gabinete_master` | Cria `fin_bank_balances` (id, fin_bank_id unsignedBigInteger, data date, valor decimal(15,2), timestamps) — tabela global, não replicada por tenant |
| `000073` | `gabinete_master` | Cria `event_types` (id, name, color, **all_day boolean default false**, order default 1, active default true, timestamps, deleted_at) — seeds 5 tipos: Aniversário (#3fb6ea, all_day=true)/Financeiro Pagar (#ec637f, all_day=true)/Financeiro Receber (#4fb589, all_day=true)/Compromisso (#fbb810)/Atendimento (#b665ec) |
| `000074` | `gabinete_master` | Cria `events` (id, **people_id bigint NULL** sem FK, event_type_id FK → event_types, modulo nullable, name, description text nullable, start_at, end_at nullable, **all_day boolean default false**, **recurrence varchar default 'none'**, gcal_event_id nullable, active, timestamps, deleted_at) — seed: evento de aniversário de Alex |
| `000075` | `gabinete_master` | Cria `event_people` (id, event_id FK → events cascade delete, people_id bigint sem FK, active, timestamps, deleted_at) — UNIQUE(event_id, people_id) |
| `000101`–`000121` | `maps` | schema, countries, states, cities, zones, voting_locations, sections, genders, candidates, parties, candidacies, votes (inclui índices), tse_votacao_secao (2008–2024 — 9 tabelas de staging, estrutura criada para todos os anos) |

**Observações sobre migrations:**
- `down()` das migrations de schema (000001, 000101) são **no-op** — schemas não são dropados; cada migration de tabela cuida dos seus próprios objetos
- FK cross-schema removida de `people_candidacies` e `split_candidacies` (`candidacy_id` é `unsignedBigInteger` sem constraint — integridade via aplicação)

### Arquivos chave

| Arquivo | Descrição |
|---------|-----------|
| `api/routes/api.php` | Rotas REST |
| `api/bootstrap/app.php` | Registro do alias `tenant` → `TenantMiddleware` |
| `api/app/Http/Middleware/TenantMiddleware.php` | Middleware de identificação de tenant por subdomínio |
| `api/app/Http/Controllers/Auth/AuthController.php` | Login, logout, me — resposta inclui `photo_original/md/sm` via `formatUser()` + `PeopleAvatarController::avatarUrls()` |
| `api/app/Http/Controllers/TenantController.php` | `index`, `store`, `update`, `person`, `storePerson`, `storeClient`. `store()` aceita `people_id` opcional (vincula person ao tenant via `tenant_id`) e `has_schema` (cria schema PostgreSQL apenas se true). `index()` retorna `tenant_id` na listagem. |
| `api/app/Http/Controllers/TypePeopleController.php` | `index`, `store`, `update`, `destroy`; `format()` retorna `created_at`, `updated_at` |
| `api/app/Http/Requests/TypePeopleRequest.php` | Validação: name `sometimes` no update (permite PUT só com `order`), unique, order min:1, active |
| `api/app/Http/Controllers/PeopleController.php` | `index`, `store`, `update`, `destroy` — retorna birth_date, photo_path, photo_original/md/sm, type_people, `created_at`, `updated_at`, `deleted_at`, **`addresses[]`** (cep, logradouro, numero, bairro, cidade, uf + type_address), **`documents[]`** (value + type_document com mask), **`contacts[]`** (value + type_contact com mask) — eager-loaded no index |
| `api/app/Http/Requests/PeopleRequest.php` | Validação: name required, birth_date nullable date, type_people_id nullable exists, active boolean |
| `api/app/Http/Controllers/PeopleAvatarController.php` | `store` (upload avatar → scaling progressivo: lê disco 1x, reduz em cascata 800→400→150px, quality 85/80/75), `destroy` (remove storage); `static avatarUrls(?string)` retorna photo_original/md/sm |
| `api/app/Http/Controllers/PeopleUserController.php` | `show`, `store`, `update` — gerencia usuário vinculado à pessoa. Unique validation usa `Rule::unique('users', 'email')` (sem schema qualificado — depende do `search_path` do TenantMiddleware) |
| `api/app/Http/Controllers/PersonPermissionController.php` | `index` (lista actions ordenadas por `order`, retorna `name_module`/`name_action` + `allowed`), `update` (upsert permissão) |
| `api/app/Http/Controllers/PermissionActionController.php` | `index`, `store`, `update`, `destroy`, `reorder` (lote `[{id,order}]`) — CRUD completo de permission_actions |
| `api/app/Http/Controllers/PersonContactController.php` | CRUD de contatos polimórficos de uma pessoa |
| `api/app/Http/Controllers/PersonAddressController.php` | CRUD de endereços polimórficos — campos ViaCEP + lat/lng |
| `api/app/Http/Controllers/PersonDocumentController.php` | CRUD de documentos polimórficos |
| `api/app/Http/Controllers/PersonNoteController.php` | CRUD de notas polimórficas |
| `api/app/Http/Controllers/PersonFileController.php` | CRUD de arquivos da pessoa + download |
| `api/app/Http/Controllers/TypeContactController.php` | `index`, `store`, `update`, `destroy` — PUT aceita só `order` (name é `sometimes`); `format()` retorna `created_at`, `updated_at` |
| `api/app/Http/Controllers/TypeAddressController.php` | `index`, `store`, `update`, `destroy` — PUT aceita só `order` (name é `sometimes`); `format()` retorna `created_at`, `updated_at` |
| `api/app/Http/Controllers/TypeDocumentController.php` | `index`, `store`, `update`, `destroy` — PUT aceita só `order` (name é `sometimes`); `validity` retorna `bool`; `format()` retorna `created_at`, `updated_at` |
| `api/app/Http/Controllers/CandidateController.php` | `index` (candidaturas por gabinete/master), `search`, `stats`, `cities`. `isMaster()` usa `$request->attributes->get('tenant')->slug` com fallback por Host. `search()`: busca por nome, cargo, ano, partido, UF e cidade (`unaccent(c.name)`); exclui `cy.role NOT ILIKE 'VICE-%'`; para não-master busca `people_candidacies` via query separada e usa `WHERE cy.id IN (...)`. `searchPersons()`: busca em `maps.candidates` por nome (não candidaturas). `candidaciesByPerson()`: lista candidaturas de um `maps.candidate` pelo `candidate_id`, retorna `party_color_gradient`. `stats()`: CTE `party_ids` resolve candidacy_ids do partido antes da varredura principal — elimina LEFT JOIN em 18M+ linhas; `scope_by_round` usa `IN (SELECT id FROM party_ids)` em vez de JOIN |
| `api/app/Http/Controllers/PeopleCandidacyController.php` | `store()`: vincula array de `candidacy_ids` à pessoa via `people_candidacies`; ignora duplicatas existentes |
| `api/app/Http/Controllers/FinBankController.php` | CRUD de bancos — `index` (retorna `formatWithBalance`: inclui `last_balance_data`, `last_balance_valor`, `current_balance` calculado = último saldo + net do extrato após essa data), `store`, `update` (aceita só `order`), `destroy` |
| `api/app/Http/Controllers/FinBankBalanceController.php` | CRUD de saldos de banco — `index`, `store`, `update`, `destroy` |
| `api/app/Http/Controllers/FinPaymentMethodTypeController.php` | CRUD + `reorder` de tipos de modalidade — `index` e `format()` retornam `created_at`, `updated_at` |
| `api/app/Http/Controllers/FinPaymentMethodController.php` | CRUD de modalidades de pagamento — `format()` retorna `created_at`, `updated_at` |
| `api/app/Http/Controllers/FinExtractController.php` | `index` (retorna `{entries, initial_balance}`; filtrável por `bank_id`, `date_from`, `date_to`, `type`, `account_id`, `payment_method_id`, **`payment_method_type_id`** (via `whereHas('paymentMethod')`), **`people_id`** (via `whereHas('title')`); saldo inicial calculado dinamicamente — quando `date_from` informado: busca último `fin_bank_balances` anterior e acumula net do extrato entre essa data e `date_from`; suporta todos os bancos agregados via SQL ou banco específico), `store` (lançamento manual — auto-set `source = 'manual'`). `format()` retorna `people_id`, `people_name`, `source` |
| `api/app/Http/Controllers/DepartmentController.php` | CRUD de departamentos — `index` e `format()` retornam `created_at`, `updated_at` |
| `api/app/Http/Controllers/FinWalletController.php` | `index` (retorna `{entries, summary: {total_in, total_out, balance}}`; filtros: `people_id`, `date_from`, `date_to`), `balance($peopleId)` (retorna saldo calculado de uma pessoa), `store` (cria lançamento manual — valida saldo se `type='out'`; cria também `FinExtract`) |
| `api/app/Http/Controllers/FinAccountController.php` | CRUD + `reorder` do plano de contas hierárquico — `format()` retorna `created_at`, `updated_at` |
| `api/app/Http/Controllers/FinTitleController.php` | `index` (filtros: type, status, people_id, account_id, bank_id, date_from/to), `show`, `store`, `installments` (cria N parcelas em lote atômico), `update` (gera nota automática ao cancelar), `destroy`, `compose`, `pay` (aceita `interest`/`multa`/`discount` + **`excess_action`** (`wallet`\|`change`); valida saldo na carteira quando modalidade Carteira; debita carteira quando `isCarteiraPayment`; excedente: `handleExcess()` — `wallet` gera `FinExtract`+`FinWallet`, `change` gera lançamento estorno do excedente; gera nota automática), `reverse` (seta `reversed_at`, gera extrato `source='estorno'`, **reverte lançamentos de carteira** `source='baixa'` do título, clona título como `pending` copiando cost_centers; gera nota automática nos dois títulos), `clone`. `format()` inclui `reversed_at`, `cancelled_at`, `document_number`. `formatDetail()` inclui `composition_origins` e `composition_destinations` |
| `api/app/Http/Controllers/FinTitleNoteController.php` | Notas de títulos financeiros — `index` (lista por modulo=fin_titles, record_id), `store` (cria com max order+1), `destroy` |
| `api/app/Http/Controllers/FileController.php` | Arquivos genéricos por modulo+recordId — `index` (lista com URL pública), `store` (upload: armazena em `{slug}/files/{modulo}/{recordId}/`), `download`, `destroy` |
| `api/app/Http/Controllers/EventTypeController.php` | CRUD de tipos de evento — `index` (ordenado por order), `store`, `update`, `destroy`; `format()` retorna id, name, color, **all_day**, order, active, `created_at`, `updated_at` |
| `api/app/Http/Controllers/EventController.php` | CRUD de eventos — `index` (filtros: people_id, event_type_id, modulo, start_from, start_to; **expande eventos recorrentes server-side**: não-recorrentes filtrados diretamente no SQL; recorrentes buscados todos e expandidos em PHP via `expandRecurring()`; cada ocorrência recebe `_fc_id: "{id}_{index}"`; resultado ordenado por `start_at`), `show`, `store`, `update`, `destroy`; `syncPeople(Event, array)` upsert/delete em `event_people`; `format()` inclui `all_day`, `recurrence`, `people[]` com name + photo_sm via `eventPeople.people` |
| `api/app/Http/Controllers/CityController.php` | search (`maps.cities`) |
| `api/app/Http/Controllers/StateController.php` | geometry($uf) — retorna GeoJSON do estado |
| `api/app/Models/` | People, User, PersonalAccessToken, Permission, PermissionAction, PersonFile, Party, Candidate, Candidacy, PeopleCandidacy, SplitCandidacy, City, State, Zone, Section, VotingLocation, Vote, Gender |
| `api/app/Providers/AppServiceProvider.php` | `Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class)` |
| `api/database/migrations/` | migrations 2026_03_13_* numeradas 000001–000052 (gabinete) e 000101–000121 (maps) |
| `api/database/seeders/` | ⚠️ Diretório vazio — seeders não versionados (ver seção Seeders acima) |
| `api/config/cors.php` | CORS — `allowed_origins: ['*']` |
| `api/config/database.php` | `search_path: 'gabinete_master,maps,public'` |
| `api/config/app.php` | `timezone` lido via `env('APP_TIMEZONE', 'UTC')` — `.env` define `APP_TIMEZONE=America/Sao_Paulo` para timestamps corretos no fuso de Brasília |

### Frontend → Backend

- `maps/.env` → `VITE_API_URL=http://mapadovoto-api.test/api` (usado como fallback)
- `maps/src/lib/api.ts` → baseURL dinâmica: extrai subdomínio de `window.location.hostname` e monta `http://{subdomain}.mapadovoto-api.test/api`; fallback para `VITE_API_URL` quando não há subdomínio; interceptor Bearer token (localStorage)

---

## Mapa (Leaflet)

### Tile Layer

**CartoDB Positron** (gratuito, sem API key):
```
https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
```

### Comportamento ao login

- Ao logar: mapa exibe contorno do Brasil inteiro (sem divisão de estados)
- URL: `https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson` → filtro `ADMIN === 'Brazil'`
- Ao selecionar candidato: remove contorno do Brasil e desenha polígono do cargo

### Polígonos por Cargo

Lógica em `mapa-do-voto-map.tsx` via `MUNICIPAL_ROLES` e `STATE_ROLES`:

**Cargos municipais** (PREFEITO, PREFEITA, VEREADOR, VEREADORA, etc):
- Busca GeoJSON via tbrugz: `https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-{ibge_estado}-mun.json`
- Match por nome da cidade (ibge_code ainda NULL no banco)
- Estilo: color #1D3557, weight 2, fillOpacity 0.05

**Cargos estaduais** (DEPUTADO ESTADUAL, DEPUTADO FEDERAL, SENADOR, GOVERNADOR, etc):
- Busca via `GET /api/states/{uf}/geometry`
- Painel colapsível "Visualização" aparece no overlay do mapa (canto superior esquerdo) → Switch "Exibir Cidades" + CitySearch
- Ao marcar "Exibir Cidades": remove polígono do estado, exibe municípios individualmente com heatmap de votos
- Heatmap: paleta azul→verde→amarelo→vermelho baseada em qty_votes; cidades sem votos em cinza
- Match GeoJSON ↔ banco: exact → normalized (sem acento) → prefix → Levenshtein ≤ 2
- Ao clicar num município: destaque (`CITIES_HIGHLIGHT_STYLE`) + flyToBounds + atualiza stats na sidebar
- `CitySearch` no overlay: lista cidades agrupadas em "Com votos / Sem votos" com dropdown via portal; exibe "CIDADE - UF"; busca normalizada sem acentos (`normalizeName`); prop `stateUf` vinda de `activeCandidate.state_uf`
- Cidade sem votos: `StatsCard` exibe "0 votos nesta cidade" (rounds vazio → stat null → fallback visual)
- Legenda do heatmap: gradiente vertical no canto inferior direito; tooltip hover mostra valor aproximado (ex: `2.5k votos`) seguindo mouse — calculado com escala log inversa (`Math.pow(maxVotes, 1 - yRatio)`)
- Ao limpar cidade (`clearCityHighlight`): reseta highlight no `citiesLayerRef` e volta zoom ao `polygonLayerRef` (estado) com `maxZoom:7`
- Ao desmarcar "Exibir Cidades": volta zoom ao `polygonLayerRef` com `maxZoom:7`

**UF → código IBGE estado** (mapeamento em `UF_TO_IBGE` no mapa-do-voto-map.tsx):
- SP=35, RJ=33, MG=31, etc.

### Layers do mapa (mapa-do-voto-map.tsx)
- `brazilLayerRef` — contorno do Brasil (sem candidato)
- `polygonLayerRef` — polígono do estado ou município do candidato
- `citiesLayerRef` — municípios do estado (quando "Exibir Cidades" marcado)
- `focusedCityBoundsRef` — bounds da cidade atualmente focada (clique no polígono ou seleção via CitySearch); usado pelo crosshair; limpo ao desselecionar cidade ou desmarcar "Exibir Cidades"
- Todos com `cancelled` flag para evitar race condition em fetches

### Limites do Brasil (`BRAZIL_BOUNDS`)

```ts
const BRAZIL_BOUNDS: L.LatLngBoundsExpression = [[-33.75, -73.99], [5.27, -28.85]]
```

- `maxBounds={BRAZIL_BOUNDS}` + `maxBoundsViscosity={1.0}` no `MapContainer` — impede arrastar fora do Brasil
- `MinZoomController` — componente interno que calcula `minZoom` dinamicamente via `map.getBoundsZoom(BRAZIL_BOUNDS)` e recalcula no evento `resize` do mapa
- Garante que em qualquer tamanho de tela o usuário nunca vê fora do Brasil

### Clique no município

- Camada GeoJSON tem `onEachFeature` com `layer.on('click', ...)`
- Ao clicar: `map.flyToBounds(bounds, { padding: [40, 40], duration: 1 })`
- Cursor pointer automático via `.leaflet-interactive` (Leaflet default)

### Botões flutuantes (canto inferior direito)

- **Crosshair** — re-executa fitBounds (focar na cidade) — card separado
- **+/-** — zoom in/out no mesmo card com divisor interno
- `zoomControl={false}` no MapContainer
- Estilo: `bg-white border border-gray-200 rounded-xl shadow-sm w-10 h-10`

### Attribution

```css
.leaflet-control-attribution {
  font-size: 9px !important;
  opacity: 0.6;
}
.leaflet-interactive:focus { outline: none } /* remove borda retangular ao clicar em polígono */
```

---

## Split View

Estado `isSplit` em `src/pages/home/page.tsx`. Botão `Columns2` na Toolbar.

**Sincronização entre mapas:**
- `mapRef1` + `mapRef2` via `useRef<L.Map | null>(null)`
- Prop `syncRef` no `MapaDoVotoMap` — propaga `move`/`zoom` via `setView`
- Flag `isSyncing` (useRef) evita loop infinito

**Ao ativar:** `invalidateSize()` + `fitBounds()` nos dois mapas após 100ms

**Ao fechar:** `invalidateSize()` + `fitBounds()` no mapa principal após 100ms

**Lado direito:** exibe `CandidateSearch` (Autocomplete) → após seleção, substitui pelo card do candidato escolhido com botão **X** para voltar ao autocomplete (`setSelected(null)`)

**Botões flutuantes (crosshair + zoom):** aparecem apenas no mapa esquerdo (`isCompare=false`). O mapa de comparação não exibe controles próprios.

### fitToCity — clique no polígono e botão crosshair

Função centralizada em `MapCore`. Comportamento inteligente:
- Se `focusedCityBoundsRef.current` existe → foca na cidade (padding [0,40]/[40,40])
- Senão → foca no estado via `cityBounds` (padding [0,20]/[20,20] + maxZoom:7)

```ts
const fitToCity = useCallback(() => {
  const focused = focusedCityBoundsRef.current
  const bounds  = focused ?? cityBounds
  if (!bounds) return
  const opts = focused
    ? { paddingTopLeft: [0, 40], paddingBottomRight: [40, 40], duration: 1 }
    : { paddingTopLeft: [0, 20], paddingBottomRight: [20, 20], maxZoom: 7, duration: 1 }
  map.flyToBounds(bounds, opts)
  syncRef?.current?.flyToBounds(bounds, opts)
  setTimeout(() => { isSyncingRef.current = false }, 1500)
}, [cityBounds, map, isSyncingRef, syncRef])
```

- `cityBounds` → estado em `home/page.tsx` (`useState<L.LatLngBounds | null>`), definido quando o GeoJSON carrega
- `setTimeout(1500)` evita race condition entre os dois mapas no split mode

---

## Card do Candidato e Stats

- `CandidateCard` + `StatsCard` exibidos como overlay flutuante no canto superior esquerdo do mapa
- Controlados por `showCard` do contexto: opacidade 20% quando oculto, 100% quando visível, com transição
- Toggle via botão Eye/EyeOff na Navbar
- `StatsCard`: exibe qty_votes, percentual, barra de progresso (Progress), badge de Status TSE; suporte a múltiplos turnos via botões segmentados; quando cidade sem votos (rounds vazio) exibe "0 votos nesta cidade"

---

## Status TSE

Mapeamento em `mapa-do-voto-map.tsx` e `sidebar.tsx` via `STATUS_MAP` / `STATUS_COLORS` + `resolveStatus(raw)`:

| Status TSE | Label exibido | Cor |
|---|---|---|
| ELEITO | ELEITO | green |
| ELEITO POR QP | ELEITO POR QP | green |
| ELEITO POR MÉDIA | ELEITO POR MÉDIA | green |
| 2º TURNO | ELEITO (2° TURNO) | green |
| NÃO ELEITO | NÃO ELEITO | red |
| SUPLENTE | SUPLENTE | yellow |

Fallback: label = raw, cor = red.

---

## Cores dos Partidos (`src/lib/party-colors.ts`)

30 partidos com `{ bg, text, gradient?, hex }`. Partidos com duas cores usam gradiente vertical:

- **UNIÃO:** `linear-gradient(180deg, #003087 50%, #C8970A 50%)`
- **MDB:** `linear-gradient(180deg, #007A33 50%, #FFD700 50%)`

Badge com gradiente:
```tsx
style={{ background: gradient, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)', fontWeight: 'bold' }}
```

Função: `getPartyColors(party: string)` → fallback `bg-gray-100 text-gray-600`

---

## Módulos Futuros (guardados)

### Atendimentos
Cada atendimento do político = pin no mapa com endereço, data e tipo. Prova de trabalho na campanha.

### Inteligência de Alianças
Relatório premium cruzando histórico TSE com candidatos aliados potenciais, ranqueando por município.

---

## Deploy

**VPS:** `root@168.231.64.36` (pago até 2027-04-11)
**Domínio:** `mapadovoto.com`

---

## Notion

- Acesso restrito à página do projeto: https://www.notion.so/Mapa-do-Voto-328764dd18d18145a9b6fe0388ff7d6d
- Page ID: `328764dd18d18145a9b6fe0388ff7d6d`
- Nunca ler, criar ou modificar páginas fora desta hierarquia