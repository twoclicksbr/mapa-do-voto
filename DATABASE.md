# DATABASE.md — Mapa do Voto
> Documentação completa do banco de dados PostgreSQL 17.
> Banco: `cm_politico` | Usuário: `mapadovoto`
> Gerado em: 15/03/2026

---

## Visão Geral

O banco é dividido em dois schemas:

| Schema | Propósito |
|---|---|
| `gabinete_master` | Autenticação, tenants, usuários, permissões e atendimentos da plataforma |
| `maps` | Dados eleitorais do TSE: candidatos, partidos, candidaturas, votos, localidades |

O multi-tenant funciona por **subdomínio**: cada requisição identifica o tenant pelo subdomínio, o `TenantMiddleware` executa `SET search_path TO {tenant.schema},maps,public`, isolando os dados por gabinete.

---

## Schema `gabinete_master`

### `gabinete_master.tenants`
Cadastro dos gabinetes (clientes da plataforma). Cada tenant corresponde a um subdomínio.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do gabinete (ex: "Mapa do Voto") |
| `slug` | varchar | NOT NULL | Subdomínio de acesso (ex: `netobota`) — **unique** |
| `schema` | varchar | NOT NULL | Nome do schema PostgreSQL do tenant (ex: `gabinete_netobota`) — **unique** |
| `active` | boolean | NOT NULL | Se o tenant está ativo (default: `true`) |
| `valid_until` | date | NOT NULL | Data de validade do contrato |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índices:** `slug` unique, `schema` unique
**Seed:** `{ name: 'Mapa do Voto', slug: 'mapadovoto', schema: 'gabinete_master', valid_until: '2026-06-24' }`

---

