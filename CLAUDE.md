# CLAUDE.md — ClickMaps

> Plataforma de mapas geoespaciais multi-tenant. Permite clicar em qualquer ponto do mapa e controlar detalhes desse ponto.

---

## Regras do Claude Code

- NÃO fazer git add/commit/push sem ser solicitado
- Implementar SOMENTE o que for pedido na tarefa
- Ao final de cada tarefa, gerar um resumo compacto em um único bloco de código para copiar com um clique

## Regras do Chat (claude.ai)

- Não usar caixas de perguntas (widgets de seleção). Sempre perguntar em texto direto.
- Ao enviar prompts para o Claude Code, sempre envolver o prompt inteiro em um único bloco de código (``` ```) para que o usuário copie com um clique. Texto explicativo fica fora do bloco.
- Não se antecipar — aguardar direção explícita antes de sugerir ou implementar algo.

---

## Repositório

- **GitHub:** https://github.com/twoclicksbr/clickmaps.git

---

## Visão do Produto

ClickMaps é uma plataforma de mapas geoespaciais multi-tenant dentro do ecossistema TwoClicks.

### Funcionalidades planejadas

- Pontos customizados no mapa (semáforos, buracos, entregas, etc.)
- Rastreamento em tempo real via WebSocket
- Cercas geográficas (geofences) com cercas aninhadas
- Tempo dentro da cerca (timestamps entrada/saída)
- Histórico de eventos por ponto (instalação, manutenção, etc.)
- Mapa de calor (heatmap) com Leaflet.heat
- Divisão por zonas/regiões (bairros, zonas eleitorais)
- Importação de KML ou desenho manual via Leaflet.draw
- Otimização de rotas (OSRM/GraphHopper)
- Reporte de ocorrências por munícipes
- Notícias automáticas do candidato via Google News RSS/NewsAPI

---

## Módulo Eleitoral (principal caso de uso para MVP)

### Dados do TSE (gratuitos)

Fonte: https://dadosabertos.tse.jus.br

- Candidatos: nome, foto, partido, número, redes sociais, bens, certidões criminais
- Resultados por seção eleitoral desde 2008 (CSV por UF)
- Eleitorado por local de votação
- API JSON em tempo real no dia da eleição

### Fluxo

1. Usuário digita nome do candidato
2. Sistema busca no TSE, baixa CSV da UF, filtra por candidato + concorrentes
3. Salva no PostgreSQL, descarta CSV bruto
4. Mapa exibe heatmap por candidato + camadas de concorrentes

### Cliente piloto — Neto Bota (Caraguatatuba/SP)

- Nome completo: José Mendes de Souza Neto Bota
- Vereador 2008 ✅ | Vereador 2012 ✅ (mais votado Litoral Norte, 1.984 votos)
- Deputado Estadual 2022 ❌ suplente (~28.648 votos)
- Prefeito Caraguatatuba 2024 ❌ 2º lugar (20.313 votos / 28,19%)
- Eleito 2024: Mateus Silva (PSD) 26.850 votos / 37,26%

### Estratégia de importação TSE

- Não baixar tudo de uma vez (volume total ~300-500GB)
- Começar por SP 2024, expandir estado a estado via background jobs
- CSV → Laravel processa → PostgreSQL → descarta CSV
- Dados processados estimados: 20-40GB para histórico nacional

---

## Modelo de Negócio

### Precificação por eleição (não assinatura)

| Plano | Inclui | Preço |
|---|---|---|
| Básico | Mapa + histórico | R$ 1.497 |
| Pro | + apuração tempo real | R$ 2.997 |
| Premium | + relatórios + suporte | R$ 5.997 |

### Go-to-market

- Canal: marqueteiros eleitorais com carteira de candidatos
- Marqueteiro compra por R$ 2.997, revende por R$ 4.500-5.000
- 2026 = eleições estaduais/federais (ticket maior)
- Margem ~95% (dados TSE gratuitos, VPS já pago até 2027)

---

## Arquitetura

```
clickmaps.com.br (React/Metronic — frontend)
        ↓
api.twoclicks.com.br (Laravel — backend TwoClicks)

TwoClicks
└── clickmaps (plataforma)
    └── master (tenant)
        └── banco: clickmaps_master
```

**VPS:** KVM 4, 4 cores, 16GB RAM, 200GB disco, pago até 2027-04-11

---

## Stack

- **Frontend:** React 19 + Vite + TypeScript + Metronic v9.4.5 + Tailwind CSS 4
- **Mapa:** Leaflet + react-leaflet + OpenStreetMap / CartoDB
- **Backend:** TwoClicks (Laravel API existente)
- **DB:** PostgreSQL

---

## Estrutura Local

