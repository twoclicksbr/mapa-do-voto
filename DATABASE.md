# DATABASE.md — Mapa do Voto
<!-- https://github.com/twoclicksbr/mapa-do-voto/blob/main/DATABASE.md -->
> Documentação completa do banco de dados PostgreSQL 17.
> Banco: `cm_politico` | Usuário: `mapadovoto`
> Atualizado em: 29/03/2026 (fin_wallets redesign ledger; event_types/events all_day+recurrence; seeds bancários ampliados)

---

## ⚠️ Comandos Proibidos

Os comandos abaixo afetam o banco **inteiro** e são **PROIBIDOS** — nunca executar sem autorização explícita:

| Comando | Efeito |
|---|---|
| `php artisan migrate:refresh` | `down()` em todas as migrations + `up()` em todas (recria tudo) |
| `php artisan migrate:reset` | `down()` em todas as migrations (apaga tudo, sem recriar) |
| `php artisan migrate:fresh` | DROP em todas as tabelas + `up()` em todas |
| `php artisan db:wipe` | DROP em todas as tabelas, views e types |

A senha é `Alex1985@`. Solicitar a senha em **qualquer** uma das situações abaixo:
- O usuário pedir para **executar** um desses comandos
- O usuário pedir para **gerar** um desses comandos (ex: "me manda o comando")
- O Claude achar que deve rodar um desses comandos por conta própria

Para rodar uma migration isolada, usar sempre:
```bash
php artisan migrate --path=database/migrations/{arquivo}.php
```

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
| `tenant_id` | bigint | NULL | FK → `tenants.id` — reseller pai (para modelo agência/cliente) |
| `name` | varchar | NOT NULL | Nome do gabinete (ex: "Mapa do Voto") |
| `slug` | varchar | NOT NULL | Subdomínio de acesso (ex: `netobota`) — **unique** |
| `schema` | varchar | NOT NULL | Nome do schema PostgreSQL do tenant (ex: `gabinete_netobota`) — **unique** |
| `has_schema` | boolean | NOT NULL | Se o schema PostgreSQL foi/deve ser criado (default: `false`) |
| `active` | boolean | NOT NULL | Se o tenant está ativo (default: `true`) |
| `valid_until` | date | NOT NULL | Data de validade do contrato |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índices:** `slug` unique, `schema` unique
**Seed:** `{ name: 'Mapa do Voto', slug: 'master', schema: 'gabinete_master', has_schema: false, valid_until: '2026-06-24' }`

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
| `birth_date` | date | NULL | Data de nascimento |
| `photo_path` | varchar | NULL | Caminho relativo no storage (ex: `netobota/avatar/1`) — 3 arquivos: `original.jpg`, `md.jpg`, `sm.jpg` |
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
| `module` | varchar | NOT NULL | Chave do módulo (ex: `people`, `attendances`, `map`, `restrictions`) |
| `name_module` | varchar | NULL | Nome legível do módulo em PT-BR (ex: `Pessoas`, `Atendimentos`) — adicionado em `000064` |
| `action` | varchar | NOT NULL | Chave da ação (ex: `view`, `create`, `update`, `delete`) |
| `name_action` | varchar | NULL | Nome legível da ação em PT-BR (ex: `Visualizar`, `Criar`) — adicionado em `000064` |
| `description` | varchar | NULL | Descrição opcional |
| `order` | integer | NULL | Ordem de exibição (default: 0) — adicionado em `000063`; populado via ROW_NUMBER() |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seeds (13 registros):**

