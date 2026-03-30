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
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, Pie, PieChart, Label as RechartsLabel } from "recharts";

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

interface FinDashboardTabProps {
  dateFrom?: string;
  dateTo?: string;
}

export function FinDashboardTab({ dateFrom: filterFrom, dateTo: filterTo }: FinDashboardTabProps) {
  const [banks, setBanks] = useState<DashBank[]>([]);
  const [pendingExpense, setPendingExpense] = useState<DashTitle[]>([]);
  const [pendingIncome, setPendingIncome] = useState<DashTitle[]>([]);
  const [allTitles, setAllTitles] = useState<DashTitle[]>([]);
  const [extractEntries, setExtractEntries] = useState<DashExtractEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = todayStr();
    const dateFrom = filterFrom ?? format(startOfMonth(subMonths(new Date(), 10)), "yyyy-MM-dd");
    const dateTo   = filterTo ?? today;

    Promise.all([
      api.get<DashBank[]>("/fin-banks"),
      api.get<DashTitle[]>("/fin-titles", { params: { type: "expense", status: "pending", date_from: filterFrom, date_to: filterTo } }),
      api.get<DashTitle[]>("/fin-titles", { params: { type: "income",  status: "pending", date_from: filterFrom, date_to: filterTo } }),
      api.get<DashTitle[]>("/fin-titles", { params: { date_from: filterFrom, date_to: filterTo } }),
      api.get<{ entries: DashExtractEntry[] }>("/fin-extract", { params: { date_from: dateFrom, date_to: dateTo } }),
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
  }, [filterFrom, filterTo]);

  // ── KPIs ──────────────────────────────────────────────────────────────────

  const totalBankBalance = banks.reduce((s, b) => s + (b.current_balance ?? 0), 0);
  const totalExpense     = pendingExpense.reduce((s, t) => s + t.amount, 0);
  const totalIncome      = pendingIncome.reduce((s, t) => s + t.amount, 0);
  const netBalance       = totalIncome - totalExpense;

  // ── Fluxo de Caixa (12 meses: -10 atual +1) ──────────────────────────────

  const monthlyData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(new Date(), 10 - i);
      const key = format(d, "yyyy-MM");
      const monthIn  = extractEntries.filter(e => e.type === "in"  && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      const monthOut = extractEntries.filter(e => e.type === "out" && e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
      return { month: MONTHS_PT[d.getMonth()], year: format(d, "yyyy"), in: monthIn, out: monthOut };
    }),
    [extractEntries],
  );

  const cashFlowConfig: ChartConfig = {
    in:  { label: "Entradas", color: "#22c55e" },
    out: { label: "Saídas",   color: "#ef4444" },
  };

  // ── Status dos Títulos (donut por tipo) ──────────────────────────────────────

  const typeCounts = useMemo(() => {
    const c = {
      expense_pending: 0, expense_paid: 0, income_pending: 0, income_paid: 0,
      expense_pending_amt: 0, expense_paid_amt: 0, income_pending_amt: 0, income_paid_amt: 0,
    };
    allTitles.forEach(t => {
      const isPaid = t.status === "paid" || t.status === "partial";
      if (t.type === "expense") {
        if (isPaid) { c.expense_paid++; c.expense_paid_amt += t.amount; }
        else if (t.status === "pending") { c.expense_pending++; c.expense_pending_amt += t.amount; }
      } else {
        if (isPaid) { c.income_paid++; c.income_paid_amt += t.amount; }
        else if (t.status === "pending") { c.income_pending++; c.income_pending_amt += t.amount; }
      }
    });
    return c;
  }, [allTitles]);

