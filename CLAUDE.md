# CLAUDE.md — Mapa do Voto
<!-- Atualizado em: 16/03/2026 -->

> Plataforma de mapas geoespaciais para inteligência eleitoral. Permite visualizar dados de votação, atendimentos e estratégias de campanha em mapa interativo.

---

## Regras do Claude Code

- NÃO fazer git add/commit/push sem ser solicitado
- Implementar SOMENTE o que for pedido na tarefa
- Ao final de cada tarefa, gerar um resumo compacto em um único bloco de código para copiar com um clique
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
- Um banco PostgreSQL com dois schemas: `gabinete_master` (auth/tenants) e `maps` (dados eleitorais)
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
- **DB:** PostgreSQL 17 (único banco)
- **Auth:** Sanctum token-based (Bearer)

---

## Estrutura Local

```
C:\Herd\mapa-do-voto\
├── api\           → Laravel 12 (backend REST API)
├── maps\          → Vite + React + Metronic (app do mapa)
├── site\          → Next.js (landing page — não iniciada ainda)
├── tse\           → Scripts/dados de importação TSE
├── run_import.bat → Script de importação TSE (Windows)
└── .git
```

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
| `src/pages/home/page.tsx` | Página principal. Sistema de abas: Gabinetes (só `master`), Mapa, Atendimentos, Agenda, Alianças, Finanças, Configurações. Detecta `isMaster` pelo subdomínio. Aba Gabinetes carrega `GET /api/tenants` e exibe `GabinetesDataGrid`. Aba Configurações exibe `AppMegaMenu` com seções: Pessoas (DataGrid + Modal), Tipos de Pessoa, Tipos de Contato, Tipos de Endereço, Tipos de Documento. Botão split só visível no `isMaster`. Navbar exibe dropdown de seleção de gabinete (redireciona para `{slug}.mapadovoto.com`). |
| `src/components/map/mapa-do-voto-map.tsx` | Mapa Leaflet + CandidateCard + StatsCard (overlay flutuante) + CitySearch + heatmap + botões flutuantes |
| `src/components/map/candidate-search.tsx` | Autocomplete com avatar, PartyBadge, CandidateInfo — variants: `map`, `sidebar`, `modal`; no modal busca apenas id/name/photo_url sem party/role; dropdown com `onMouseDown`+`preventDefault` para funcionar dentro de Radix Dialog |
| `src/components/mapa-do-voto/sidebar.tsx` | Painel lateral: stats reais, turno dinâmico, badge Status TSE flutuante |
| `src/components/map/active-candidate-context.tsx` | Contexto global: activeCandidate, setActiveCandidate, showCities, setShowCities, showCard, setShowCard, mapClickedCity (inclui city_id), focusCityOnMap, clearCityHighlight |
| `src/components/auth/login-modal.tsx` | Modal de login automático; usa logo SVG `/media/logo/logo.svg`; exibe link "Crie sua conta!" quando gabinete não encontrado |
| `src/components/auth/login-modal-context.tsx` | Contexto global do modal |
| `src/components/layout/active-tab-context.tsx` | Contexto `ActiveTabProvider`/`useActiveTab` — persiste aba ativa no `localStorage` (chave `mapadovoto:activeTab`); default: `overview` |
| `src/components/gabinetes/gabinetes-data-grid.tsx` | Data grid de tenants: colunas ID, Nome (clicável → `onEdit`), Subdomínio (link externo), Validade (badge com alerta vencimento), Status, Ações (editar/excluir); prop `onEdit` |
| `src/components/gabinetes/gabinete-create-modal.tsx` | Modal de criação de gabinete com 2 steps: Step 1 "Em breve", Step 2 Candidato (`CandidateSearch variant=modal`) + Subdomínio; auto-preenche slug pelo ballot_name |
| `src/components/gabinetes/gabinete-edit-modal.tsx` | Modal de edição de tenant |
| `src/components/common/app-mega-menu.tsx` | Wrapper reutilizável do MegaMenu do Layout 1 — usado nas abas Gabinetes e Configurações |
| `src/components/people/people-data-grid.tsx` | DataGrid de pessoas: colunas ID, Nome (clicável), Aniversário (com ícone `PartyPopper` pulsante no dia), Tipo, Status, Ações |
| `src/components/people/people-modal.tsx` | Modal de pessoas: Create (small) + Detail (large 2 painéis). Aba Endereços: layout 2 colunas — esquerda campos com ViaCEP + geocoding Nominatim, direita mapa Leaflet com pin SVG e `flyTo` automático |
| `src/components/type-people/` | CRUD de tipos de pessoa (DataGrid + Modal) |
| `src/components/type-contacts/` | CRUD de tipos de contato (DataGrid + Modal) |
| `src/components/type-addresses/` | CRUD de tipos de endereço (DataGrid + Modal) |
| `src/components/type-documents/` | CRUD de tipos de documento (DataGrid + Modal) |
| `src/lib/api.ts` | axios com interceptor Bearer + timeout 30s |
| `src/lib/helpers.ts` | Utilitários: `formatDate` (fix timezone — strings `YYYY-MM-DD` parseadas com `T00:00:00` para evitar desvio UTC), `formatDateTime`, `formatRecordCount` (ex: "Encontrei 3 registros") |
| `src/lib/party-colors.ts` | Cores + hex dos 30 partidos |
| `src/lib/leaflet-icon-fix.ts` | Fix ícone Leaflet no Vite |
| `src/routing/app-routing-setup.tsx` | Rotas |