| module | name_module | action | name_action |
|---|---|---|---|
| people | Pessoas | view | Visualizar |
| people | Pessoas | create | Criar |
| people | Pessoas | update | Editar |
| people | Pessoas | delete | Excluir |
| attendances | Atendimentos | view | Visualizar |
| attendances | Atendimentos | create | Criar |
| attendances | Atendimentos | update | Editar |
| attendances | Atendimentos | delete | Excluir |
| map | Mapa | view | Visualizar |
| restrictions | Restrições | view | Visualizar |
| restrictions | Restrições | create | Criar |
| restrictions | Restrições | update | Editar |
| restrictions | Restrições | delete | Excluir |

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
| `candidacy_id` | bigint | NOT NULL | Referência a `maps.candidacies.id` — sem FK (cross-schema; integridade via aplicação) |
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
| `candidacy_id` | bigint | NOT NULL | Referência a `maps.candidacies.id` — sem FK (cross-schema; integridade via aplicação) — candidato do lado direito do split |
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

### `gabinete_master.type_contacts`
Tipos de contato configuráveis (Celular, E-mail, WhatsApp, etc).

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do tipo |
| `mask` | varchar | NULL | Máscara de formatação (ex: `(99) 99999-9999`) |
| `order` | integer | NOT NULL | Ordem de exibição |
| `active` | boolean | NOT NULL | default: `true` |
| `deleted_at` | timestamp | NULL | Soft delete |

---

### `gabinete_master.type_addresses`
Tipos de endereço configuráveis (Residencial, Comercial, etc).

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do tipo |
| `order` | integer | NOT NULL | Ordem de exibição |
| `active` | boolean | NOT NULL | default: `true` |
| `deleted_at` | timestamp | NULL | Soft delete |

---

### `gabinete_master.type_documents`
Tipos de documento configuráveis (CPF, RG, CNH, etc).

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do tipo |
| `mask` | varchar | NULL | Máscara de formatação (ex: `999.999.999-99`) |
| `validity` | boolean | NOT NULL | Se este tipo de documento exige data de validade (default: `false`) |
| `order` | integer | NOT NULL | Ordem de exibição |
| `active` | boolean | NOT NULL | default: `true` |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seeds:** CPF(false), RG(false), CNH(false), Passaporte(true), Título de Eleitor(false)

---

### `gabinete_master.contacts`
Contatos polimórficos — associados a qualquer módulo via `modulo` + `record_id`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `modulo` | varchar | NOT NULL | Módulo dono (ex: `people`) |
| `record_id` | bigint | NOT NULL | ID do registro no módulo |
| `type_contact_id` | bigint | NOT NULL | FK → `type_contacts.id` |
| `value` | varchar | NOT NULL | Valor do contato |
| `order` | integer | NOT NULL | default: `0` |
| `active` | boolean | NOT NULL | default: `true` |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índice:** `(modulo, record_id)`

---

### `gabinete_master.addresses`
Endereços polimórficos com campos ViaCEP + coordenadas geográficas.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `modulo` | varchar | NOT NULL | Módulo dono (ex: `people`) |
| `record_id` | bigint | NOT NULL | ID do registro no módulo |
| `type_address_id` | bigint | NOT NULL | FK → `type_addresses.id` |
| `cep` | varchar(9) | NULL | CEP formatado (ex: `12302-300`) |
| `logradouro` | varchar | NULL | Rua/Av/etc |
| `numero` | varchar(20) | NULL | Número do imóvel |
| `complemento` | varchar | NULL | Complemento (Apto, Sala, etc) |
| `bairro` | varchar | NULL | Bairro |
| `cidade` | varchar | NULL | Cidade |
| `uf` | char(2) | NULL | Estado (sigla) |
| `ibge` | varchar(7) | NULL | Código IBGE do município |
| `lat` | decimal(10,7) | NULL | Latitude — preenchida via Nominatim/OpenStreetMap |
| `lng` | decimal(10,7) | NULL | Longitude — preenchida via Nominatim/OpenStreetMap |
| `order` | integer | NOT NULL | default: `0` |
| `active` | boolean | NOT NULL | default: `true` |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índice:** `(modulo, record_id)`
**Geocoding:** coordenadas obtidas via `https://nominatim.openstreetmap.org/search` após preenchimento do CEP (ViaCEP)

---