const statusConfig: ChartConfig = {
    count:           { label: "Títulos" },
    expense_pending: { label: "Pagar: Pendente", color: "#ef4444" },
    expense_paid:    { label: "Pagar: Baixado",  color: "#fca5a5" },
    income_pending:  { label: "Receber: Pendente", color: "#22c55e" },
    income_paid:     { label: "Receber: Baixado",  color: "#86efac" },
  };


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
              <CardDescription className="text-xs">Entradas e saídas no período selecionado</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <ChartContainer config={cashFlowConfig} className="h-56 w-full">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={6} />
                  <ChartTooltip
                    cursor={false}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md text-xs space-y-1 min-w-[160px]">
                          <p className="font-semibold text-foreground">{label} {payload[0]?.payload?.year}</p>
                          {payload.map(p => (
                            <div key={p.dataKey} className="flex justify-between gap-4 text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                <span>{cashFlowConfig[p.dataKey as keyof typeof cashFlowConfig]?.label}</span>
                              </div>
                              <span className="font-medium text-foreground tabular-nums">{fmtBRL(Number(p.value))}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Area dataKey="in"  type="monotone" stroke="#22c55e" strokeWidth={2} fill="url(#gradIn)"  dot={false} />
                  <Area dataKey="out" type="monotone" stroke="#ef4444" strokeWidth={2} fill="url(#gradOut)" dot={false} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Status dos Títulos — dois gauges lado a lado */}
          <Card className="col-span-2">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-semibold">Status dos Títulos</CardTitle>
              <CardDescription className="text-xs">Distribuição por situação</CardDescription>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2">
                {/* Pagar */}
                <div className="flex flex-col items-center">
                  <ChartContainer config={statusConfig} className="w-full max-h-96">
                    <PieChart>
                      <ChartTooltip cursor={false} content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const key = payload[0].name as string;
                        const count = payload[0].value as number;
                        const amt = key === "expense_pending" ? typeCounts.expense_pending_amt : typeCounts.expense_paid_amt;
                        const label = key === "expense_pending" ? "Pendente" : "Baixado";
                        return (
                          <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md text-xs space-y-1 min-w-[160px]">
                            <p className="font-semibold text-foreground">Títulos A Pagar</p>
                            <div className="flex justify-between gap-4 text-muted-foreground"><span>{label}:</span><span className="font-medium text-foreground tabular-nums">{count}</span></div>
                            <div className="flex justify-between gap-4 text-muted-foreground"><span>Valor:</span><span className="font-medium text-foreground tabular-nums">{fmtBRL(amt)}</span></div>
                          </div>
                        );
                      }} />
                      <Pie
                        data={[
                          { status: "expense_pending", count: typeCounts.expense_pending, fill: "#ef4444" },
                          { status: "expense_paid",    count: typeCounts.expense_paid,    fill: "#fca5a5" },
                        ].filter(d => d.count > 0)}
                        dataKey="count"
                        nameKey="status"
                        startAngle={180}
                        endAngle={0}
                        cy="75%"
                        innerRadius={70}
                        outerRadius={110}
                        cornerRadius={4}
                        paddingAngle={2}
                        stroke="var(--background)"
                        strokeWidth={2}
                        isAnimationActive={false}
                      >
                        <RechartsLabel content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            const total = typeCounts.expense_pending + typeCounts.expense_paid;
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold tabular-nums">{total}</tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-xs">a pagar</tspan>
                              </text>
                            );
                          }
                        }} />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: "#ef4444" }} /><span className="text-xs text-muted-foreground">Pendente</span></div>
                      <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: "#fca5a5" }} /><span className="text-xs text-muted-foreground">Baixado</span></div>
                    </div>
                    <p className="text-sm font-semibold text-red-600 tabular-nums">{fmtBRL(typeCounts.expense_pending_amt + typeCounts.expense_paid_amt)}</p>
                  </div>
                </div>

                {/* Receber */}
                <div className="flex flex-col items-center">
                  <ChartContainer config={statusConfig} className="w-full max-h-96">
                    <PieChart>
                      <ChartTooltip cursor={false} content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const key = payload[0].name as string;
                        const count = payload[0].value as number;
                        const amt = key === "income_pending" ? typeCounts.income_pending_amt : typeCounts.income_paid_amt;
                        const label = key === "income_pending" ? "Pendente" : "Baixado";
                        return (
                          <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-md text-xs space-y-1 min-w-[160px]">
                            <p className="font-semibold text-foreground">Títulos A Receber</p>
                            <div className="flex justify-between gap-4 text-muted-foreground"><span>{label}:</span><span className="font-medium text-foreground tabular-nums">{count}</span></div>
                            <div className="flex justify-between gap-4 text-muted-foreground"><span>Valor:</span><span className="font-medium text-foreground tabular-nums">{fmtBRL(amt)}</span></div>
                          </div>
                        );
                      }} />
                      <Pie
                        data={[
                          { status: "income_pending", count: typeCounts.income_pending, fill: "#22c55e" },
                          { status: "income_paid",    count: typeCounts.income_paid,    fill: "#86efac" },
                        ].filter(d => d.count > 0)}
                        dataKey="count"
                        nameKey="status"
                        startAngle={180}
                        endAngle={0}
                        cy="75%"
                        innerRadius={70}
                        outerRadius={110}
                        isAnimationActive={false}
                        cornerRadius={4}
                        paddingAngle={2}
                        stroke="var(--background)"
                        strokeWidth={2}
                      >
                        <RechartsLabel content={({ viewBox }) => {
                          if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                            const total = typeCounts.income_pending + typeCounts.income_paid;
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-xl font-bold tabular-nums">{total}</tspan>
                                <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-muted-foreground text-xs">a receber</tspan>
                              </text>
                            );
                          }
                        }} />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: "#22c55e" }} /><span className="text-xs text-muted-foreground">Pendente</span></div>
                      <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: "#86efac" }} /><span className="text-xs text-muted-foreground">Baixado</span></div>
                    </div>
                    <p className="text-sm font-semibold text-green-600 tabular-nums">{fmtBRL(typeCounts.income_pending_amt + typeCounts.income_paid_amt)}</p>
                  </div>
                </div>
              </div>
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
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{t.invoice_number ?? `#${t.id}`}</p>
                          <Badge
                            variant={t.type === "expense" ? "destructive" : "success"}
                            appearance="light"
                            size="sm"
                            className="shrink-0"
                          >
                            {t.type === "expense" ? "Pagar" : "Receber"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{t.people_name ?? "—"}</p>
                      </div>
                      <Badge variant="destructive" appearance="light" size="sm" className="shrink-0 tabular-nums">
                        {fmtDate(t.due_date)}
                      </Badge>
                      <span className={`text-sm font-semibold tabular-nums shrink-0 ${t.type === "expense" ? "text-red-600" : "text-green-600"}`}>
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
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{t.invoice_number ?? `#${t.id}`}</p>
                          <Badge
                            variant={t.type === "expense" ? "destructive" : "success"}
                            appearance="light"
                            size="sm"
                            className="shrink-0"
                          >
                            {t.type === "expense" ? "Pagar" : "Receber"}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{t.people_name ?? "—"}</p>
                      </div>
                      <Badge variant="warning" appearance="light" size="sm" className="shrink-0 tabular-nums">
                        {fmtDate(t.due_date)}
                      </Badge>
                      <span className={`text-sm font-semibold tabular-nums shrink-0 ${t.type === "expense" ? "text-red-600" : "text-green-600"}`}>
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
