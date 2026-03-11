# CLAUDE.md — ClickMaps
<!-- Atualizado em: 11/03/2026 -->

> Plataforma de mapas geoespaciais para inteligência eleitoral. Permite visualizar dados de votação, atendimentos e estratégias de campanha em mapa interativo.

---

## Regras do Claude Code

- NÃO fazer git add/commit/push sem ser solicitado
- Implementar SOMENTE o que for pedido na tarefa
- Ao final de cada tarefa, gerar um resumo compacto em um único bloco de código para copiar com um clique

## Regras do Chat (claude.ai)

- Não usar caixas de perguntas (widgets de seleção). Sempre perguntar em texto direto.
- Ao enviar prompts para o Claude Code, sempre envolver o prompt inteiro em um único bloco de código para que o usuário copie com um clique. Texto explicativo fica fora do bloco.
- Não se antecipar — aguardar direção explícita antes de sugerir ou implementar algo.

---

## Repositório

- **GitHub:** https://github.com/twoclicksbr/clickmaps.git

---

## Decisão Arquitetural

ClickMaps é um produto **independente** da TwoClicks:
- Clientes são políticos — perfil diferente do SaaS genérico
- Backend simples — candidatos, partidos, dados TSE, autenticação
- Um banco PostgreSQL direto, sem multi-tenant
- Marca própria ("ClickMaps" é nome provisório — será renomeado no futuro)

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

#### SP 2024 — votacao_secao_2024_SP.csv
- Tabelas populadas: `tse_votacao_secao`, `cities`, `candidates` (via ON CONFLICT DO NOTHING)
- Total de linhas: 9.611.090
- Tempo de importação: ~35 min
- Comando: `php artisan tse:import-votacao {file} {--uf=SP} {--ano=2024}`
- Arquivo: `api/app/Console/Commands/TseImportVotacao.php`
- Encoding: Latin-1 → UTF-8 via mb_convert_encoding
- Chunk: 3.000 linhas por INSERT bulk
- Campo `role` dos candidates populado via coluna `DS_CARGO` do CSV
- Índice principal: `(sg_uf, ano_eleicao, sq_candidato)`

#### Console Commands TSE

| Comando | Arquivo | Descrição |
|---------|---------|-----------|
| `tse:import-votacao` | `TseImportVotacao.php` | Importa CSV de votação por seção |
| `tse:import-fotos` | `TseImportFotos.php` | Importa fotos dos candidatos TSE |
| `tse:import-raw` | `TseImportRaw.php` | Importa dados brutos TSE |

### Cliente piloto — Neto Bota (Caraguatatuba/SP)

- Nome completo: José Mendes de Souza Neto Bota
- Partido: PL | Cargo 2026: Deputado Estadual
- Histórico: Vereador 2008 ✅ | Vereador 2012 ✅ | Dep. Estadual 2022 ❌ suplente | Prefeito 2024 ❌ 2º lugar

#### Dados confirmados no banco (tse_votacao_secao)
- sq_candidato: `250002019567`
- cd_municipio: `63118` (código TSE de Caraguatatuba)
- city_ibge_code: `3510104`
- Eleição: Prefeito 2024, turno 1
- Total votos: 20.313 em 373 seções

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
C:\Herd\clickmaps\
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

### Terminologia do projeto

- **background-maps** = o `div` wrapper do `<ClickMapsMap />` em `src/pages/home/page.tsx`

### Arquivos chave

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/home/page.tsx` | Página principal com mapa + estado `isSplit` |
| `src/components/map/clickmaps-map.tsx` | Mapa Leaflet + card candidato + botões flutuantes |
| `src/components/map/candidate-search.tsx` | Autocomplete de busca de candidato (split direito) |
| `src/components/auth/login-modal.tsx` | Modal de login automático |
| `src/components/auth/login-modal-context.tsx` | Contexto global do modal |
| `src/lib/leaflet-icon-fix.ts` | Fix ícone Leaflet no Vite |
| `src/lib/party-colors.ts` | Cores oficiais dos 30 partidos |
| `src/routing/app-routing-setup.tsx` | Rotas |
| `src/components/layouts/layout-33/components/sidebar-header.tsx` | Logo ClickMaps |

### Logo ClickMaps

Ícone `MapPin` vermelho (#E63946) + "Click"(normal) + "Maps"(bold), text-2xl

### Modal de Login

- Abre automaticamente ao carregar
- Campos vazios (sem preenchimento automático: `autoComplete="off"`)
- Ao entrar: POST `/auth/login` → salva token no `localStorage` → fecha modal + dispara flyTo para São Paulo
- Ao sair: POST `/auth/logout` → remove token → reabre modal
- `LoginModalContext` expõe: `open`, `setOpen`, `loggedIn`, `setLoggedIn`, `user`, `logout`

---

## Backend (api\)

### Ambiente local

- **URL:** `http://clickmaps-api.test` (via Herd symlink)
- **Laravel:** 12.53.0 | **PHP:** 8.4 | **PostgreSQL:** 17.7
- **Banco:** `cm_politico` | **Usuário:** `clickmaps_politico`