### `gabinete_master.documents`
Documentos polimórficos (CPF, RG, CNH, Título de Eleitor, etc).

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `modulo` | varchar | NOT NULL | Módulo dono (ex: `people`) |
| `record_id` | bigint | NOT NULL | ID do registro no módulo |
| `type_document_id` | bigint | NOT NULL | FK → `type_documents.id` |
| `value` | varchar | NOT NULL | Número do documento |
| `validity` | date | NULL | Data de validade |
| `order` | integer | NOT NULL | default: `0` |
| `active` | boolean | NOT NULL | default: `true` |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índice:** `(modulo, record_id)`

---

### `gabinete_master.notes`
Notas polimórficas de texto livre.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `modulo` | varchar | NOT NULL | Módulo dono (ex: `people`) |
| `record_id` | bigint | NOT NULL | ID do registro no módulo |
| `value` | text | NOT NULL | Conteúdo da nota |
| `order` | integer | NOT NULL | default: `0` |
| `active` | boolean | NOT NULL | default: `true` |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índice:** `(modulo, record_id)`

---

### `gabinete_master.files`
Arquivos polimórficos. Armazena arquivos uploadados vinculados a qualquer módulo.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `modulo` | varchar | NOT NULL | Módulo dono (ex: `people`) |
| `record_id` | bigint | NOT NULL | ID do registro no módulo |
| `name` | varchar | NOT NULL | Nome original do arquivo |
| `path` | varchar | NOT NULL | Caminho no storage |
| `mime_type` | varchar | NULL | Tipo MIME (ex: `application/pdf`) |
| `size` | bigint | NULL | Tamanho em bytes |
| `order` | integer | NOT NULL | default: `0` |
| `active` | boolean | NOT NULL | default: `true` |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índice:** `(modulo, record_id)`
**Model:** `PersonFile` — `$table = 'gabinete_master.files'`

---

### `gabinete_master.fin_banks`
Bancos e contas bancárias do gabinete. Migração `000061` — aplica em todos os schemas tenant.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome exibido (ex: "Caixa", "Nubank") |
| `bank` | varchar | NULL | Nome da instituição bancária |
| `agency` | varchar | NULL | Agência |
| `account` | varchar | NULL | Conta |
| `main` | boolean | NOT NULL | Se é o banco principal (default: `false`) |
| `order` | integer | NOT NULL | Ordem de exibição (default: `1`) |
| `active` | boolean | NOT NULL | default: `true` |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seeds (por schema):** Tesouraria (main=true, bank=null, order 1), Nubank PJ (main=false, bank='260 - Nubank', order 2)

---