```
C:\Herd\clickmaps\
├── maps\    → Vite + React + Metronic (app do mapa)
├── site\    → Next.js (landing page — não iniciada ainda)
└── .git
```

`maps\` baseado em: `metronic-tailwind-react-starter-kit/typescript/vite` (Layout 33)

---

## Frontend (maps\)

### Variáveis de Ambiente (`maps/.env`)

```env
VITE_APP_NAME=clickmaps
VITE_API_URL=https://api.tc.test
VITE_PLATFORM_SLUG=clickmaps
```

### Layout em uso

**Layout 33** do Metronic. URL local: `http://localhost:5173`

### Terminologia do projeto

- **background-maps** = o `div` wrapper do `<ClickMapsMap />` em `src/pages/home/page.tsx`
  ```tsx
  <div className="rounded-lg overflow-hidden flex-1 min-h-0">
    <ClickMapsMap />
  </div>
  ```

### Arquivos chave

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/home/page.tsx` | Página principal com mapa |
| `src/components/map/clickmaps-map.tsx` | Componente do mapa Leaflet |
| `src/components/auth/login-modal.tsx` | Modal de login automático |
| `src/components/auth/login-modal-context.tsx` | Contexto global do modal |
| `src/lib/leaflet-icon-fix.ts` | Fix ícone Leaflet no Vite |
| `src/routing/app-routing-setup.tsx` | Rotas |
| `src/components/layouts/layout-33/components/sidebar-header.tsx` | Logo ClickMaps |
| `src/components/layouts/layout-33/components/sidebar-footer.tsx` | Footer da sidebar |

### Logo ClickMaps

Ícone `MapPin` vermelho (#E63946) + "Click"(normal) + "Maps"(bold), text-2xl

### Modal de Login

- Abre automaticamente ao carregar a página
- Logo ClickMaps centralizado
- Campos pré-preenchidos: `alex@clickmaps.com.br` / `Alex1985@`
- Botão "Entrar" fecha o modal
- Contexto global `LoginModalContext` — botões de logout reabrem o modal

---

## Mapa (Leaflet)

### Tile Layer

**CartoDB Positron** (gratuito, sem API key):
```
https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png
```
Attribution: `© OpenStreetMap contributors © CARTO`

> Stadia Maps (AlidadeSmooth): funciona em localhost sem key. Em produção requer cadastro de domínio gratuito em https://client.stadiamaps.com — sem cartão de crédito.

### Fix Leaflet/Vite

`src/lib/leaflet-icon-fix.ts` — importado em `src/main.tsx`

### Comportamento ao login

1. Carrega GeoJSON do município de São Paulo (IBGE 3550308)
   - URL: `https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-35-mun.json`
2. Borda azul escura (#1D3557), weight: 2, fillOpacity: 0.05
3. `map.invalidateSize()` antes do flyTo (garante centro correto do background-maps)
4. `map.flyTo(center, 10, { duration: 2 })` — animação suave
5. `map.once('moveend', () => map.fitBounds(bounds, { padding: [40, 40], animate: true }))` — encaixa o município

### Botões flutuantes (canto inferior direito)

```tsx
<div className="absolute bottom-6 right-4 z-[1000] flex flex-col items-center gap-2">

  {/* Botão focar na cidade */}
  <button onClick={focusCity} className="w-10 h-10 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50">
    <Crosshair size={16} />
  </button>

  {/* Grupo zoom */}
  <div className="flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
    <button onClick={() => map.zoomIn()} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50">
      <Plus size={16} />
    </button>
    <div className="h-px bg-gray-200 mx-2" />
    <button onClick={() => map.zoomOut()} className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-50">
      <Minus size={16} />
    </button>
  </div>

</div>
```

- `focusCity`: re-executa `fitBounds` do GeoJSON de São Paulo com `animate: true`
- Zoom control padrão do Leaflet desativado: `<MapContainer zoomControl={false}>`

---

## Decisões Técnicas

- **Tile único (light)**: removido seletor de estilos — apenas CartoDB Positron
- **`map.invalidateSize()` antes do fitBounds**: resolve problema de centralização quando sidebar está aberta
- **`DynamicTileLayer` dentro do `MapContainer`**: necessário para o contexto do Leaflet funcionar
- **`key={url}` no TileLayer**: força remount ao trocar tile
- **GeoJSON filtrado**: baixa todo o arquivo do estado, filtra por código IBGE no frontend
- **`zoomControl={false}`**: remove zoom padrão feio do Leaflet, substituído por botões estilizados

---

## Deploy

**VPS:** `root@168.231.64.36`
**Domínio:** `clickmaps.com.br`

```
/var/www/clickmaps/
├── maps/     ← frontend
└── site/     ← landing page (futuro)
```