### Rotas da API

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | pública | Retorna token + user + people |
| POST | `/api/auth/logout` | Bearer | Revoga token atual |
| GET | `/api/auth/me` | Bearer | Retorna usuário autenticado + people |
| GET | `/api/map/stats` | Bearer | Candidato order=1 do usuário + stats de votos (turno máximo, total_votos, total_validos, percentual) |
| GET | `/api/candidates` | Bearer | Lista candidatos do usuário |
| GET | `/api/candidates/search` | pública | Autocomplete de candidatos (?q=) |
| GET | `/api/ping` | pública | Health check |

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `people` | Pessoa física (uuid, name, avatar_url, active, softDeletes) |
| `users` | Acesso (people_id FK, email, password, remember_token) |
| `parties` | 30 partidos brasileiros (uuid, name, abbreviation) |
| `candidates` | Candidatos (party_id FK, sq_candidato, cd_municipio, role, year, state, city_ibge_code, status) |
| `cities` | Cidades (ibge_code int unique nullable, tse_code int unique, name, sg_uf char2, timestamps) |
| `user_candidates` | Vínculo user ↔ candidate (order, active) |
| `personal_access_tokens` | Tokens Sanctum |
| `cache` / `jobs` | Infraestrutura Laravel |
| `people_permissions` | Permissões por pessoa (people_id FK) |
| `tse_votacao_secao_raw` | Dados brutos TSE antes do processamento |
| `positions` | Cargos eleitorais |
| `tse_votacao_secao` | Resultados por seção eleitoral (9.6M linhas SP 2024) |

### Models e relacionamentos

- `People` — uuid auto-gerado, SoftDeletes, hasMany(PeoplePermission)
- `User` → `belongsTo(People)`, `HasApiTokens`
- `Party` — uuid auto-gerado, SoftDeletes
- `Candidate` → `belongsTo(Party)`, `belongsTo(Position)`, uuid auto-gerado, SoftDeletes
- `UserCandidate` → `belongsTo(User)`, `belongsTo(Candidate)`, SoftDeletes
- `Position` — uuid auto-gerado, SoftDeletes
- `PeoplePermission` → `belongsTo(People)`, SoftDeletes

### Seeders

- `DatabaseSeeder` — cria people + user (Alex / alex@clickmaps.com.br)
- `PartySeeder` — 30 partidos brasileiros
- `CandidateSeeder` — Neto Bota (PL / Prefeito / Caraguatatuba SP / 2024 / não eleito)
- `UserCandidateSeeder` — vincula Alex → Neto Bota (order=1)
- `PeoplePermissionSeeder` — permissões padrão

### Arquivos chave

| Arquivo | Descrição |
|---------|-----------|
| `api/routes/api.php` | Rotas REST |
| `api/app/Http/Controllers/Auth/AuthController.php` | Login, logout, me |
| `api/app/Http/Controllers/Map/MapStatsController.php` | GET /api/map/stats — stats de votos do candidato logado |
| `api/app/Http/Controllers/CandidateController.php` | Lista e busca de candidatos |
| `api/app/Http/Controllers/Map/CandidateSearchController.php` | Autocomplete de candidatos |
| `api/app/Models/` | People, User, Party, Candidate, UserCandidate |
| `api/database/migrations/` | 13 migrations |
| `api/database/seeders/` | 5 seeders |
| `api/config/cors.php` | CORS — `allowed_origins: ['*']` |

### Frontend → Backend

- `maps/.env` → `VITE_API_URL=http://clickmaps-api.test/api`
- `maps/src/lib/api.ts` → axios com interceptor Bearer token (localStorage)

---

## Mapa (Leaflet)

### Tile Layer

**CartoDB Positron** (gratuito, sem API key):
```
https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
```

### Comportamento ao login

1. Carrega GeoJSON do município de São Paulo (IBGE 3550308)
   - URL: `https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-35-mun.json`
2. Borda: `#1D3557`, weight: 2, fillOpacity: 0.05
3. `map.invalidateSize()` antes do flyTo
4. `map.flyTo(center, 10, { duration: 2 })` → animação suave
5. `map.once('moveend', () => map.fitBounds(bounds, { padding: [40, 40], animate: true }))`

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
```

---

## Split View

Estado `isSplit` em `src/pages/home/page.tsx`. Botão `Columns2` na Toolbar.

**Sincronização entre mapas:**
- `mapRef1` + `mapRef2` via `useRef<L.Map | null>(null)`
- Prop `syncRef` no `ClickMapsMap` — propaga `move`/`zoom` via `setView`
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

## Card do Candidato

Flutuante: `absolute top-4 left-4 z-[1000]`

- **Sem login:** Skeleton animado (avatar + duas linhas)
- **Logado:** avatar + nome + badge partido + cargo

Dados atuais (hardcoded no frontend): Neto Bota | PL | Deputado Estadual
> Candidato real no banco: Neto Bota | PL | Prefeito 2024 | Caraguatatuba SP | não eleito
> ⚠️ Pendência técnica: integrar card com dados reais da API (GET /map/stats ou /candidates)

---

## Cores dos Partidos (`src/lib/party-colors.ts`)

30 partidos com `{ bg, text, gradient? }`. Partidos com duas cores usam gradiente vertical:

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
**Domínio:** `clickmaps.com.br`