### `gabinete_master.type_people`
Tipos de pessoa da plataforma. Lookup table com os perfis disponíveis.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do tipo (Admin, Político, Equipe, Eleitor) |
| `order` | integer | NOT NULL | Ordem de exibição (default: 0) — auto max+1 no insert; reordena automaticamente se duplicado |
| `active` | boolean | NOT NULL | Se está ativo (default: `true`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seeds:** Admin (order 1), Político (order 2), Equipe (order 3), Eleitor (order 4)

---

### `gabinete_master.people`
Pessoas cadastradas na plataforma. Representa qualquer usuário humano: admins, políticos, equipe ou eleitores.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `tenant_id` | bigint | NULL | FK → `tenants.id` — gabinete ao qual a pessoa pertence |
| `type_people_id` | bigint | NULL | FK → `type_people.id` — tipo do perfil |
| `name` | varchar | NOT NULL | Nome completo |
| `active` | boolean | NOT NULL | Se está ativo (default: `true`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Relacionamentos:**
- `belongsTo` → `type_people` via `type_people_id`
- `hasMany` → `users`
- `hasMany` → `people_candidacies`
- `hasMany` → `permissions`
- `hasMany` → `attendances`

**Seed:** Alex Alves de Almeida (Admin, tenant_id: 1)

---

### `gabinete_master.users`
Credenciais de acesso. Cada pessoa pode ter um usuário para login.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `people_id` | bigint | NOT NULL | FK → `people.id` |
| `email` | varchar | NOT NULL | E-mail de login — **unique** |
| `password` | varchar | NOT NULL | Hash bcrypt da senha |
| `active` | boolean | NOT NULL | Se está ativo (default: `true`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índices:** `email` unique
**Relacionamentos:**
- `belongsTo` → `people` via `people_id`
- `hasMany` → `personal_access_tokens` (via Sanctum)

**Seed:** `alex@mapadovoto.com` / `Alex1985@`

---

### `gabinete_master.personal_access_tokens`
Tokens de autenticação Sanctum. Model customizado para incluir o campo `schema`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `tokenable_type` | varchar | NOT NULL | Tipo do model dono do token (ex: `App\Models\User`) |
| `tokenable_id` | bigint | NOT NULL | ID do model dono |
| `name` | varchar | NOT NULL | Nome do token (ex: `api`) |
| `token` | varchar(64) | NOT NULL | Hash do token — **unique** |
| `abilities` | text | NULL | JSON com as permissões do token |
| `last_used_at` | timestamp | NULL | Última utilização |
| `expires_at` | timestamp | NULL | Expiração (null = não expira) |
| `schema` | varchar | NULL | Schema do tenant no momento da criação — usado para roteamento multi-tenant |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Índices:** `token` unique, índice composto `(tokenable_type, tokenable_id)`

---

### `gabinete_master.permission_actions`
Catálogo de ações possíveis por módulo. Define o que pode ser permitido ou negado.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `module` | varchar | NOT NULL | Módulo (people, attendances, map, restrictions) |
| `action` | varchar | NOT NULL | Ação (view, create, update, delete) |
| `description` | varchar | NULL | Descrição opcional |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seeds (13 registros):**

| module | action |
|---|---|
| people | view, create, update, delete |
| attendances | view, create, update, delete |
| map | view |
| restrictions | view, create, update, delete |

---

### `gabinete_master.permissions`
Permissões por pessoa. Cada linha define se uma pessoa tem ou não uma ação específica.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `people_id` | bigint | NOT NULL | FK → `people.id` |
| `permission_action_id` | bigint | NOT NULL | FK → `permission_actions.id` |
| `allowed` | boolean | NOT NULL | Se a ação está permitida (default: `true`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Relacionamentos:**
- `belongsTo` → `people`
- `belongsTo` → `permission_actions`

---

### `gabinete_master.people_candidacies`
Vínculo entre pessoas da plataforma e candidaturas do TSE. Define quais candidatos um usuário pode visualizar/gerenciar.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `people_id` | bigint | NOT NULL | FK → `people.id` (cascade delete) |
| `candidacy_id` | bigint | NOT NULL | FK → `maps.candidacies.id` (cascade delete) |
| `order` | integer | NOT NULL | Ordem de exibição (default: 1) |
| `active` | boolean | NOT NULL | Se o vínculo está ativo (default: `true`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Índices:** unique `(people_id, candidacy_id)`
**Relacionamentos:**
- `belongsTo` → `people`
- `belongsTo` → `maps.candidacies`
- `hasMany` → `split_candidacies`

---

### `gabinete_master.split_candidacies`
Candidato configurado para o painel de comparação (split view) de uma candidatura principal.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `people_candidacy_id` | bigint | NOT NULL | FK → `people_candidacies.id` (cascade delete) — candidatura principal |
| `candidacy_id` | bigint | NOT NULL | FK → `maps.candidacies.id` (cascade delete) — candidato do lado direito do split |
| `order` | integer | NOT NULL | Ordem (default: 1) |
| `active` | boolean | NOT NULL | Se está ativo (default: `true`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Índices:** unique `(people_candidacy_id, candidacy_id)`
**Relacionamentos:**
- `belongsTo` → `people_candidacies`
- `belongsTo` → `maps.candidacies`

---

### `gabinete_master.attendances`
Atendimentos realizados pelo político. Cada atendimento é um pin no mapa com endereço georreferenciado.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `people_id` | bigint | NOT NULL | FK → `people.id` — pessoa que registrou |
| `title` | varchar | NOT NULL | Título/assunto do atendimento |
| `description` | text | NULL | Descrição detalhada |
| `address` | varchar | NULL | Endereço textual |
| `lat` | decimal(10,7) | NULL | Latitude |
| `lng` | decimal(10,7) | NULL | Longitude |
| `status` | enum | NOT NULL | Estado: `aberto`, `em_andamento`, `resolvido` (default: `aberto`) |
| `opened_at` | timestamp | NULL | Data de abertura |
| `resolved_at` | timestamp | NULL | Data de resolução |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Relacionamentos:**
- `belongsTo` → `people`
- `hasMany` → `attendance_history`

---

### `gabinete_master.attendance_history`
Histórico de mudanças de status de um atendimento.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `attendance_id` | bigint | NOT NULL | FK → `attendances.id` |
| `status` | enum | NOT NULL | Status registrado: `aberto`, `em_andamento`, `resolvido` |
| `notes` | text | NULL | Observações da mudança |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Relacionamentos:**
- `belongsTo` → `attendances`

---

### `gabinete_master.cache`
Cache do framework Laravel. Gerenciado automaticamente.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `key` | varchar | NOT NULL | PK — chave do cache |
| `value` | mediumtext | NOT NULL | Valor serializado |
| `expiration` | integer | NOT NULL | Unix timestamp de expiração |

---

### `gabinete_master.jobs`
Fila de jobs assíncronos do Laravel.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `queue` | varchar | NOT NULL | Nome da fila — **índice** |
| `payload` | longtext | NOT NULL | Payload serializado do job |
| `attempts` | tinyint unsigned | NOT NULL | Número de tentativas |
| `reserved_at` | integer unsigned | NULL | Unix timestamp de quando foi reservado |
| `available_at` | integer unsigned | NOT NULL | Unix timestamp de quando ficará disponível |
| `created_at` | integer unsigned | NOT NULL | Unix timestamp de criação |

---

## Schema `maps`

### `maps.countries`
Países. Atualmente contém apenas Brasil (id=1).

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do país (ex: `Brasil`) |
| `geometry` | json | NULL | GeoJSON do polígono do país |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Seed:** Brasil (id=1)

---

### `maps.states`
27 estados brasileiros + Distrito Federal.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `country_id` | bigint | NOT NULL | FK → `countries.id` |
| `name` | varchar | NOT NULL | Nome completo (ex: `São Paulo`) |
| `uf` | char(2) | NOT NULL | Sigla do estado (ex: `SP`) — **unique** |
| `geometry` | json | NULL | GeoJSON do polígono do estado — preenchido via `tse:import-state-geometry {uf}` |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Índices:** `uf` unique
**Relacionamentos:**
- `belongsTo` → `countries`
- `hasMany` → `cities`

**Seed:** 27 estados (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)

---

### `maps.cities`
Municípios brasileiros.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `state_id` | bigint | NOT NULL | FK → `states.id` |
| `name` | varchar | NOT NULL | Nome do município |
| `ibge_code` | varchar | NULL | Código IBGE ⚠️ atualmente NULL em todos os registros — match feito por nome |
| `tse_code` | varchar | NULL | Código TSE do município |
| `geometry` | json | NULL | GeoJSON do polígono do município |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Relacionamentos:**
- `belongsTo` → `states`
- `hasMany` → `zones`
- `hasMany` → `candidacies`

> ⚠️ `ibge_code` é NULL em todas as cidades importadas. O match entre GeoJSON e banco é feito por nome (exact → normalized → prefix → Levenshtein ≤ 2).

---

### `maps.zones`
Zonas eleitorais. Cada cidade tem uma ou mais zonas.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `city_id` | bigint | NOT NULL | FK → `cities.id` |
| `zone_number` | varchar | NOT NULL | Número da zona eleitoral (ex: `001`) |
| `geometry` | json | NULL | GeoJSON da zona |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Relacionamentos:**
- `belongsTo` → `cities`
- `hasMany` → `voting_locations`

---

### `maps.voting_locations`
Locais de votação (escolas, ginásios, etc).

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `zone_id` | bigint | NOT NULL | FK → `zones.id` |
| `tse_number` | integer | NOT NULL | Número do local de votação conforme TSE |
| `name` | varchar | NOT NULL | Nome do local (ex: `EE PROF JOAO DA SILVA`) |
| `address` | varchar | NOT NULL | Endereço completo |
| `latitude` | decimal(10,7) | NULL | Latitude geográfica |
| `longitude` | decimal(10,7) | NULL | Longitude geográfica |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Relacionamentos:**
- `belongsTo` → `zones`
- `hasMany` → `sections`

---

### `maps.sections`
Seções eleitorais dentro de um local de votação.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `voting_location_id` | bigint | NOT NULL | FK → `voting_locations.id` |
| `section_number` | integer | NOT NULL | Número da seção |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Relacionamentos:**
- `belongsTo` → `voting_locations`
- `hasMany` → `votes`

---

### `maps.genders`
Gêneros dos candidatos. Lookup table.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do gênero |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Seeds:** Masculino (1), Feminino (2), Não informado (3)

---

### `maps.candidates`
Pessoas físicas que são candidatos. Separado de `candidacies` para evitar duplicação quando a mesma pessoa concorre em múltiplas eleições.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `gender_id` | bigint | NULL | FK → `genders.id` |
| `name` | varchar | NOT NULL | Nome completo do candidato |
| `cpf` | varchar | NULL | CPF (sem formatação) |
| `photo_url` | varchar | NULL | URL da foto oficial TSE |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Relacionamentos:**
- `belongsTo` → `genders`
- `hasMany` → `candidacies`

---

### `maps.parties`
Partidos políticos brasileiros. 30 partidos com paleta de cores para exibição visual.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome completo do partido |
| `abbreviation` | varchar | NOT NULL | Sigla (ex: `PL`, `PT`, `UNIÃO`) |
| `color_bg` | varchar | NOT NULL | Cor de fundo em CSS (hex ou gradient) |
| `color_text` | varchar | NOT NULL | Cor do texto em CSS |
| `color_gradient` | varchar | NULL | CSS gradient para partidos bicolores (ex: UNIÃO, MDB) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

> Partidos bicolores usam `linear-gradient(180deg, cor1 50%, cor2 50%)` no campo `color_gradient`.

---

### `maps.candidacies`
Candidaturas: vínculo entre candidato, partido, eleição e cargo. Uma por candidato por eleição.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `candidate_id` | bigint | NOT NULL | FK → `candidates.id` |
| `party_id` | bigint | NULL | FK → `parties.id` |
| `country_id` | bigint | NOT NULL | FK → `countries.id` |
| `state_id` | bigint | NOT NULL | FK → `states.id` |
| `city_id` | bigint | NULL | FK → `cities.id` — NULL para cargos estaduais/federais |
| `year` | integer | NOT NULL | Ano da eleição (2024, 2022, etc.) |
| `role` | varchar | NOT NULL | Cargo (ex: `PREFEITO`, `DEPUTADO ESTADUAL`) |
| `ballot_name` | varchar | NOT NULL | Nome de urna do candidato |
| `number` | integer | NULL | Número de urna |
| `status` | varchar | NULL | Resultado da eleição (ELEITO, NÃO ELEITO, SUPLENTE, etc.) |
| `sq_candidato` | varchar | NULL | Sequencial único TSE — identificador oficial |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Relacionamentos:**
- `belongsTo` → `candidates`
- `belongsTo` → `parties`
- `belongsTo` → `countries`
- `belongsTo` → `states`
- `belongsTo` → `cities` (nullable)
- `hasMany` → `votes`
- `hasMany` → `people_candidacies` (via gabinete_master)

---

### `maps.votes`
Votos por seção eleitoral. **Tabela particionada por `year` (PARTITION BY RANGE).**

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigserial | NOT NULL | PK parcial (composta com year) |
| `candidacy_id` | bigint | NULL | FK → `candidacies.id` — NULL para votos em branco/nulos |
| `country_id` | integer | NOT NULL | FK → `countries.id` |
| `state_id` | integer | NOT NULL | FK → `states.id` |
| `city_id` | integer | NOT NULL | FK → `cities.id` |
| `zone_id` | integer | NOT NULL | FK → `zones.id` |
| `section_id` | integer | NOT NULL | FK → `sections.id` |
| `voting_location_id` | bigint | NULL | FK → `voting_locations.id` |
| `year` | integer | NOT NULL | Ano da eleição — **chave de particionamento** |
| `round` | integer | NOT NULL | Turno (1 ou 2) |
| `qty_votes` | integer | NOT NULL | Quantidade de votos (default: 0) |
| `vote_type` | varchar(16) | NOT NULL | Tipo: `candidate`, `blank`, `null` (default: `candidate`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Partições:**
| Partição | Range |
|---|---|
| `maps.votes_2022` | year = 2022 |
| `maps.votes_2024` | year = 2024 |
| `maps.votes_default` | todos os demais anos |

**PK composta:** `(id, year)` — exigência do PostgreSQL para tabelas particionadas.

> Atualmente importados: SP/2022 (18.761.482 linhas) e SP/2024 (9.611.090 linhas). Total: 28.372.572 linhas.

---

### `maps.tse_votacao_secao_{ano}`
Tabelas de staging com os dados brutos do TSE importados diretamente do CSV. Existem 9 tabelas (2008–2024), todas com a mesma estrutura. Usadas pelo pipeline de importação para popular as tabelas normalizadas.

**Tabelas:** `tse_votacao_secao_2024`, `tse_votacao_secao_2022`, `tse_votacao_secao_2020`, `tse_votacao_secao_2018`, `tse_votacao_secao_2016`, `tse_votacao_secao_2014`, `tse_votacao_secao_2012`, `tse_votacao_secao_2010`, `tse_votacao_secao_2008`

Todas as colunas são `text nullable`, refletindo o CSV bruto do TSE:

| Coluna | Descrição |
|---|---|
| `dt_geracao` | Data de geração do arquivo |
| `hh_geracao` | Hora de geração |
| `ano_eleicao` | Ano da eleição |
| `cd_tipo_eleicao` | Código do tipo de eleição |
| `nm_tipo_eleicao` | Nome do tipo de eleição |
| `nr_turno` | Número do turno |
| `cd_eleicao` | Código da eleição |
| `ds_eleicao` | Descrição da eleição |
| `dt_eleicao` | Data da eleição |
| `tp_abrangencia` | Abrangência (Municipal, Estadual, etc.) |
| `sg_uf` | Sigla do estado |
| `sg_ue` | Código da unidade eleitoral |
| `nm_ue` | Nome da unidade eleitoral |
| `cd_municipio` | Código TSE do município |
| `nm_municipio` | Nome do município |
| `nr_zona` | Número da zona eleitoral |
| `nr_secao` | Número da seção |
| `cd_cargo` | Código do cargo |
| `ds_cargo` | Descrição do cargo |
| `nr_votavel` | Número do votável (candidato, branco=95, nulo=96) |
| `nm_votavel` | Nome do votável |
| `qt_votos` | Quantidade de votos |
| `nr_local_votacao` | Número do local de votação |
| `sq_candidato` | Sequencial único TSE do candidato |
| `nm_local_votacao` | Nome do local de votação |
| `ds_local_votacao_endereco` | Endereço do local de votação |

> Sem PK. Sem índices. Usadas apenas como buffer de importação — após processamento os dados vão para `maps.votes`.

---

## Diagrama de Relacionamentos

```
gabinete_master
├── tenants
├── type_people ──────────────────────┐
├── people ←─── type_people_id ───────┘
│   ←─── tenant_id (tenants)
│   ├── users ←─── people_id
│   ├── permissions ←─── people_id ──── permission_actions
│   ├── attendances ←─── people_id
│   │   └── attendance_history ←─── attendance_id
│   └── people_candidacies ←─── people_id
│       ├── → maps.candidacies
│       └── split_candidacies ←─── people_candidacy_id
│           └── → maps.candidacies
└── personal_access_tokens ←─── tokenable_id (users)

maps
├── countries
│   └── states ←─── country_id
│       └── cities ←─── state_id
│           └── zones ←─── city_id
│               └── voting_locations ←─── zone_id
│                   └── sections ←─── voting_location_id
│                       └── votes ←─── section_id
├── genders
│   └── candidates ←─── gender_id
│       └── candidacies ←─── candidate_id
│           ├── → parties
│           ├── → countries
│           ├── → states
│           ├── → cities (nullable)
│           └── votes ←─── candidacy_id
├── parties
└── tse_votacao_secao_{ano}  (staging bruto, sem FK)
```
