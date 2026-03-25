import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BirthDatePicker } from "@/components/people/birth-date-picker";
import { PeopleModal } from "@/components/people/people-modal";
import { Person } from "@/components/people/people-data-grid";
import { TypePeople } from "@/components/type-people/type-people-data-grid";
import api from "@/lib/api";
import { FinTitle } from "./fin-titles-data-grid";
import { FinInstallmentModal, InstallmentConfig, addDays } from "./fin-installment-modal";

// ─── Reference types (fetched internally) ────────────────────────────────────

interface RefPerson          { id: number; name: string }
interface RefAccount         { id: number; label: string; type: string; nature: string }
interface RefPaymentMethod   { id: number; name: string }
interface RefBank            { id: number; name: string }
interface RefDepartment      { id: number; name: string }

interface ApiAccount {
  id: number;
  name: string;
  type: string;
  nature: string;
  children: ApiAccount[];
}

function fmtBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(raw: string) {
  const [y, m, d] = raw.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
}

function CompositionTable({ label, rows }: { label: string; rows: FinTitle[] }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/80">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Título</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Parcela</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Vencimento</th>
              <th className="px-4 py-2 text-right font-medium text-muted-foreground">Valor</th>
              <th className="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-2 font-mono text-muted-foreground">
                  {t.invoice_number ?? `#${String(t.id).padStart(5, "0")}`}
                </td>
                <td className="px-4 py-2 tabular-nums text-muted-foreground">
                  {t.installment_number && t.installment_total ? `${t.installment_number}/${t.installment_total}` : "—"}
                </td>
                <td className="px-4 py-2 tabular-nums">{t.due_date ? fmtDate(t.due_date) : "—"}</td>
                <td className="px-4 py-2 text-right font-medium tabular-nums">{fmtBRL(t.amount)}</td>
                <td className="px-4 py-2">
                  <Badge variant={STATUS_VARIANTS[t.status] ?? "primary"} appearance="light" size="sm">
                    {STATUS_OPTIONS.find((s) => s.value === t.status)?.label ?? t.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function flattenAccounts(accounts: ApiAccount[], depth = 0): RefAccount[] {
  return accounts.flatMap((a) => [
    { id: a.id, label: "\u2014 ".repeat(depth) + a.name, type: a.type, nature: a.nature },
    ...flattenAccounts(a.children ?? [], depth + 1),
  ]);
}

// ─── Cost-center row ──────────────────────────────────────────────────────────

interface CostCenter {
  department_id: number | null;
  percentage: string;
}

// ─── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "pending",   label: "Pendente" },
  { value: "paid",      label: "Pago" },
  { value: "partial",   label: "Pago Parcial" },
  { value: "cancelled", label: "Cancelado" },
  { value: "reversed",  label: "Estornado" },
];

const STATUS_VARIANTS: Record<string, "success" | "destructive" | "warning" | "primary" | "info"> = {
  pending:   "primary",
  paid:      "success",
  partial:   "warning",
  cancelled: "destructive",
  reversed:  "info",
};

// ─── Currency mask helpers ────────────────────────────────────────────────────

function maskCurrency(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrency(masked: string): number {
  return parseFloat(masked.replace(/\./g, "").replace(",", ".")) || 0;
}

function numberToMask(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function maskPercent(value: string): string {
  const cleaned = value.replace(/[^\d,]/g, "");
  const parts = cleaned.split(",");
  const integer = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.length > 1 ? integer + "," + parts[1] : integer;
}

function parsePercent(masked: string): number {
  return parseFloat(masked.replace(/\./g, "").replace(",", ".")) || 0;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface FinTitleModalProps {
  open: boolean;
  title: FinTitle | null;
  defaultType: "income" | "expense";
  initialTab?: string;
  onClose: () => void;
  onSaved: (title: FinTitle) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FinTitleModal({
  open,
  title,
  defaultType,
  initialTab = "geral",
  onClose,
  onSaved,
}: FinTitleModalProps) {
  const isEditing = !!title;

  // ── Form state ──────────────────────────────────────────────────────────────
  const [multa,             setMulta]             = useState("");
  const [amount,            setAmount]            = useState("");
  const [discount,          setDiscount]          = useState("");
  const [interest,          setInterest]          = useState("");
  const [issueDate,         setIssueDate]         = useState("");
  const [dueDate,           setDueDate]           = useState("");
  const [peopleId,          setPeopleId]          = useState("");
  const [peopleQuery,       setPeopleQuery]       = useState("");
  const [showPeopleDrop,    setShowPeopleDrop]    = useState(false);
  const [highlightedIdx,    setHighlightedIdx]    = useState(-1);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const [accountId,         setAccountId]         = useState("");
  const [paymentMethodId,   setPaymentMethodId]   = useState("");
  const [bankId,            setBankId]            = useState("");
  const [installmentNumber, setInstallmentNumber] = useState("");
  const [installmentTotal,  setInstallmentTotal]  = useState("");
  const [documentNumber,    setDocumentNumber]    = useState("");
  const [invoiceNumber,     setInvoiceNumber]     = useState("");
  const [barcode,           setBarcode]           = useState("");
  const [pixKey,            setPixKey]            = useState("");
  const [status,            setStatus]            = useState("pending");
  const [costCenters,       setCostCenters]       = useState<CostCenter[]>([]);

  // ── Reference data (loaded when modal opens) ────────────────────────────────
  const [people,         setPeople]         = useState<RefPerson[]>([]);
  const [accounts,       setAccounts]       = useState<RefAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<RefPaymentMethod[]>([]);
  const [banks,          setBanks]          = useState<RefBank[]>([]);
  const [departments,    setDepartments]    = useState<RefDepartment[]>([]);
  const [typePeople,     setTypePeople]     = useState<TypePeople[]>([]);

  // ── Create person inline ─────────────────────────────────────────────────────
  const [showCreatePeople, setShowCreatePeople] = useState(false);

  // ── Amount keyboard mode ─────────────────────────────────────────────────────
  const [amountDecMode, setAmountDecMode] = useState(false);

  // ── Pay state ────────────────────────────────────────────────────────────────
  const [payNetAmount,       setPayNetAmount]        = useState("");
  const [payInterest,        setPayInterest]         = useState("");
  const [payInterestVal,     setPayInterestVal]      = useState("");
  const [payMulta,           setPayMulta]            = useState("");
  const [payMultaVal,        setPayMultaVal]         = useState("");
  const [payDiscount,        setPayDiscount]         = useState("");
  const [payDiscountVal,     setPayDiscountVal]      = useState("");
  const [payPaidAt,          setPayPaidAt]           = useState("");
  const [payAccountId,       setPayAccountId]        = useState("");
  const [payBankId,          setPayBankId]           = useState("");
  const [payPaymentMethodId, setPayPaymentMethodId]  = useState("");
  const [payLoading,         setPayLoading]          = useState(false);
  const [payErrors,          setPayErrors]           = useState<Record<string, string>>({});

  // ── UI state ────────────────────────────────────────────────────────────────
  const [loading,              setLoading]              = useState(false);
  const [refLoading,           setRefLoading]           = useState(false);
  const [errors,               setErrors]               = useState<Record<string, string>>({});
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [compositionOrigins,      setCompositionOrigins]      = useState<FinTitle[]>([]);
  const [compositionDestinations, setCompositionDestinations] = useState<FinTitle[]>([]);

  // ── Load reference data + (if editing) full detail ──────────────────────────
  useEffect(() => {
    if (!open) return;
    setErrors({});

    setRefLoading(true);
    api.get<TypePeople[]>("/type-people").then((r) => setTypePeople(r.data)).catch(() => {});

    Promise.all([
      api.get<RefPerson[]>("/people"),
      api.get<ApiAccount[]>("/fin-accounts"),
      api.get<RefPaymentMethod[]>("/fin-payment-methods"),
      api.get<RefBank[]>("/fin-banks"),
      api.get<RefDepartment[]>("/departments"),
    ])
      .then(([pRes, aRes, pmRes, bRes, dRes]) => {
        setPeople(pRes.data);
        if (title?.people_id) {
          const found = pRes.data.find((p: RefPerson) => p.id === title.people_id);
          if (found) setPeopleQuery(found.name);
        }
        setAccounts(flattenAccounts(aRes.data));
        setPaymentMethods(pmRes.data);
        setBanks(bRes.data);
        setDepartments(dRes.data);
      })
      .catch(() => {})
      .finally(() => setRefLoading(false));

    if (title) {
      // Pre-populate from row data immediately
      setAmount(numberToMask(Number(title.amount)));
      setDiscount(title.discount != null ? String(title.discount) : "");
      setInterest(title.interest != null ? String(title.interest) : "");
      setMulta(title.multa != null ? String(title.multa) : "");
      setIssueDate(title.issue_date ?? "");
      setDueDate(title.due_date);
      setPeopleId(title.people_id ? String(title.people_id) : "");
      setAccountId(title.account_id ? String(title.account_id) : "");
      setPaymentMethodId(title.payment_method_id ? String(title.payment_method_id) : "");
      setBankId(title.bank_id ? String(title.bank_id) : "");
      setInstallmentNumber(title.installment_number ? String(title.installment_number) : "");
      setInstallmentTotal(title.installment_total ? String(title.installment_total) : "");
      setDocumentNumber(title.document_number ?? "");
      setInvoiceNumber(title.invoice_number ?? "");
      setBarcode(title.barcode ?? "");
      setPixKey(title.pix_key ?? "");
      setStatus(title.status);
      setCostCenters([]);

      // Pre-fill pay state
      const base2       = Number(title.amount);
      const pctI        = Number(title.interest ?? 0);
      const pctM        = Number(title.multa    ?? 0);
      const pctD        = Number(title.discount ?? 0);
      setPayInterest(maskPercent(String(pctI).replace(".", ",")));
      setPayInterestVal(numberToMask(base2 * pctI / 100));
      setPayMulta(maskPercent(String(pctM).replace(".", ",")));
      setPayMultaVal(numberToMask(base2 * pctM / 100));
      setPayDiscount(maskPercent(String(pctD).replace(".", ",")));
      setPayDiscountVal(numberToMask(base2 * pctD / 100));
      const initNet   = base2 + base2 * (pctI / 100) + base2 * (pctM / 100) - base2 * (pctD / 100);
      const paid      = Number(title.amount_paid ?? 0);
      setPayNetAmount(paid > 0 ? numberToMask(paid) : numberToMask(initNet));
      const now2 = new Date();
      const todayStr = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}-${String(now2.getDate()).padStart(2, "0")}`;
      setPayPaidAt(title.paid_at ?? todayStr);
      setPayAccountId(title.account_id ? String(title.account_id) : "");
      setPayBankId(title.bank_id ? String(title.bank_id) : "");
      setPayPaymentMethodId(title.payment_method_id ? String(title.payment_method_id) : "");
      setPayErrors({});

      // Load full detail for cost_centers + compositions
      api
        .get(`/fin-titles/${title.id}`)
        .then((res) => {
          const d = res.data;
          setDocumentNumber(d.document_number ?? "");
          setInvoiceNumber(d.invoice_number ?? "");
          setBarcode(d.barcode ?? "");
          setPixKey(d.pix_key ?? "");
          const detailPaid = Number(d.amount_paid ?? 0);
          if (detailPaid > 0) setPayNetAmount(numberToMask(detailPaid));
          setCostCenters(
            (d.cost_centers ?? []).map(
              (cc: { department_id: number; percentage: number }) => ({
                department_id: cc.department_id,
                percentage: String(cc.percentage),
              })
            )
          );
          setCompositionOrigins(d.composition_origins ?? []);
          setCompositionDestinations(d.composition_destinations ?? []);
        })
        .catch(() => {});
    } else {
      setAmount("");
      setAmountDecMode(false);
      setDiscount("");
      setInterest("");
      setMulta("");
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      setIssueDate(today);
      setDueDate(today);
      setPeopleId("");
      setPeopleQuery("");
      setAccountId("");
      setPaymentMethodId("");
      setBankId("");
      setInstallmentNumber("1");
      setInstallmentTotal("");
      setDocumentNumber("");
      setInvoiceNumber("");
      setBarcode("");
      setPixKey("");
      setStatus("pending");
      setCostCenters([]);
    }
  }, [open, title]);

  // ── Amount keyboard handler ──────────────────────────────────────────────────
  function handleAmountKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (isReadOnly) return;
    const key = e.key;
    const isDigit = key >= "0" && key <= "9";
    const isComma = key === "," || key === ".";
    const isBack  = key === "Backspace";
    const isDel   = key === "Delete";
    if (!isDigit && !isComma && !isBack && !isDel) return;
    e.preventDefault();

    // Parse current integer and decimal parts from displayed value
    const commaIdx = amount.lastIndexOf(",");
    const intDigits = (commaIdx >= 0 ? amount.slice(0, commaIdx) : amount).replace(/\D/g, "");
    const decStr    = (commaIdx >= 0 ? amount.slice(commaIdx + 1) : "00").replace(/\D/g, "").padEnd(2, "0").slice(0, 2);
    const intVal    = intDigits ? parseInt(intDigits, 10) : 0;

    const rebuild = (iv: number, ds: string) =>
      (iv > 0 ? iv.toLocaleString("pt-BR") : "0") + "," + ds;

    if (isDel) {
      setAmount("");
      setAmountDecMode(false);
      return;
    }

    if (isComma) {
      if (!amountDecMode) setAmountDecMode(true);
      return;
    }

    if (isBack) {
      if (amountDecMode) {
        const newDec = "0" + decStr.slice(0, 1); // shift left
        if (newDec === "00") setAmountDecMode(false);
        setAmount(intVal === 0 && newDec === "00" ? "" : rebuild(intVal, newDec));
      } else {
        const newIntStr = String(intVal).slice(0, -1);
        if (!newIntStr) { setAmount(""); return; }
        setAmount(parseInt(newIntStr, 10).toLocaleString("pt-BR") + ",00");
      }
      return;
    }

    if (isDigit) {
      if (amountDecMode) {
        const newDec = decStr.slice(1) + key; // shift right on cents
        setAmount(rebuild(intVal, newDec));
      } else {
        const newIntStr = String(intVal === 0 ? "" : intVal) + key;
        setAmount(parseInt(newIntStr, 10).toLocaleString("pt-BR") + ",00");
      }
    }
  }

  // ── Build base payload ──────────────────────────────────────────────────────
  const buildPayload = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    type:               title?.type ?? defaultType,
    amount:             parseCurrency(amount),
    discount:           discount ? parseFloat(discount) : null,
    interest:           interest ? parseFloat(interest) : null,
    multa:              multa    ? parseFloat(multa)    : null,
    issue_date:         issueDate || null,
    due_date:           dueDate,
    people_id:          peopleId ? parseInt(peopleId) : undefined,
    account_id:         accountId ? parseInt(accountId) : null,
    payment_method_id:  paymentMethodId ? parseInt(paymentMethodId) : null,
    bank_id:            bankId ? parseInt(bankId) : null,
    installment_number: 1,
    installment_total:  1,
    document_number:    documentNumber.trim() || null,
    invoice_number:     invoiceNumber.trim() || null,
    barcode:            barcode.trim() || null,
    pix_key:            pixKey.trim() || null,
    status:             isEditing ? status : "pending",
    cost_centers: costCenters
      .filter((cc) => cc.department_id && cc.percentage)
      .map((cc) => ({
        department_id: cc.department_id,
        percentage:    parseFloat(cc.percentage),
      })),
    ...overrides,
  });

  // ── Handle installment confirmation ─────────────────────────────────────────
  const handleInstallmentConfirm = async (config: InstallmentConfig) => {
    setShowInstallmentModal(false);
    setLoading(true);
    const total = parseInt(installmentNumber) || 1;
    const baseAmount = parseCurrency(amount);
    const perAmount = config.divide ? baseAmount / total : baseAmount;

    try {
      let lastRes: FinTitle | null = null;
      for (let i = 0; i < total; i++) {
        const res = await api.post<FinTitle>("/fin-titles", buildPayload({
          amount:             perAmount,
          due_date:           addDays(config.firstDueDate, i * config.intervalDays),
          installment_number: i + 1,
          installment_total:  total,
        }));
        lastRes = res.data;
      }
      if (lastRes) onSaved(lastRes);
      onClose();
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  };

  // ── Pay ─────────────────────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!title) return;
    const errs: Record<string, string> = {};
    if (!payBankId)            errs.bank_id            = "Banco é obrigatório.";
    if (!payAccountId)         errs.account_id         = "Conta Financeira é obrigatória.";
    if (!payPaymentMethodId)   errs.payment_method_id  = "Modalidade é obrigatória.";
    if (Object.keys(errs).length) { setPayErrors(errs); return; }
    setPayErrors({});
    setPayLoading(true);
    try {
      const res = await api.post<FinTitle>(`/fin-titles/${title.id}/pay`, {
        paid_at:           payPaidAt,
        amount_paid:       parseCurrency(payNetAmount),
        account_id:        payAccountId ? parseInt(payAccountId) : null,
        payment_method_id: payPaymentMethodId ? parseInt(payPaymentMethodId) : null,
        bank_id:           payBankId ? parseInt(payBankId) : null,
      });
      onSaved(res.data);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]> } } };
      const apiErrors = axiosErr?.response?.data?.errors;
      if (apiErrors) {
        const flat: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(apiErrors)) {
          flat[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setPayErrors(flat);
      }
    } finally {
      setPayLoading(false);
    }
  };

  // ── Reverse ──────────────────────────────────────────────────────────────────
  const handleReverse = async () => {
    if (!title) return;
    setPayLoading(true);
    try {
      const res = await api.post<FinTitle>(`/fin-titles/${title.id}/reverse`);
      onSaved(res.data);
      onClose();
    } catch {
      // silently ignore
    } finally {
      setPayLoading(false);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Multi-installment: open config modal
    if (!isEditing && parseInt(installmentNumber) > 1) {
      setShowInstallmentModal(true);
      return;
    }

    setLoading(true);

    try {
      const payload = buildPayload({
        installment_number: installmentNumber ? parseInt(installmentNumber) : 1,
        installment_total:  installmentTotal ? parseInt(installmentTotal) : (installmentNumber ? parseInt(installmentNumber) : 1),
      });

      const res = isEditing
        ? await api.put<FinTitle>(`/fin-titles/${title!.id}`, payload)
        : await api.post<FinTitle>("/fin-titles", payload);

      onSaved(res.data);
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: Record<string, string[]> } };
      };
      const apiErrors = axiosErr?.response?.data?.errors;
      if (apiErrors) {
        const flat: Record<string, string> = {};
        for (const [field, msgs] of Object.entries(apiErrors)) {
          flat[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErrors(flat);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Cost-center helpers ─────────────────────────────────────────────────────
  const addCostCenter = () =>
    setCostCenters((prev) => {
      const used = prev.reduce((sum, cc) => sum + (parseFloat(cc.percentage) || 0), 0);
      const remaining = Math.max(0, 100 - used);
      return [...prev, { department_id: null, percentage: remaining > 0 ? String(remaining) : "" }];
    });

  const removeCostCenter = (idx: number) =>
    setCostCenters((prev) => prev.filter((_, i) => i !== idx));

  const updateCostCenter = (
    idx: number,
    field: keyof CostCenter,
    value: string | number | null
  ) =>
    setCostCenters((prev) =>
      prev.map((cc, i) => (i === idx ? { ...cc, [field]: value } : cc))
    );

  // ── Derived ─────────────────────────────────────────────────────────────────
  const totalInstallments = parseInt(installmentNumber) || 1;
  const typeLabel = (title?.type ?? defaultType) === "expense" ? "a Pagar" : "a Receber";
  const modalTitle = isEditing
    ? `Editar Título ${typeLabel}`
    : `Novo Título ${typeLabel}`;
  const isReadOnly = isEditing && ["paid", "partial", "cancelled", "reversed"].includes(status);
  const canSubmit = !isReadOnly && !!amount && !!issueDate && !!dueDate && !!peopleId;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
    <FinInstallmentModal
      open={showInstallmentModal}
      total={totalInstallments}
      amount={parseCurrency(amount)}
      dueDate={dueDate}
      onClose={() => setShowInstallmentModal(false)}
      onConfirm={handleInstallmentConfirm}
    />
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{modalTitle}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody>
          <Tabs defaultValue={initialTab}>
            <TabsList variant="line" className="mb-4">
              <TabsTrigger value="geral">Geral</TabsTrigger>
              <TabsTrigger value="baixar">Baixar</TabsTrigger>
              <TabsTrigger value="observacoes">Observações</TabsTrigger>
              <TabsTrigger value="arquivos">Arquivos</TabsTrigger>
              {(compositionOrigins.length > 0 || compositionDestinations.length > 0) && (
                <TabsTrigger value="composicao">Composição</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="geral" className="space-y-4 [&_input:read-only]:bg-muted/60 [&_input:disabled]:bg-muted/60 [&_button:disabled]:bg-muted/60">

            {/* Título/NF / Pessoa / Documento / N° Parcela */}
            <div className="grid grid-cols-12 gap-3">
              {/* Título / NF — 2 cols */}
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="ft-invnum">Título</Label>
                <Input
                  id="ft-invnum"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Número da NF"
                  readOnly={isReadOnly || isEditing}
                />
              </div>

              {/* Pessoa — 6 cols */}
              <div className="col-span-6 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ft-people">
                    Pessoa <span className="text-destructive">*</span>
                  </Label>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setShowCreatePeople(true)}
                      className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      title="Nova pessoa"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="ft-people"
                    value={peopleQuery}
                    onChange={(e) => {
                      if (isReadOnly) return;
                      setPeopleQuery(e.target.value);
                      setPeopleId("");
                      setShowPeopleDrop(true);
                      setHighlightedIdx(-1);
                    }}
                    onFocus={() => { if (!isReadOnly) setShowPeopleDrop(true); }}
                    onBlur={() => setTimeout(() => setShowPeopleDrop(false), 150)}
                    readOnly={isReadOnly}
                    onKeyDown={(e) => {
                      const filtered = people.filter((p) =>
                        p.name.toLowerCase().includes(peopleQuery.toLowerCase())
                      );
                      if (!showPeopleDrop || filtered.length === 0) return;
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightedIdx((prev) => {
                          const next = Math.min(prev + 1, filtered.length - 1);
                          const el = dropdownRef.current?.children[next] as HTMLElement;
                          el?.scrollIntoView({ block: "nearest" });
                          return next;
                        });
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightedIdx((prev) => {
                          const next = Math.max(prev - 1, 0);
                          const el = dropdownRef.current?.children[next] as HTMLElement;
                          el?.scrollIntoView({ block: "nearest" });
                          return next;
                        });
                      } else if (e.key === "Enter" && highlightedIdx >= 0) {
                        e.preventDefault();
                        const selected = filtered[highlightedIdx];
                        if (selected) {
                          setPeopleId(String(selected.id));
                          setPeopleQuery(selected.name);
                          setShowPeopleDrop(false);
                          setHighlightedIdx(-1);
                        }
                      } else if (e.key === "Escape") {
                        setShowPeopleDrop(false);
                        setHighlightedIdx(-1);
                      }
                    }}
                    placeholder="Digite para buscar..."
                    autoComplete="off"
                  />
                  {showPeopleDrop && peopleQuery.length > 0 && (() => {
                    const filtered = people.filter((p) =>
                      p.name.toLowerCase().includes(peopleQuery.toLowerCase())
                    );
                    return (
                      <ul ref={dropdownRef} className="absolute z-50 mt-1 w-full rounded-md border border-input bg-popover shadow-md max-h-48 overflow-y-auto">
                        {filtered.map((p, idx) => (
                          <li
                            key={p.id}
                            className={`cursor-pointer px-3 py-2 text-sm ${idx === highlightedIdx ? "bg-accent" : "hover:bg-accent"}`}
                            onMouseEnter={() => setHighlightedIdx(idx)}
                            onMouseDown={() => {
                              setPeopleId(String(p.id));
                              setPeopleQuery(p.name);
                              setShowPeopleDrop(false);
                              setHighlightedIdx(-1);
                            }}
                          >
                            {p.name}
                          </li>
                        ))}
                        {filtered.length === 0 && (
                          <li className="px-3 py-2 text-sm text-muted-foreground">
                            Nenhum resultado
                          </li>
                        )}
                      </ul>
                    );
                  })()}
                </div>
                {errors.people_id && (
                  <p className="text-xs text-destructive">{errors.people_id}</p>
                )}
              </div>

              {/* Documento — 2 cols */}
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="ft-docnum">Documento</Label>
                <Input
                  id="ft-docnum"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Número do documento"
                  readOnly={isReadOnly}
                />
              </div>

              {/* N° Parcela — 2 cols */}
              <div className="col-span-2 space-y-1.5">
                <Label>Parcela</Label>
                {isEditing ? (
                  <Input
                    value={
                      installmentNumber
                        ? `${installmentNumber}${installmentTotal ? `/${installmentTotal}` : ""}`
                        : "—"
                    }
                    readOnly
                  />
                ) : (
                  <Input
                    id="ft-inst-n"
                    type="text"
                    inputMode="numeric"
                    value={installmentNumber}
                    onChange={(e) => setInstallmentNumber(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: 1"
                    readOnly={isReadOnly}
                  />
                )}
              </div>
            </div>

            {/* Código de Barras / Chave PIX / Emissão / Vencimento / Valor */}
            <div className="grid grid-cols-12 gap-3">
              {/* Código de Barras — 3 cols */}
              <div className="col-span-3 space-y-1.5">
                <Label htmlFor="ft-barcode">Código de Barras</Label>
                <Input
                  id="ft-barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Código de barras"
                  readOnly={isReadOnly}
                />
              </div>

              {/* Chave PIX — 3 cols */}
              <div className="col-span-3 space-y-1.5">
                <Label htmlFor="ft-pix">Chave PIX</Label>
                <Input
                  id="ft-pix"
                  value={pixKey}
                  onChange={(e) => setPixKey(e.target.value)}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  readOnly={isReadOnly}
                />
              </div>

              {/* Emissão — 2 cols */}
              <div className="col-span-2 space-y-1.5">
                <Label>Emissão <span className="text-destructive">*</span></Label>
                <BirthDatePicker
                  value={issueDate}
                  onChange={setIssueDate}
                  minYear={2000}
                  maxYear={2100}
                  disabled={isReadOnly}
                />
              </div>

              {/* Vencimento — 2 cols */}
              <div className="col-span-2 space-y-1.5">
                <Label>
                  Vencimento <span className="text-destructive">*</span>
                </Label>
                <BirthDatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  minYear={2000}
                  maxYear={2100}
                  disabled={isReadOnly}
                />
                {errors.due_date && (
                  <p className="text-xs text-destructive">{errors.due_date}</p>
                )}
              </div>

              {/* Valor — 2 cols */}
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="ft-amount">
                  Valor <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                  <Input
                    id="ft-amount"
                    type="text"
                    inputMode="numeric"
                    value={amount}
                    onChange={() => {}}
                    onKeyDown={handleAmountKeyDown}
                    placeholder="0,00"
                    className="pl-9 text-right text-base font-bold caret-transparent"
                    readOnly={isReadOnly}
                  />
                </div>
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount}</p>
                )}
              </div>
            </div>

            {refLoading && (
              <p className="text-xs text-muted-foreground">Carregando dados...</p>
            )}

            {/* Centros de Custo */}
            <Card className="w-full p-0">
              <CardContent className="p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <Label className="text-sm font-medium">Centros de Custo</Label>
                  {!isReadOnly && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCostCenter}
                      disabled={costCenters.reduce((sum, cc) => sum + (parseFloat(cc.percentage) || 0), 0) >= 100}
                    >
                      <Plus className="size-3.5 mr-1" />
                      Adicionar
                    </Button>
                  )}
                </div>

                <div className="space-y-2 p-4">
                  {costCenters.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhum centro de custo adicionado.
                    </p>
                  )}

                  {costCenters.length > 0 && (
                    <div className={`grid gap-2 mb-1 pr-1 ${isReadOnly ? "grid-cols-[1fr_90px_90px]" : "grid-cols-[1fr_90px_90px_36px]"}`}>
                      <Label className="text-xs text-muted-foreground">Departamento</Label>
                      <Label className="text-xs text-muted-foreground text-right">% Rateio</Label>
                      <Label className="text-xs text-muted-foreground text-right">Valor</Label>
                      <div />
                    </div>
                  )}

                  <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
                    {costCenters.map((cc, i) => {
                      const pct = parseFloat(cc.percentage) || 0;
                      const baseAmount = parseCurrency(amount);
                      const ccValue = baseAmount * (pct / 100);
                      return (
                      <div
                        key={i}
                        className={`grid gap-2 items-center ${isReadOnly ? "grid-cols-[1fr_90px_90px]" : "grid-cols-[1fr_90px_90px_36px]"}`}
                      >
                        <div>
                          <Select
                            value={cc.department_id ? String(cc.department_id) : ""}
                            onValueChange={(v) => {
                              updateCostCenter(i, "department_id", parseInt(v));
                            }}
                            disabled={isReadOnly}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((d) => {
                                const usedByOther = costCenters.some(
                                  (other, oi) => oi !== i && other.department_id === d.id
                                );
                                return (
                                  <SelectItem key={d.id} value={String(d.id)} disabled={usedByOther}>
                                    {d.name}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="relative">
                          <Input
                            type="number"
                            step="1"
                            min="1"
                            max="100"
                            value={cc.percentage}
                            onChange={(e) =>
                              updateCostCenter(i, "percentage", e.target.value)
                            }
                            placeholder="100"
                            className="pr-6 text-right"
                            readOnly={isReadOnly}
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            %
                          </span>
                        </div>

                        <div className="text-right text-sm text-muted-foreground tabular-nums pr-1">
                          {ccValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </div>

                        {!isReadOnly && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="text-destructive border-destructive/20 hover:bg-destructive/5"
                            onClick={() => removeCostCenter(i)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      );
                    })}
                  </div>

                  {errors["cost_centers"] && (
                    <p className="text-xs text-destructive">
                      {errors["cost_centers"]}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            </TabsContent>

            <TabsContent value="baixar">
              {!isEditing ? (
                <p className="text-sm text-muted-foreground italic">Salve o título primeiro.</p>
              ) : (() => {
                const baseAmt = parseCurrency(amount);

                const payReadOnly = status !== "pending";
                const canPay     = status === "pending";
                const canReverse = ["paid", "partial"].includes(status);
                return (
                  <div className={`space-y-4${payReadOnly ? " [&_input:disabled]:bg-muted/60 [&_input:disabled]:!opacity-100 [&_input:read-only]:bg-muted/60 [&_input:read-only]:!opacity-100 [&_button:disabled]:bg-muted/60 [&_button:disabled]:!opacity-100" : ""}`}>
                    {/* Row 1 — Juros / Multa / Desconto (% + valor calculado) */}
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-2 space-y-1.5">
                        <Label>Juros</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={payInterest}
                            onChange={(e) => {
                              const masked = maskPercent(e.target.value);
                              setPayInterest(masked);
                              const val = baseAmt * parsePercent(masked) / 100;
                              setPayInterestVal(numberToMask(val));
                              setPayNetAmount(numberToMask(baseAmt + val + baseAmt * parsePercent(payMulta) / 100 - baseAmt * parsePercent(payDiscount) / 100));
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={payReadOnly}
                            className="pr-8 text-right"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Valor Juros</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                          <Input
                            value={payInterestVal || "0,00"}
                            onChange={(e) => {
                              const masked = maskCurrency(e.target.value);
                              setPayInterestVal(masked);
                              if (baseAmt > 0) setPayInterest(maskPercent(((parseCurrency(masked) / baseAmt) * 100).toFixed(4).replace(/\.?0+$/, "").replace(".", ",")));
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={payReadOnly}
                            className="pl-9 text-right"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Multa</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={payMulta}
                            onChange={(e) => {
                              const masked = maskPercent(e.target.value);
                              setPayMulta(masked);
                              const val = baseAmt * parsePercent(masked) / 100;
                              setPayMultaVal(numberToMask(val));
                              setPayNetAmount(numberToMask(baseAmt + baseAmt * parsePercent(payInterest) / 100 + val - baseAmt * parsePercent(payDiscount) / 100));
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={payReadOnly}
                            className="pr-8 text-right"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Valor Multa</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                          <Input
                            value={payMultaVal || "0,00"}
                            onChange={(e) => {
                              const masked = maskCurrency(e.target.value);
                              setPayMultaVal(masked);
                              if (baseAmt > 0) setPayMulta(maskPercent(((parseCurrency(masked) / baseAmt) * 100).toFixed(4).replace(/\.?0+$/, "").replace(".", ",")));
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={payReadOnly}
                            className="pl-9 text-right"
                          />
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Desconto</Label>
                        <div className="relative">
                          <Input
                            type="text"
                            value={payDiscount}
                            onChange={(e) => {
                              const masked = maskPercent(e.target.value);
                              setPayDiscount(masked);
                              const val = baseAmt * parsePercent(masked) / 100;
                              setPayDiscountVal(numberToMask(val));
                              setPayNetAmount(numberToMask(baseAmt + baseAmt * parsePercent(payInterest) / 100 + baseAmt * parsePercent(payMulta) / 100 - val));
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={payReadOnly}
                            className="pr-8 text-right"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
                        </div>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Valor Desconto</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                          <Input
                            value={payDiscountVal || "0,00"}
                            onChange={(e) => {
                              const masked = maskCurrency(e.target.value);
                              setPayDiscountVal(masked);
                              if (baseAmt > 0) setPayDiscount(maskPercent(((parseCurrency(masked) / baseAmt) * 100).toFixed(4).replace(/\.?0+$/, "").replace(".", ",")));
                            }}
                            onFocus={(e) => e.target.select()}
                            disabled={payReadOnly}
                            className="pl-9 text-right"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Row 2 — Banco / Conta / Modalidade / Data Baixa / Valor Líquido */}
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-3 space-y-1.5">
                        <Label>Banco <span className="text-destructive">*</span></Label>
                        <Select
                          value={payBankId}
                          onValueChange={(v) => { setPayBankId(v); setPayErrors((e) => ({ ...e, bank_id: "" })); }}
                          disabled={payReadOnly}
                        >
                          <SelectTrigger className={payErrors.bank_id ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {banks.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {payErrors.bank_id && <p className="text-xs text-destructive">{payErrors.bank_id}</p>}
                      </div>
                      <div className="col-span-3 space-y-1.5">
                        <Label>Conta Financeira <span className="text-destructive">*</span></Label>
                        <Select
                          value={payAccountId}
                          onValueChange={(v) => { setPayAccountId(v); setPayErrors((e) => ({ ...e, account_id: "" })); }}
                          disabled={payReadOnly}
                        >
                          <SelectTrigger className={payErrors.account_id ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="max-h-48 overflow-y-auto">
                            {accounts.filter((a) => a.type === ((title?.type ?? defaultType) === "income" ? "revenue" : "expense")).map((a) => (
                              <SelectItem
                                key={a.id}
                                value={String(a.id)}
                                disabled={a.nature === "synthetic"}
                                className={a.nature === "synthetic" ? "text-muted-foreground font-semibold cursor-default" : undefined}
                              >
                                {a.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {payErrors.account_id && <p className="text-xs text-destructive">{payErrors.account_id}</p>}
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Modalidade <span className="text-destructive">*</span></Label>
                        <Select
                          value={payPaymentMethodId}
                          onValueChange={(v) => { setPayPaymentMethodId(v); setPayErrors((e) => ({ ...e, payment_method_id: "" })); }}
                          disabled={payReadOnly}
                        >
                          <SelectTrigger className={payErrors.payment_method_id ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentMethods.map((pm) => (
                              <SelectItem key={pm.id} value={String(pm.id)}>{pm.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {payErrors.payment_method_id && <p className="text-xs text-destructive">{payErrors.payment_method_id}</p>}
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Data Baixa <span className="text-destructive">*</span></Label>
                        <BirthDatePicker
                          value={payPaidAt}
                          onChange={setPayPaidAt}
                          minYear={2000}
                          maxYear={2100}
                          disabled={payReadOnly}
                        />
                        {payErrors.paid_at && (
                          <p className="text-xs text-destructive">{payErrors.paid_at}</p>
                        )}
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label>Baixar <span className="text-destructive">*</span></Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">R$</span>
                          <Input
                            value={payNetAmount}
                            onChange={(e) => setPayNetAmount(maskCurrency(e.target.value))}
                            onFocus={(e) => e.target.select()}
                            disabled={payReadOnly}
                            className="pl-9 text-right font-bold"
                          />
                        </div>
                        {payErrors.amount_paid && (
                          <p className="text-xs text-destructive">{payErrors.amount_paid}</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                      {canReverse && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleReverse}
                          disabled={payLoading}
                          className="text-destructive border-destructive/30 hover:bg-destructive/5"
                        >
                          Estornar Título
                        </Button>
                      )}
                      {canPay && (
                        <Button
                          type="button"
                          variant="primary"
                          onClick={handlePay}
                          disabled={payLoading || !payPaidAt}
                        >
                          {payLoading ? "Baixando..." : "Baixar"}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="observacoes">
              <p className="text-sm text-muted-foreground italic">Em breve.</p>
            </TabsContent>

            <TabsContent value="arquivos">
              <p className="text-sm text-muted-foreground italic">Em breve.</p>
            </TabsContent>

            <TabsContent value="composicao" className="space-y-4">
              {compositionOrigins.length > 0 && (
                <CompositionTable label="Títulos originais (cancelados)" rows={compositionOrigins} />
              )}
              {compositionDestinations.length > 0 && (
                <CompositionTable label="Títulos gerados" rows={compositionDestinations} />
              )}
            </TabsContent>
          </Tabs>
          </DialogBody>

          <DialogFooter className="mt-5">
            {isEditing && (
              <Badge
                variant={STATUS_VARIANTS[status] ?? "primary"}
                appearance="light"
                className="mr-auto text-sm"
              >
                {STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status}
              </Badge>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            {!isReadOnly && (
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !canSubmit}
              >
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <PeopleModal
      open={showCreatePeople}
      person={null}
      typePeople={typePeople}
      typeContacts={[]}
      typeAddresses={[]}
      typeDocuments={[]}
      onClose={() => setShowCreatePeople(false)}
      onSaved={(saved: Person) => {
        const ref: RefPerson = { id: saved.id, name: saved.name };
        setPeople((prev) => [...prev, ref]);
        setPeopleId(String(saved.id));
        setPeopleQuery(saved.name);
        setShowCreatePeople(false);
      }}
    />
    </>
  );
}