### `gabinete_master.fin_payment_method_types`
Tipos de modalidade de pagamento. Migração `000062`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do tipo |
| `order` | integer | NOT NULL | Ordem de exibição (default: `1`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Seeds (por schema):** Carteira (order 1), Dinheiro (2), Pix (3), Cartão de Débito (4), Cartão de Crédito (5), Boleto (6), Transferência (7)

⚠️ O tipo **Carteira** tem papel especial: quando uma modalidade de pagamento é desse tipo (`LOWER(name)='carteira'`), baixar um título debita/credita automaticamente a `fin_wallets` da pessoa.

---

### `gabinete_master.fin_payment_methods`
Modalidades de pagamento vinculadas a banco e tipo. Migração `000063`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome da modalidade |
| `fin_bank_id` | bigint | NULL | Referência a `fin_banks.id` (sem FK constraint) |
| `fin_payment_method_type_id` | bigint | NULL | Referência a `fin_payment_method_types.id` |
| `order` | integer | NOT NULL | Ordem de exibição (default: `1`) |
| `active` | boolean | NOT NULL | default: `true` |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seeds (por schema):** Carteira (Tesouraria, tipo Carteira), Dinheiro (Tesouraria, tipo Dinheiro), Pix (Nubank PJ, tipo Pix), Cartão de Débito (Nubank PJ), Cartão de Crédito (Nubank PJ), Boleto (Nubank PJ), Transferência (Nubank PJ)

**Relacionamentos:**
- `belongsTo` → `fin_banks` via `fin_bank_id`
- `belongsTo` → `fin_payment_method_types` via `fin_payment_method_type_id`

---

### `gabinete_master.departments`
Departamentos para rateio de centro de custo. Migração `000064`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do departamento |
| `order` | integer | NOT NULL | Ordem de exibição (default: `1`) |
| `active` | boolean | NOT NULL | default: `true` |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

---

### `gabinete_master.fin_accounts`
Plano de contas hierárquico. Cada conta pode ter um `parent_id` formando uma árvore N níveis. Migração `000065` — seed completo.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `parent_id` | bigint | NULL | FK auto-referencial → `fin_accounts.id` |
| `code` | varchar | NULL | Código contábil (ex: `1.1.01`) |
| `name` | varchar | NOT NULL | Nome da conta |
| `type` | varchar | NOT NULL | Tipo: `asset` (Ativo), `liability` (Passivo/PL), `revenue` (Receita), `expense` (Despesa), `cost` (Custo) |
| `order` | integer | NOT NULL | Ordem entre irmãos (default: `1`) |
| `active` | boolean | NOT NULL | default: `true` |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seed (por schema):** árvore completa com 4 grupos raiz: Ativo, Passivo, Custos e Despesas, Receitas — com sub-grupos e contas analíticas

---

### `gabinete_master.fin_titles`
Títulos financeiros a pagar e a receber. Migrações `000066`, `000070` (+reversed_at), `000071` (+cancelled_at).

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `type` | varchar | NOT NULL | `income` (receita) ou `expense` (despesa) |
| `description` | varchar | NOT NULL | Descrição/histórico |
| `amount` | decimal(15,2) | NOT NULL | Valor original |
| `discount` | decimal(15,2) | NULL | Desconto |
| `interest` | decimal(15,2) | NULL | Juros/multa |
| `due_date` | date | NOT NULL | Vencimento |
| `paid_at` | date | NULL | Data de pagamento/recebimento |
| `reversed_at` | date | NULL | Data de estorno (preenchida automaticamente pelo `reverse()`) |
| `cancelled_at` | date | NULL | Data de cancelamento (preenchida automaticamente ao setar `status = 'cancelled'`) |
| `amount_paid` | decimal(15,2) | NULL | Valor efetivamente pago |
| `installment_number` | integer | NULL | Nº da parcela (ex: 1) |
| `installment_total` | integer | NULL | Total de parcelas (ex: 12) |
| `account_id` | bigint | NULL | Referência a `fin_accounts.id` |
| `payment_method_id` | bigint | NULL | Referência a `fin_payment_methods.id` |
| `bank_id` | bigint | NULL | Referência a `fin_banks.id` |
| `people_id` | bigint | NOT NULL | Referência a `people.id` (cross-schema, sem FK constraint) |
| `document_number` | varchar | NULL | Nº do documento |
| `invoice_number` | varchar | NULL | Nº da nota fiscal |
| `barcode` | varchar | NULL | Código de barras do boleto |
| `pix_key` | varchar | NULL | Chave PIX |
| `status` | varchar | NOT NULL | `pending`, `paid`, `partial`, `cancelled`, `reversed` (default: `pending`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Relacionamentos:**
- `belongsTo` → `fin_accounts` via `account_id`
- `belongsTo` → `fin_payment_methods` via `payment_method_id`
- `belongsTo` → `fin_banks` via `bank_id`
- `belongsTo` → `people` via `people_id`
- `hasMany` → `fin_cost_centers`
- `hasMany` → `fin_title_compositions` (origin e destination)

---

### `gabinete_master.fin_extract`
Extrato financeiro — lançamentos gerados por baixas, estornos ou manualmente. Migração `000067` (criação — inclui `title_id` nullable e `source` default `'manual'`).

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `title_id` | bigint | NULL | Referência a `fin_titles.id` (nullable para lançamentos manuais sem título) |
| `account_id` | bigint | NULL | Referência a `fin_accounts.id` |
| `type` | varchar | NOT NULL | `in` (entrada) ou `out` (saída) |
| `amount` | decimal(15,2) | NOT NULL | Valor do lançamento |
| `date` | date | NOT NULL | Data do lançamento |
| `payment_method_id` | bigint | NULL | Referência a `fin_payment_methods.id` |
| `bank_id` | bigint | NULL | Referência a `fin_banks.id` |
| `source` | varchar | NOT NULL | Origem: `manual` (lançamento avulso), `baixa` (gerado pelo `pay()`), `estorno` (gerado pelo `reverse()`) — default: `manual` |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

---

### `gabinete_master.fin_wallets`
Carteira financeira — **ledger de lançamentos** por pessoa (entradas e saídas). Saldo calculado em tempo real: `SUM(amount WHERE type='in') - SUM(amount WHERE type='out')`. Migração `000068`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `people_id` | bigint | NOT NULL | Referência a `people.id` (cross-schema, sem FK) |
| `type` | varchar | NOT NULL | Direção do lançamento: `in` (entrada) ou `out` (saída) |
| `amount` | decimal(15,2) | NOT NULL | Valor do lançamento |
| `date` | date | NOT NULL | Data do lançamento |
| `description` | varchar | NULL | Descrição opcional |
| `title_id` | bigint | NULL | Título financeiro gerador (quando source ≠ manual) |
| `source` | varchar | NOT NULL | Origem: `manual` \| `baixa` \| `estorno` (default: `manual`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Relacionamentos:**
- `belongsTo` → `people` via `people_id`

**Regras de negócio:**
- Baixa com modalidade Carteira (tipo LOWER='carteira'): gera `out` na carteira da pessoa
- Excedente em baixa (`excess_action=wallet`): gera `in` ou `out` conforme tipo do título
- Estorno: reverte todos os lançamentos `source='baixa'` do título
- Lançamento manual: requer saldo suficiente para `type='out'`

---

### `gabinete_master.fin_cost_centers`
Rateio de centro de custo por título — distribui o valor entre departamentos. Migração `000069`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `title_id` | bigint | NOT NULL | Referência a `fin_titles.id` |
| `department_id` | bigint | NOT NULL | Referência a `departments.id` |
| `percentage` | decimal(5,2) | NOT NULL | Percentual do rateio (0.00 – 100.00) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Relacionamentos:**
- `belongsTo` → `departments`

---

### `gabinete_master.fin_title_compositions`
Rastreia composição entre títulos — gerada em clones e baixas parciais. Migração `000070`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `origin_title_id` | bigint | NOT NULL | Título de origem |
| `destination_title_id` | bigint | NOT NULL | Título gerado (clone ou saldo restante) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

---

### `gabinete_master.fin_bank_balances`
Saldos pontuais registrados por banco — usado para calcular saldo atual de cada banco. Migração `000072`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `fin_bank_id` | bigint | NOT NULL | FK → `fin_banks.id` |
| `data` | date | NOT NULL | Data de referência do saldo |
| `valor` | decimal(15,2) | NOT NULL | Valor do saldo na data |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |

**Cálculo de saldo atual:** último saldo (`MAX(data)` por `fin_bank_id`) + soma líquida do `fin_extract` após essa data.

---

### `gabinete_master.event_types`
Tipos de evento da agenda. Migração `000073`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `name` | varchar | NOT NULL | Nome do tipo (ex: Aniversário) |
| `color` | varchar | NOT NULL | Cor hex (ex: #3fb6ea) |
| `all_day` | boolean | NOT NULL | Evento de dia inteiro por padrão (default: `false`) |
| `order` | integer | NOT NULL | Ordem de exibição (default: `1`) — auto max+1; reordena se duplicado |
| `active` | boolean | NOT NULL | Ativo (default: `true`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seeds (5 registros):**

| name | color | all_day | order |
|---|---|---|---|
| Aniversário | #3fb6ea | true | 1 |
| Financeiro Pagar | #ec637f | true | 2 |
| Financeiro Receber | #4fb589 | true | 3 |
| Compromisso | #fbb810 | false | 4 |
| Atendimento | #b665ec | false | 5 |

---

### `gabinete_master.events`
Eventos da agenda. Migração `000074`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `people_id` | bigint | **NULL** | Pessoa responsável (sem FK — cross-schema; nullable) |
| `event_type_id` | bigint | NOT NULL | FK → `event_types.id` |
| `modulo` | varchar | NULL | Módulo vinculado (ex: `people`, `fin_titles`) — quando `modulo='people'` indica evento gerado automaticamente (aniversário) |
| `name` | varchar | NOT NULL | Título do evento |
| `description` | text | NULL | Descrição longa |
| `start_at` | timestamp | NOT NULL | Início do evento |
| `end_at` | timestamp | NULL | Fim do evento |
| `all_day` | boolean | NOT NULL | Evento de dia inteiro (default: `false`) |
| `recurrence` | varchar | NOT NULL | Recorrência: `none` \| `daily` \| `weekly` \| `monthly` \| `yearly` (default: `none`) |
| `gcal_event_id` | varchar | NULL | ID do evento no Google Calendar |
| `active` | boolean | NOT NULL | Ativo (default: `true`) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Seed:** Evento de aniversário de Alex Alves de Almeida (event_type_id:1, modulo:'people', all_day:true, recurrence:'yearly', start_at:'2026-05-09').

**Expansão de recorrência:** `EventController::index()` expande eventos recorrentes server-side para o período solicitado (`start_from`/`start_to`). Cada ocorrência retorna `_fc_id: "{id}_{index}"` para identificação única no FullCalendar.

---

### `gabinete_master.event_people`
Pivot entre eventos e pessoas convidadas. Migração `000075`.

| Coluna | Tipo | Nullable | Descrição |
|---|---|---|---|
| `id` | bigint | NOT NULL | PK autoincrement |
| `event_id` | bigint | NOT NULL | FK → `events.id` (cascade delete) |
| `people_id` | bigint | NOT NULL | Pessoa convidada (sem FK — cross-schema) |
| `active` | boolean | NOT NULL | Ativo (default true) |
| `created_at` | timestamp | NULL | — |
| `updated_at` | timestamp | NULL | — |
| `deleted_at` | timestamp | NULL | Soft delete |

**Índice único:** `(event_id, people_id)`.

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

**Índices (incorporados na migration 000112):**
| Nome | Colunas | Uso |
|---|---|---|
| `idx_votes_candidacy_year_round` | `(candidacy_id, year, round)` | Stats do candidato por turno |
| `idx_votes_state_year_round_type` | `(state_id, year, round, vote_type)` | Totais do escopo estadual |
| `idx_votes_city_year_round_type` | `(city_id, year, round, vote_type)` | Totais do escopo municipal + endpoint cities() |

> ⚠️ **Atenção de arquitetura:** a migration `000112` usa `DB::statement()` (conexão default `pgsql` → `cm_politico`). Em **produção**, a tabela foi criada manualmente em `cm_maps` via SQL direto (não pela migration). Os índices estão incorporados na `000112` (antes estavam em `000122`, que foi removida). Em dev local a migration cria a tabela em `cm_politico`. Não rodar a migration 000112 via artisan em produção.

> **Dados importados em produção (servidor `168.231.64.36`, banco `cm_maps`):**
> - SP/2022: 18.761.482 linhas (importado via `\copy` BINARY)
> - SP/2024: 9.611.090 linhas (importado via `\copy` BINARY)
> - Total: 28.372.572 linhas
> - Após import: rodar `ANALYZE maps.votes;` para atualizar estatísticas do planner

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
│   photo_path → storage/{slug}/avatar/{id}/{original|md|sm}.jpg
│   ├── users ←─── people_id
│   ├── permissions ←─── people_id ──── permission_actions
│   ├── files ←─── (modulo=people, record_id)
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
