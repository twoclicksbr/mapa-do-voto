import { useState, useEffect, useMemo } from "react";
import { format, subMonths, addDays, startOfMonth } from "date-fns";
import {
  Landmark, TrendingDown, TrendingUp, Clock, AlertTriangle,
  ArrowDownToLine, ArrowUpFromLine,
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
import { Bar, BarChart, CartesianGrid, XAxis, Pie, PieChart, Label as RechartsLabel } from "recharts";

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface DashBank {
  id: number;
  name: string;
  current_balance: number | null;
}

interface DashTitle {
  id: number;
  type: "income" | "expense";
  amount: number;
  due_date: string;
  people_name?: string;
  invoice_number?: string | null;
  status: "pending" | "paid" | "partial" | "cancelled" | "reversed";
}

interface DashExtractEntry {
  type: "in" | "out";
  amount: number;
  date: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const todayStr = () => format(new Date(), "yyyy-MM-dd");

const MONTHS_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  Icon: React.ElementType;
  iconClass?: string;
}

function StatCard({ label, value, sub, Icon, iconClass = "bg-primary/10 text-primary" }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 min-w-0">
            <p className="text-sm font-medium text-muted-foreground leading-none">{label}</p>
            <p className="text-2xl font-bold tracking-tight tabular-nums truncate">{value}</p>
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

// ─── FinDashboardTab ──────────────────────────────────────────────────────────

export function FinDashboardTab() {
  const [banks, setBanks] = useState<DashBank[]>([]);
  const [pendingExpense, setPendingExpense] = useState<DashTitle[]>([]);
  const [pendingIncome, setPendingIncome] = useState<DashTitle[]>([]);
  const [allTitles, setAllTitles] = useState<DashTitle[]>([]);
  const [extractEntries, setExtractEntries] = useState<DashExtractEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = todayStr();
    const dateFrom = format(startOfMonth(subMonths(new Date(), 5)), "yyyy-MM-dd");

    Promise.all([
      api.get<DashBank[]>("/fin-banks"),
      api.get<DashTitle[]>("/fin-titles", { params: { type: "expense", status: "pending" } }),
      api.get<DashTitle[]>("/fin-titles", { params: { type: "income", status: "pending" } }),
      api.get<DashTitle[]>("/fin-titles"),
      api.get<{ entries: DashExtractEntry[] }>("/fin-extract", { params: { date_from: dateFrom, date_to: today } }),
    ])
      .then(([banksRes, expRes, incRes, allRes, extRes]) => {
        setBanks(banksRes.data);
        setPendingExpense(expRes.data);
        setPendingIncome(incRes.data);
        setAllTitles(allRes.data);
        setExtractEntries(extRes.data.entries ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const totalBankBalance = banks.reduce((s, b) => s + (b.current_balance ?? 0), 0);
  const totalExpense     = pendingExpense.reduce((s, t) => s + t.amount, 0);
  const totalIncome      = pendingIncome.reduce((s, t) => s + t.amount, 0);
  const netBalance       = totalIncome - totalExpense;

  // ── Fluxo de Caixa (6 meses) ──────────────────────────────────────────────

  const monthlyData = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(new Date(), 5 - i);
      const key = format(d, "yyyy-MM");
      const monthIn  = extractEntries.filter(e => e.type === "in"  && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const monthOut = extractEntries.filter(e => e.type === "out" && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      return { month: MONTHS_PT[d.getMonth()], in: monthIn, out: monthOut };
    }),
    [extractEntries],
  );

  const cashFlowConfig: ChartConfig = {
    in:  { label: "Entradas", color: "var(--chart-2)" },
    out: { label: "Saídas",   color: "var(--chart-5)" },
  };

  // ── Status dos Títulos (donut) ─────────────────────────────────────────────

  const statusCounts = useMemo(() => {
    const c = { pending: 0, paid: 0, partial: 0, cancelled: 0, reversed: 0 };
    allTitles.forEach(t => { c[t.status] = (c[t.status] ?? 0) + 1; });
    return c;
  }, [allTitles]);

  const statusData = [
    { status: "pending",   count: statusCounts.pending,   fill: "var(--color-pending)"   },
    { status: "paid",      count: statusCounts.paid,       fill: "var(--color-paid)"      },
    { status: "partial",   count: statusCounts.partial,    fill: "var(--color-partial)"   },
    { status: "reversed",  count: statusCounts.reversed,   fill: "var(--color-reversed)"  },
    { status: "cancelled", count: statusCounts.cancelled,  fill: "var(--color-cancelled)" },
  ].filter(d => d.count > 0);

  const statusConfig: ChartConfig = {
    count:     { label: "Títulos"      },
    pending:   { label: "Pendente",     color: "var(--chart-1)" },
    paid:      { label: "Pago",         color: "var(--chart-2)" },
    partial:   { label: "Pago Parcial", color: "var(--chart-3)" },
    reversed:  { label: "Estornado",    color: "var(--chart-4)" },
    cancelled: { label: "Cancelado",    color: "var(--chart-5)" },
  };

  const totalTitlesCount = statusData.reduce((s, d) => s + d.count, 0);

  // ── Vencidos & A Vencer ───────────────────────────────────────────────────

  const today    = todayStr();
  const in30Days = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const overdueTitles = useMemo(() =>
    allTitles
      .filter(t => t.status === "pending" && t.due_date < today)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 6),
    [allTitles, today],
  );

  const upcomingTitles = useMemo(() =>
    allTitles
      .filter(t => t.status === "pending" && t.due_date >= today && t.due_date <= in30Days)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .slice(0, 6),
    [allTitles, today, in30Days],
  );

  // ─────────────────────────────────────────────────────────────────────────

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
            label="Saldo em Bancos"
            value={fmtBRL(totalBankBalance)}
            sub={`${banks.length} conta${banks.length !== 1 ? "s" : ""}`}
            Icon={Landmark}
            iconClass={totalBankBalance >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}
          />
          <StatCard
            label="A Pagar (Pendente)"
            value={fmtBRL(totalExpense)}
            sub={`${pendingExpense.length} título${pendingExpense.length !== 1 ? "s" : ""}`}
            Icon={ArrowDownToLine}
            iconClass="bg-red-100 text-red-600"
          />
          <StatCard
            label="A Receber (Pendente)"
            value={fmtBRL(totalIncome)}
            sub={`${pendingIncome.length} título${pendingIncome.length !== 1 ? "s" : ""}`}
            Icon={ArrowUpFromLine}
            iconClass="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="Saldo Líquido"
            value={fmtBRL(netBalance)}
            sub="A receber − A pagar"
            Icon={netBalance >= 0 ? TrendingUp : TrendingDown}
            iconClass={netBalance >= 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}
          />
        </div>

        {/* ── Row 2: Charts ── */}
        <div className="grid grid-cols-5 gap-4">

          {/* Fluxo de Caixa */}
          <Card className="col-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Fluxo de Caixa</CardTitle>
              <CardDescription className="text-xs">Entradas e saídas dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={cashFlowConfig} className="h-52">
                <BarChart data={monthlyData} barCategoryGap="30%">
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={6}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        indicator="dot"
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5">
                              <div
                                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                style={{ backgroundColor: `var(--color-${name})` }}
                              />
                              <span className="text-muted-foreground text-xs">
                                {cashFlowConfig[name as keyof typeof cashFlowConfig]?.label ?? String(name)}
                              </span>
                            </div>
                            <span className="font-semibold text-xs">{fmtBRL(Number(value))}</span>
                          </div>
                        )}
                      />
                    }
                  />
                  <Bar dataKey="in"  fill="var(--color-in)"  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="out" fill="var(--color-out)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Status dos Títulos */}
          <Card className="col-span-2">
            <CardHeader className="items-center pb-0">
              <CardTitle className="text-sm font-semibold">Status dos Títulos</CardTitle>
              <CardDescription className="text-xs">Distribuição por situação</CardDescription>
            </CardHeader>
            <CardContent className="pb-0">
              {totalTitlesCount === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
                  Sem títulos cadastrados
                </div>
              ) : (
                <ChartContainer config={statusConfig} className="mx-auto aspect-square max-h-52">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value, name) => (
                            <div className="flex w-full items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                  style={{ backgroundColor: `var(--color-${name})` }}
                                />
                                <span className="text-muted-foreground text-xs">
                                  {statusConfig[name as keyof typeof statusConfig]?.label ?? String(name)}
                                </span>
                              </div>
                              <span className="font-semibold text-xs tabular-nums">{value}</span>
                            </div>
                          )}
                        />
                      }
                    />
                    <ChartLegend content={<ChartLegendContent nameKey="status" />} className="-translate-y-1" />
                    <Pie
                      data={statusData}
                      dataKey="count"
                      nameKey="status"
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
                                  {totalTitlesCount}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 18}
                                  className="fill-muted-foreground text-xs"
                                >
                                  títulos
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

        {/* ── Row 3: Alertas ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Vencidos */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="size-4 text-red-500" />
                Títulos Vencidos
                {overdueTitles.length > 0 && (
                  <Badge variant="destructive" appearance="light" size="sm">
                    {overdueTitles.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {overdueTitles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum título vencido</p>
              ) : (
                <div className="space-y-2">
                  {overdueTitles.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.invoice_number ?? `#${t.id}`}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.people_name ?? "—"}</p>
                      </div>
                      <Badge variant="destructive" appearance="light" size="sm" className="shrink-0 tabular-nums">
                        {fmtDate(t.due_date)}
                      </Badge>
                      <span className={`text-sm font-semibold tabular-nums shrink-0 ${t.type === "expense" ? "text-red-600" : "text-blue-600"}`}>
                        {fmtBRL(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* A Vencer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="size-4 text-amber-500" />
                A Vencer (próximos 30 dias)
                {upcomingTitles.length > 0 && (
                  <Badge variant="warning" appearance="light" size="sm">
                    {upcomingTitles.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {upcomingTitles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">Nenhum título a vencer</p>
              ) : (
                <div className="space-y-2">
                  {upcomingTitles.map(t => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{t.invoice_number ?? `#${t.id}`}</p>
                        <p className="text-xs text-muted-foreground truncate">{t.people_name ?? "—"}</p>
                      </div>
                      <Badge variant="warning" appearance="light" size="sm" className="shrink-0 tabular-nums">
                        {fmtDate(t.due_date)}
                      </Badge>
                      <span className={`text-sm font-semibold tabular-nums shrink-0 ${t.type === "expense" ? "text-red-600" : "text-blue-600"}`}>
                        {fmtBRL(t.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Saldo por Conta ── */}
        {banks.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Saldo por Conta</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...banks]
                  .sort((a, b) => (b.current_balance ?? 0) - (a.current_balance ?? 0))
                  .map(bank => {
                    const balance = bank.current_balance ?? 0;
                    const maxAbs  = Math.max(...banks.map(b => Math.abs(b.current_balance ?? 0)), 1);
                    const pct     = (Math.abs(balance) / maxAbs) * 100;
                    return (
                      <div key={bank.id} className="flex items-center gap-3">
                        <p className="w-40 shrink-0 text-sm font-medium truncate">{bank.name}</p>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${balance >= 0 ? "bg-green-500" : "bg-red-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className={`w-32 text-right text-sm font-semibold tabular-nums shrink-0 ${balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {fmtBRL(balance)}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