### Logo Mapa do Voto

Ícone `MapPin` vermelho (#E63946) + "Mapa"(normal) + "do Voto"(bold), text-xl. Exibido no `header.tsx` (mobile) e no `sidebar-header.tsx` foi removido.

### Abas da Toolbar

Abas: **Mapa**, **Atendimentos**, **Agenda**, **Alianças**, **Finanças**, **Configurações** (ícone `Settings`, visível para todos). Aba **Gabinetes** (`isMaster`) existe como `TabsContent` mas não tem `TabsTrigger` — acesso via lógica interna. Aba ativa persiste via `ActiveTabProvider` no `localStorage`.

Abas **Gabinetes** e **Configurações** exibem `<AppMegaMenu />` (NavigationMenu do Layout 1) acima do conteúdo.

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
- **Laravel:** 12.53.0 | **PHP:** 8.4 | **PostgreSQL:** 17.7
- **Banco:** `cm_politico` | **Usuário:** `mapadovoto`

### Rotas da API

| Método | Endpoint | Auth | Middleware | Descrição |
|--------|----------|------|------------|-----------|
| GET | `/api/tenants` | pública | — | Lista todos os tenants ativos (id, name, slug, active, valid_until) |
| POST | `/api/tenants` | Bearer | — | Cria novo tenant: valida slug único, cria schema PostgreSQL |
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
| GET | `/api/auth/tenant` | pública | `tenant` | Valida se o subdomínio corresponde a um tenant ativo; retorna 200 ou 404 |
| POST | `/api/auth/login` | pública | `tenant` | Retorna token + user + people; identifica gabinete pelo subdomínio |
| POST | `/api/auth/logout` | Bearer | — | Revoga token atual |
| GET | `/api/auth/me` | Bearer | — | Retorna usuário autenticado + people |
| GET | `/api/candidates/search?q=` | **pública** | — | Busca em `maps.candidates` por nome (retorna id, name, photo_url) — sem candidaturas, sem auth |
| GET | `/api/candidates` | Bearer | — | Lista candidaturas; master vê todas, user vê apenas as vinculadas via people_candidacies |
| GET | `/api/candidacies/{id}/stats?city_id=` | Bearer | — | Retorna votos por turno: qty_votes, %, brancos, nulos, legenda, total partido, status TSE |
| GET | `/api/candidacies/{id}/cities` | Bearer | — | Retorna cidades do estado do candidato com qty_votes agregados (vote_type=candidate, maior turno) |
| GET | `/api/cities/search?q=&state_id=` | Bearer | — | Busca cidades com unaccent, filtro state_id, limit 10 |
| GET | `/api/states/{uf}/geometry` | pública | — | Retorna geometry GeoJSON do estado (campo geometry da tabela states) |

### Schemas e Tabelas

**Schema `gabinete_master`** — auth, tenants, usuários da plataforma:

| Tabela | Descrição |
|--------|-----------|
| `gabinete_master.tenants` | Gabinetes (id, name, slug unique, schema unique, active, valid_until) — slug identifica o tenant pelo subdomínio |
| `gabinete_master.type_people` | Tipos de pessoa (id, name, order, active, deleted_at) — seeds: Admin(1), Político(2), Equipe(3), Eleitor(4) |
| `gabinete_master.people` | Usuários da plataforma (id, tenant_id nullable FK, type_people_id nullable FK, name, birth_date nullable, active) |
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
| `gabinete_master.permission_actions` | Ações de permissão por módulo (people, attendances, map, restrictions) |
| `gabinete_master.permissions` | Permissões por people (people_id, permission_action_id, allowed) |
| `gabinete_master.attendances` | Atendimentos (people_id, title, description, address, lat, lng, status, opened_at, resolved_at) |
| `gabinete_master.attendance_history` | Histórico de status dos atendimentos |
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
| `maps.votes` | Votos por seção, particionada RANGE(year) (id, candidacy_id, country_id, state_id, city_id, zone_id, voting_location_id, section_id, year, round, qty_votes, vote_type) |
| `maps.tse_votacao_secao_2024` | Staging bruta TSE 2024 (26 colunas text) |
| `maps.tse_votacao_secao_2022` | Staging bruta TSE 2022 (26 colunas text) |

### Models e relacionamentos

Todos os models têm `$table` explícito com schema qualificado.

- `Tenant` (`gabinete_master.tenants`) — com SoftDeletes; campos `name`, `slug`, `schema`, `active`, `valid_until`; cast `valid_until` → `date`
- `TypePeople` (`gabinete_master.type_people`) — com SoftDeletes; `$fillable`: `name`, `order`, `active`; evento `creating`: auto `max+1` se order vazio, reordena se duplicado; evento `updating`: reordena se order alterado; relacionamento `people()`
- `People` (`gabinete_master.people`) — sem SoftDeletes, sem uuid; `$fillable`: `tenant_id`, `type_people_id`, `name`, `birth_date`, `active`; cast `birth_date` → `date:Y-m-d`; relacionamentos `typePeople()` e `peopleCandidacies()`
- `TypeContact` (`gabinete_master.type_contacts`) — com SoftDeletes; campos `name`, `mask`, `order`, `active`
- `TypeAddress` (`gabinete_master.type_addresses`) — com SoftDeletes; campos `name`, `order`, `active`
- `TypeDocument` (`gabinete_master.type_documents`) — com SoftDeletes; campos `name`, `mask`, `order`, `active`
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
- `City` (`maps.cities`), `State` (`maps.states`), `Country` (`maps.countries`), `Zone` (`maps.zones`), `Section` (`maps.sections`), `VotingLocation` (`maps.voting_locations`), `Vote` (`maps.votes`), `Gender` (`maps.genders`)

### Seeders

- `DatabaseSeeder` — cria people + user (Alex / alex@mapadovoto.com, role=admin)
- `PartySeeder` — 30 partidos com color_bg, color_text, color_gradient
- `CandidacySeeder` — Neto Bota (candidacies 2024 Prefeito + 2022 Dep. Estadual)
- `PeopleCandidacySeeder` — vincula Alex → Neto Bota

### TenantMiddleware

`app/Http/Middleware/TenantMiddleware.php` — identifica o gabinete pelo subdomínio:
1. Extrai subdomínio de `$request->getHost()` (ex: `netobota` de `netobota.mapadovoto.com`)
2. Busca em `gabinete_master.tenants` por `slug` + `active=true` + `deleted_at IS NULL`
3. Retorna 404 se subdomínio ausente ou tenant não encontrado
4. Armazena tenant apenas em `$request->attributes->set('tenant', $tenant)` — sem `$request->merge()`
5. Executa `SET search_path TO {tenant.schema},maps,public`
6. Registrado via alias `'tenant'` em `bootstrap/app.php`

### Migrations (numeração atual)

| Range | Schema | Conteúdo |
|-------|--------|----------|
| `000001`–`000052` | `gabinete_master` | schema, tenants, PAT, cache, jobs, type_people, people, users, permission_actions, permissions, people_candidacies, split_candidacies, attendances, attendance_history |
| `000053`–`000060` | `gabinete_master` | type_contacts, type_addresses, type_documents, contacts, addresses (campos ViaCEP + lat/lng), documents, notes, files |
| `000061` | `gabinete_master` | add birth_date na tabela people |
| `000101`–`000121` | `maps` | schema, countries, states, cities, zones, voting_locations, sections, genders, candidates, parties, candidacies, votes, tse_votacao_secao (2008–2024) |

### Arquivos chave

| Arquivo | Descrição |
|---------|-----------|
| `api/routes/api.php` | Rotas REST |
| `api/bootstrap/app.php` | Registro do alias `tenant` → `TenantMiddleware` |
| `api/app/Http/Middleware/TenantMiddleware.php` | Middleware de identificação de tenant por subdomínio |
| `api/app/Http/Controllers/Auth/AuthController.php` | Login, logout, me |
| `api/app/Http/Controllers/TenantController.php` | `index`, `store`, `update`, `person`, `storePerson` |
| `api/app/Http/Controllers/TypePeopleController.php` | `index`, `store`, `update`, `destroy` |
| `api/app/Http/Requests/TypePeopleRequest.php` | Validação: name unique (sem schema qualificado), order min:1, active |
| `api/app/Http/Controllers/PeopleController.php` | `index`, `store`, `update`, `destroy` — retorna birth_date, type_people |
| `api/app/Http/Requests/PeopleRequest.php` | Validação: name required, birth_date nullable date, type_people_id nullable exists, active boolean |
| `api/app/Http/Controllers/PersonContactController.php` | CRUD de contatos polimórficos de uma pessoa |
| `api/app/Http/Controllers/PersonAddressController.php` | CRUD de endereços polimórficos — campos ViaCEP + lat/lng |
| `api/app/Http/Controllers/PersonDocumentController.php` | CRUD de documentos polimórficos |
| `api/app/Http/Controllers/PersonNoteController.php` | CRUD de notas polimórficas |
| `api/app/Http/Controllers/TypeContactController.php` | `index`, `store`, `update`, `destroy` |
| `api/app/Http/Controllers/TypeAddressController.php` | `index`, `store`, `update`, `destroy` |
| `api/app/Http/Controllers/TypeDocumentController.php` | `index`, `store`, `update`, `destroy` |
| `api/app/Http/Controllers/CandidateController.php` | `index` (candidaturas por gabinete/master), `search` (busca pública em maps.candidates), `stats`, `cities` |
| `api/app/Http/Controllers/CityController.php` | search (`maps.cities`) |
| `api/app/Http/Controllers/StateController.php` | geometry($uf) — retorna GeoJSON do estado |
| `api/app/Models/` | People, User, PersonalAccessToken, Party, Candidate, Candidacy, PeopleCandidacy, SplitCandidacy, City, State, Zone, Section, VotingLocation, Vote, Gender |
| `api/app/Providers/AppServiceProvider.php` | `Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class)` |
| `api/database/migrations/` | migrations 2026_03_13_* numeradas 000001–000052 (gabinete) e 000101–000121 (maps) |
| `api/database/seeders/` | DatabaseSeeder, PartySeeder, CandidacySeeder, PeopleCandidacySeeder |
| `api/config/cors.php` | CORS — `allowed_origins: ['*']` |
| `api/config/database.php` | `search_path: 'gabinete_master,maps,public'` |

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
- `CitySearch` no overlay: lista cidades agrupadas em "Com votos / Sem votos" com dropdown via portal
- Legenda do heatmap (gradiente vertical) exibida no canto inferior direito quando `showCities && maxVotes > 0`
- Ao limpar cidade na sidebar: `clearCityHighlight` reseta highlight e volta ao fitBounds do estado

**UF → código IBGE estado** (mapeamento em `UF_TO_IBGE` no mapa-do-voto-map.tsx):
- SP=35, RJ=33, MG=31, etc.

### Layers do mapa (mapa-do-voto-map.tsx)
- `brazilLayerRef` — contorno do Brasil (sem candidato)
- `polygonLayerRef` — polígono do estado ou município do candidato
- `citiesLayerRef` — municípios do estado (quando "Exibir Cidades" marcado)
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

Função centralizada em `MapCore` que move ambos os mapas para o município:

```ts
const fitToCity = useCallback(() => {
  if (!cityBounds) return
  isSyncingRef.current = true
  map.flyToBounds(cityBounds, { padding: [40, 40], duration: 1 })
  syncRef?.current?.flyToBounds(cityBounds, { padding: [40, 40], duration: 1 })
  setTimeout(() => { isSyncingRef.current = false }, 1500) // > duration, evita race condition
}, [cityBounds, map, isSyncingRef, syncRef])
```

- `cityBounds` → estado em `home/page.tsx` (`useState<L.LatLngBounds | null>`), definido quando o GeoJSON carrega no mapa 1, passado como prop para ambos os mapas
- Clique no polígono usa `fitToCityRef.current()` (ref da função) para evitar stale closure no `onEachFeature` com deps `[]`
- `setTimeout(1500)` em vez de `moveend` evita race condition entre os dois mapas no split mode

---

## Card do Candidato e Stats

- `CandidateCard` + `StatsCard` exibidos como overlay flutuante no canto superior esquerdo do mapa
- Controlados por `showCard` do contexto: opacidade 20% quando oculto, 100% quando visível, com transição
- Toggle via botão Eye/EyeOff na Navbar
- `StatsCard`: exibe qty_votes, percentual, barra de progresso (Progress), badge de Status TSE; suporte a múltiplos turnos via botões segmentados

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