import { useState, useEffect, useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import {
  Building2, Users, ShieldCheck, Tag,
  Phone, MapPin, FileText, CalendarDays,
} from "lucide-react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Pie, PieChart, Label as RechartsLabel } from "recharts";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface DashTenant {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  valid_until: string | null;
  tenant_id: number | null;
}

interface DashPerson {
  id: number;
  active: boolean;
  type_people?: { id: number; name: string } | null;
}

interface DashTypeItem {
  id: number;
  name: string;
  active: boolean;
}

interface DashPermissionAction {
  id: number;
  module: string;
  name_module: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getValidityInfo(valid_until: string | null): {
  label: string;
  variant: "success" | "warning" | "destructive" | "secondary";
} {
  if (!valid_until) return { label: "Sem vencimento", variant: "secondary" };
  const days = differenceInDays(new Date(valid_until + "T00:00:00"), new Date());
  if (days < 0)   return { label: "Expirado",          variant: "destructive" };
  if (days <= 7)  return { label: `Expira em ${days}d`, variant: "destructive" };
  if (days <= 30) return { label: `Expira em ${days}d`, variant: "warning" };
  return { label: format(new Date(valid_until + "T00:00:00"), "dd/MM/yyyy"), variant: "success" };
}

// Gera chave CSS-safe a partir de um índice
const toKey = (i: number) => `t${i}`;

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, Icon, iconClass }: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <p className="text-sm font-medium text-muted-foreground leading-none">{label}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`rounded-xl p-2.5 shrink-0 ${iconClass}`}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TypeSummaryCard({ label, total, active, Icon }: {
  label: string;
  total: number;
  active: number;
  Icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border px-4 py-3">
      <div className="rounded-lg p-2 bg-muted text-muted-foreground shrink-0">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-bold tabular-nums">{total} cadastrado{total !== 1 ? "s" : ""}</p>
      </div>
      <Badge variant="success" appearance="light" size="sm">
        {active} ativo{active !== 1 ? "s" : ""}
      </Badge>
    </div>
  );
}

// ─── SettingsDashboardTab ─────────────────────────────────────────────────────

export function SettingsDashboardTab() {
  const [tenants,           setTenants]           = useState<DashTenant[]>([]);
  const [people,            setPeople]            = useState<DashPerson[]>([]);
  const [typePeople,        setTypePeople]        = useState<DashTypeItem[]>([]);
  const [typeContacts,      setTypeContacts]      = useState<DashTypeItem[]>([]);
  const [typeAddresses,     setTypeAddresses]     = useState<DashTypeItem[]>([]);
  const [typeDocuments,     setTypeDocuments]     = useState<DashTypeItem[]>([]);
  const [eventTypes,        setEventTypes]        = useState<DashTypeItem[]>([]);
  const [permissionActions, setPermissionActions] = useState<DashPermissionAction[]>([]);
  const [loading,           setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<DashTenant[]>("/tenants"),
      api.get<DashPerson[]>("/people"),
      api.get<DashTypeItem[]>("/type-people"),
      api.get<DashTypeItem[]>("/type-contacts"),
      api.get<DashTypeItem[]>("/type-addresses"),
      api.get<DashTypeItem[]>("/type-documents"),
      api.get<DashTypeItem[]>("/event-types"),
      api.get<DashPermissionAction[]>("/permission-actions"),
    ])
      .then(([tRes, pRes, tpRes, tcRes, taRes, tdRes, etRes, paRes]) => {
        setTenants(tRes.data);
        setPeople(pRes.data);
        setTypePeople(tpRes.data);
        setTypeContacts(tcRes.data);
        setTypeAddresses(taRes.data);
        setTypeDocuments(tdRes.data);
        setEventTypes(etRes.data);
        setPermissionActions(paRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const activeTenantsCount = tenants.filter(t => t.active).length;
  const activePeopleCount  = people.filter(p => p.active).length;
  const modulesCount       = new Set(permissionActions.map(a => a.module)).size;
  const totalTypes         = typePeople.length + typeContacts.length + typeAddresses.length
                           + typeDocuments.length + eventTypes.length;

  // ── Gabinetes ordenados (expirando primeiro) ───────────────────────────────

  const sortedTenants = useMemo(() =>
    [...tenants].sort((a, b) => {
      const dA = a.valid_until ? differenceInDays(new Date(a.valid_until + "T00:00:00"), new Date()) : 9999;
      const dB = b.valid_until ? differenceInDays(new Date(b.valid_until + "T00:00:00"), new Date()) : 9999;
      return dA - dB;
    }),
    [tenants],
  );

  // ── Pessoas por Tipo (donut) ───────────────────────────────────────────────

  const peopleByType = useMemo(() => {
    const counts: Record<string, number> = {};
    people.forEach(p => {
      const label = p.type_people?.name ?? "Sem tipo";
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return Object.entries(counts).map(([label, count], i) => ({
      typeKey: toKey(i),
      label,
      count,
      fill: `var(--color-${toKey(i)})`,
    }));
  }, [people]);

  const peopleTypeConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = { count: { label: "Pessoas" } };
    peopleByType.forEach((d, i) => {
      cfg[d.typeKey] = { label: d.label, color: CHART_COLORS[i % CHART_COLORS.length] };
    });
    return cfg;
  }, [peopleByType]);

  // ──────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="p-6 space-y-5">

        {/* ── Row 1: KPIs ── */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Gabinetes Ativos"
            value={activeTenantsCount}
            sub={`${tenants.length} total`}
            Icon={Building2}
            iconClass="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="Pessoas"
            value={activePeopleCount}
            sub={`${people.length - activePeopleCount} inativa${people.length - activePeopleCount !== 1 ? "s" : ""}`}
            Icon={Users}
            iconClass="bg-green-100 text-green-600"
          />
          <StatCard
            label="Módulos de Permissão"
            value={modulesCount}
            sub={`${permissionActions.length} ação${permissionActions.length !== 1 ? "ões" : ""}`}
            Icon={ShieldCheck}
            iconClass="bg-purple-100 text-purple-600"
          />
          <StatCard
            label="Tipos Cadastrados"
            value={totalTypes}
            sub="em 5 categorias"
            Icon={Tag}
            iconClass="bg-orange-100 text-orange-600"
          />
        </div>

        {/* ── Row 2: Gabinetes + Pessoas por Tipo ── */}
        <div className="grid grid-cols-5 gap-4">

          {/* Gabinetes */}
          <Card className="col-span-3">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Gabinetes</CardTitle>
              <CardDescription className="text-xs">Ordenados por vencimento mais próximo</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {sortedTenants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum gabinete cadastrado</p>
              ) : (
                <div className="space-y-2">
                  {sortedTenants.map(t => {
                    const validity = getValidityInfo(t.valid_until);
                    return (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.slug}.mapadovoto.com</p>
                        </div>
                        <Badge
                          variant={t.active ? "success" : "secondary"}
                          appearance="light"
                          size="sm"
                          className="shrink-0"
                        >
                          {t.active ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge
                          variant={validity.variant}
                          appearance="light"
                          size="sm"
                          className="shrink-0 tabular-nums"
                        >
                          {validity.label}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pessoas por Tipo */}
          <Card className="col-span-2">
            <CardHeader className="items-center pb-0">
              <CardTitle className="text-sm font-semibold">Pessoas por Tipo</CardTitle>
              <CardDescription className="text-xs">Distribuição por categoria</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              {people.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  Sem pessoas cadastradas
                </div>
              ) : (
                <ChartContainer config={peopleTypeConfig} className="mx-auto aspect-square max-h-52">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => {
                            const label = peopleByType.find(d => d.typeKey === String(name))?.label ?? String(name);
                            return (
                              <div className="flex w-full items-center justify-between gap-3">
                                <div className="flex items-center gap-1.5">
                                  <div
                                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                    style={{ backgroundColor: `var(--color-${name})` }}
                                  />
                                  <span className="text-muted-foreground text-xs">{label}</span>
                                </div>
                                <span className="font-semibold text-xs tabular-nums">{value}</span>
                              </div>
                            );
                          }}
                        />
                      }
                    />
                    <ChartLegend
                      content={<ChartLegendContent nameKey="typeKey" />}
                      className="-translate-y-1"
                    />
                    <Pie
                      data={peopleByType}
                      dataKey="count"
                      nameKey="typeKey"
                      innerRadius={52}
                      cornerRadius={4}
                      paddingAngle={2}
                      stroke="var(--background)"
                      strokeWidth={2}
                    >
                      <RechartsLabel
                        content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground text-2xl font-bold tabular-nums"
                                >
                                  {people.length}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 18}
                                  className="fill-muted-foreground text-xs"
                                >
                                  pessoas
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Cadastros de Tipos ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Cadastros de Tipos</CardTitle>
            <CardDescription className="text-xs">Resumo das tabelas auxiliares</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-3">
              <TypeSummaryCard
                label="Tipo de Pessoa"
                total={typePeople.length}
                active={typePeople.filter(t => t.active).length}
                Icon={Users}
              />
              <TypeSummaryCard
                label="Tipo de Contato"
                total={typeContacts.length}
                active={typeContacts.filter(t => t.active).length}
                Icon={Phone}
              />
              <TypeSummaryCard
                label="Tipo de Endereço"
                total={typeAddresses.length}
                active={typeAddresses.filter(t => t.active).length}
                Icon={MapPin}
              />
              <TypeSummaryCard
                label="Tipo de Documento"
                total={typeDocuments.length}
                active={typeDocuments.filter(t => t.active).length}
                Icon={FileText}
              />
              <TypeSummaryCard
                label="Tipo de Evento"
                total={eventTypes.length}
                active={eventTypes.filter(t => t.active).length}
                Icon={CalendarDays}
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
