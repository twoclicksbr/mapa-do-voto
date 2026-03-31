import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertTriangleIcon, CircleCheckIcon, InfoIcon, Eye, EyeOff, CheckIcon, PlayIcon, CircleIcon, MapIcon, DatabaseIcon, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldContent, FieldDescription, FieldTitle } from "@/components/ui/field";
import { BirthDatePicker } from "@/components/people/birth-date-picker";
import {
  Timeline,
  TimelineContent,
  TimelineHeader,
  TimelineIndicator,
  TimelineItem,
  TimelineSeparator,
  TimelineTitle,
} from "@/components/reui/timeline";
import api from "@/lib/api";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  valid_until: string;
}

interface TypePeople {
  id: number;
  name: string;
}

interface Plan {
  id: number;
  name: string;
  description?: string | null;
  price_month: number;
  price_yearly: number;
  price_setup: number;
  max_users?: number | null;
  has_schema: boolean;
  recommended: boolean;
}

interface MapCandidate {
  id: number;
  name: string;
  photo_url: string | null;
}

interface MapCandidacy {
  id: number;
  ballot_name: string | null;
  role: string;
  year: number;
  number: string | null;
  status: string | null;
  party: string | null;
  party_color_bg: string | null;
  party_color_text: string | null;
  party_color_gradient: string | null;
  state_uf: string | null;
  city_name: string | null;
}

interface GabinetCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (tenant: Tenant) => void;
  existingSlugs: string[];
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^-+|-+$/g, "");
}

export function GabinetCreateModal({ open, onClose, onCreated, existingSlugs }: GabinetCreateModalProps) {
  const [step, setStep] = useState(1);

  // Step 1 — Dados Pessoais
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [typePeopleId, setTypePeopleId] = useState<string>("");
  const [active, setActive] = useState(true);
  const [typePeople, setTypePeople] = useState<TypePeople[]>([]);

  // Step 2 — Usuário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Step 3 — Gabinete + Candidato + Subdomínio
  const [gabineteName, setGabineteName] = useState("");
  const [plans,          setPlans]          = useState<Plan[]>([]);
  const [selectedPlan,   setSelectedPlan]   = useState<string>("");
  const [planPickerOpen, setPlanPickerOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<MapCandidate | null>(null);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateResults, setCandidateResults] = useState<MapCandidate[]>([]);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [candidateHighlight, setCandidateHighlight] = useState(-1);
  const candidateDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const candidateRef = useRef<HTMLDivElement>(null);
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [slugChecking, setSlugChecking] = useState(false);
  const slugDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [validUntil, setValidUntil] = useState("");

  // Step 4 — Candidatura
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [candidacies, setCandidacies] = useState<MapCandidacy[]>([]);
  const [candidaciesLoading, setCandidaciesLoading] = useState(false);
  const [selectedCandidacies, setSelectedCandidacies] = useState<MapCandidacy[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName("");
    setBirthDate("");
    setTypePeopleId("");
    setActive(true);
    setEmail("");
    setPassword("");
    setPasswordConfirmation("");
    setGabineteName("");
    setSelectedPlan("");
    setSelectedCandidate(null);
    setCandidateQuery("");
    setCandidateResults([]);
    setCandidateOpen(false);
    setSlug("");
    setSlugManual(false);
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setValidUntil(d.toISOString().split("T")[0]);
    setErrors({});
    setSubmitError(null);
    setShowPassword(false);
    setShowPasswordConfirm(false);
    setCandidacies([]);
    setSelectedCandidacies([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    api.get<TypePeople[]>("/type-people").then((res) => setTypePeople(res.data)).catch(() => {});
    api.get<Plan[]>("/plans").then((res) => {
      setPlans(res.data);
      if (res.data.length > 0) setSelectedPlan(String(res.data[0].id));
    }).catch((err) => console.error("[GabinetCreateModal] /plans error:", err));
  }, [open]);

  const slugTaken = slug.length > 0 && existingSlugs.includes(slug);
  const passwordMismatch = passwordConfirmation.length > 0 && password !== passwordConfirmation;

  const searchCandidates = useCallback((q: string) => {
    if (q.length < 2) { setCandidateResults([]); setCandidateOpen(false); return; }
    setCandidateLoading(true);
    setCandidateOpen(true);
    api.get<MapCandidate[]>("/map-candidates/search", { params: { q } })
      .then((res) => { setCandidateResults(res.data); setCandidateHighlight(-1); })
      .finally(() => setCandidateLoading(false));
  }, []);

  const handleCandidateQueryChange = (v: string) => {
    setCandidateQuery(v);
    if (candidateDebounce.current) clearTimeout(candidateDebounce.current);
    candidateDebounce.current = setTimeout(() => searchCandidates(v), 300);
  };

  const handleCandidateSelect = (c: MapCandidate) => {
    setSelectedCandidate(c);
    setCandidateOpen(false);
    setCandidateQuery("");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (candidateRef.current && !candidateRef.current.contains(e.target as Node)) {
        setCandidateOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSlugChange = (v: string) => {
    setSlugManual(true);
    const next = toSlug(v);
    setSlug(next);
    if (next.length > 0) {
      setSlugChecking(true);
      if (slugDebounce.current) clearTimeout(slugDebounce.current);
      slugDebounce.current = setTimeout(() => setSlugChecking(false), 600);
    } else {
      setSlugChecking(false);
    }
  };

  const canGoStep2 = name.trim().length > 0;
  const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const canGoStep3 = email.trim().length > 0 && passwordValid && !passwordMismatch && passwordConfirmation.length > 0;
  const canFinish = gabineteName.trim().length > 0 && selectedCandidate !== null && slug.length > 0 && !slugTaken && !slugChecking && !errors.slug && validUntil.length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Gabinete — Passo {step} de 4</DialogTitle>
        </DialogHeader>

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        {(() => {
          const steps = [
            { id: 1, label: "Dados Pessoais", desc: "Informações do titular" },
            { id: 2, label: "Acesso",          desc: "E-mail e senha" },
            { id: 3, label: "Candidato",       desc: "Vínculo e subdomínio" },
            { id: 4, label: "Candidatura",     desc: "Eleição específica" },
          ];
          return (
            <div className="px-6 pt-2 pb-4">
              <Timeline defaultValue={step} orientation="horizontal" className="w-full">
                {steps.map((s) => {
                  const status = s.id < step ? "completed" : s.id === step ? "current" : "upcoming";
                  return (
                    <TimelineItem key={s.id} step={s.id}>
                      <TimelineHeader>
                        <TimelineSeparator />
                        <TimelineIndicator
                          className={
                            status === "completed" ? "bg-emerald-500 text-white border-emerald-500" :
                            status === "current"   ? "bg-primary text-primary-foreground border-primary" :
                            "bg-muted text-muted-foreground border-input"
                          }
                        >
                          {status === "completed" ? <CheckIcon className="size-3.5" /> :
                           status === "current"   ? <PlayIcon  className="size-3"   /> :
                                                    <CircleIcon className="size-3"  />}
                        </TimelineIndicator>
                        <TimelineTitle className={status === "upcoming" ? "text-muted-foreground" : ""}>{s.label}</TimelineTitle>
                      </TimelineHeader>
                      <TimelineContent>{s.desc}</TimelineContent>
                    </TimelineItem>
                  );
                })}
              </Timeline>
            </div>
          );
        })()}

        {/* ── Step 1: Dados Pessoais ─────────────────────────────────────── */}
        {step === 1 && (
          <>
            <DialogBody className="flex flex-col py-6 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="gab-name">Nome completo <span className="text-destructive">*</span></Label>
                  <Input
                    id="gab-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome completo"
                    autoFocus
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gab-birth-date">Data de Nascimento</Label>
                  <BirthDatePicker
                    id="gab-birth-date"
                    value={birthDate}
                    onChange={setBirthDate}
                  />
                  {errors.birth_date && <p className="text-xs text-destructive">{errors.birth_date}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="gab-type">Tipo de Pessoa</Label>
                  <Select value={typePeopleId} onValueChange={setTypePeopleId}>
                    <SelectTrigger id="gab-type">
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      {typePeople.map((tp) => (
                        <SelectItem key={tp.id} value={String(tp.id)}>
                          {tp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className="col-span-2 flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer select-none"
                  onClick={() => setActive((v) => !v)}
                >
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-xs text-muted-foreground">Pessoa ativa na plataforma</p>
                  </div>
                  <Switch checked={active} onCheckedChange={setActive} onClick={(e) => e.stopPropagation()} />
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" disabled={!canGoStep2} onClick={() => setStep(2)}>
                Próximo
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 2: Usuário ────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <DialogBody className="flex flex-col py-6 gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="gab-email">E-mail <span className="text-destructive">*</span></Label>
                  <Input
                    id="gab-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@exemplo.com"
                    autoFocus
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="gab-password">Senha <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="gab-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  {(() => {
                    const metCount = [
                      password.length >= 8,
                      /[A-Z]/.test(password),
                      /[a-z]/.test(password),
                      /[0-9]/.test(password),
                      /[^A-Za-z0-9]/.test(password),
                    ].filter(Boolean).length;
                    const { color, Icon, hint } = !password
                      ? { color: "text-muted-foreground", Icon: InfoIcon,          hint: "Use 8+ caracteres, maiúscula, minúscula, número e caractere especial." }
                      : metCount === 5
                      ? { color: "text-emerald-500",      Icon: CircleCheckIcon,   hint: "Senha forte. Tudo certo!" }
                      : metCount >= 3
                      ? { color: "text-amber-500",        Icon: AlertTriangleIcon, hint: "Quase lá! Adicione os requisitos faltantes." }
                      : { color: "text-destructive",      Icon: AlertTriangleIcon, hint: "Senha fraca. Inclua maiúscula, minúscula, número e caractere especial." };
                    return (
                      <div className={`flex items-center gap-2 text-xs transition-colors duration-200 ${color}`}>
                        <Icon className="size-3.5 shrink-0" />
                        <p>{hint}</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Confirmar Senha */}
                <div className="space-y-1.5">
                  <Label htmlFor="gab-password-confirm">Confirmar Senha <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="gab-password-confirm"
                      type={showPasswordConfirm ? "text" : "password"}
                      value={passwordConfirmation}
                      onChange={(e) => setPasswordConfirmation(e.target.value)}
                      placeholder="••••••••"
                      className={`pr-9 ${passwordMismatch ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirm((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPasswordConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordMismatch && <p className="text-xs text-destructive">As senhas não conferem.</p>}
                  {!passwordMismatch && passwordConfirmation.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-emerald-500">
                      <CircleCheckIcon className="size-3.5 shrink-0" />
                      <p>Senhas conferem.</p>
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="button" variant="primary" disabled={!canGoStep3} onClick={() => setStep(3)}>
                Próximo
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 3: Gabinete + Candidato + Subdomínio ─────────────────── */}
        {step === 3 && (
          <>
            <DialogBody className="flex flex-col py-6 gap-6">
              <div className="space-y-4">

                {/* Linha 1: Nome do Gabinete + Candidato */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="gabinete-name">Nome do Gabinete <span className="text-destructive">*</span></Label>
                    <Input
                      id="gabinete-name"
                      value={gabineteName}
                      onChange={(e) => {
                        setGabineteName(e.target.value);
                        if (!slugManual) {
                          const next = toSlug(e.target.value);
                          setSlug(next);
                          if (next.length > 0) {
                            setSlugChecking(true);
                            if (slugDebounce.current) clearTimeout(slugDebounce.current);
                            slugDebounce.current = setTimeout(() => setSlugChecking(false), 600);
                          } else {
                            setSlugChecking(false);
                          }
                        }
                      }}
                      placeholder="Ex: Gabinete Neto Bota"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Candidato</Label>
                    <div ref={candidateRef} className="relative">
                      {selectedCandidate ? (
                        <div className="flex items-center gap-3 border rounded-md px-3 py-2 bg-background">
                          {selectedCandidate.photo_url ? (
                            <img src={selectedCandidate.photo_url} className="size-7 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="size-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                              {selectedCandidate.name[0].toUpperCase()}
                            </div>
                          )}
                          <span className="flex-1 text-sm font-medium capitalize truncate">{selectedCandidate.name.toLowerCase()}</span>
                          <button
                            type="button"
                            onClick={() => { setSelectedCandidate(null); if (!slugManual) setSlug(""); }}
                            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          >
                            <CheckIcon className="size-4 text-emerald-500" />
                          </button>
                        </div>
                      ) : (
                        <Input
                          value={candidateQuery}
                          onChange={(e) => handleCandidateQueryChange(e.target.value)}
                          placeholder="Digite o nome do candidato..."
                          autoComplete="off"
                          onKeyDown={(e) => {
                            if (!candidateOpen || candidateResults.length === 0) return;
                            if (e.key === "ArrowDown") {
                              e.preventDefault();
                              setCandidateHighlight((h) => Math.min(h + 1, candidateResults.length - 1));
                            } else if (e.key === "ArrowUp") {
                              e.preventDefault();
                              setCandidateHighlight((h) => Math.max(h - 1, 0));
                            } else if (e.key === "Enter" && candidateHighlight >= 0) {
                              e.preventDefault();
                              handleCandidateSelect(candidateResults[candidateHighlight]);
                            } else if (e.key === "Escape") {
                              setCandidateOpen(false);
                            }
                          }}
                        />
                      )}
                      {candidateOpen && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-md overflow-hidden">
                          {candidateLoading ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground">Buscando...</div>
                          ) : candidateResults.length === 0 ? (
                            <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum candidato encontrado.</div>
                          ) : (
                            candidateResults.map((c, idx) => (
                              <button
                                key={c.id}
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); handleCandidateSelect(c); }}
                                onMouseEnter={() => setCandidateHighlight(idx)}
                                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${idx === candidateHighlight ? "bg-muted" : "hover:bg-muted"}`}
                              >
                                {c.photo_url ? (
                                  <img src={c.photo_url} className="size-8 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="size-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                                    {c.name[0].toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm capitalize">{c.name.toLowerCase()}</span>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Linha 2: Subdomínio (2/3) + Validade (1/3) */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="slug">Subdomínio</Label>
                    <div className="flex items-center">
                      <Input
                        id="slug"
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="nomepolitico"
                        className={`rounded-r-none font-mono text-sm ${!slugChecking && slugTaken ? "border-destructive focus-visible:ring-destructive" : !slugChecking && slug.length > 0 && !slugTaken ? "border-emerald-500 focus-visible:ring-emerald-500" : ""}`}
                      />
                      <span className="h-9 px-3 flex items-center border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm font-mono whitespace-nowrap">
                        .mapadovoto.com
                      </span>
                    </div>
                    {slugChecking && slug.length > 0 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="inline-block size-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                        Verificando disponibilidade...
                      </p>
                    )}
                    {!slugChecking && slugTaken && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <CircleIcon className="size-3 shrink-0" /> Subdomínio indisponível.
                      </p>
                    )}
                    {!slugChecking && slug.length > 0 && !slugTaken && (
                      <p className="text-xs text-emerald-500 flex items-center gap-1">
                        <CircleCheckIcon className="size-3 shrink-0" /> Subdomínio disponível!
                      </p>
                    )}
                    {!slugTaken && errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
                  </div>

                  <div className="col-span-1 space-y-1.5">
                    <Label htmlFor="valid-until">Validade <span className="text-destructive">*</span></Label>
                    <BirthDatePicker
                      id="valid-until"
                      value={validUntil}
                      onChange={setValidUntil}
                      minYear={new Date().getFullYear()}
                      maxYear={new Date().getFullYear() + 10}
                    />
                  </div>
                </div>

                {/* Plano */}
                {(() => {
                  const activePlan = plans.find((p) => String(p.id) === selectedPlan);
                  const fmtBRL = (v: number) => parseFloat(String(v)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                  return (
                    <div className="space-y-1.5">
                      <Label>Plano <span className="text-destructive">*</span></Label>
                      <button
                        type="button"
                        onClick={() => setPlanPickerOpen(true)}
                        className="w-full flex items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs hover:border-muted-foreground/40 transition-colors"
                      >
                        {activePlan ? (
                          <span className="flex items-center gap-2">
                            {activePlan.has_schema ? <DatabaseIcon className="size-3.5 text-muted-foreground shrink-0" /> : <MapIcon className="size-3.5 text-muted-foreground shrink-0" />}
                            <span className="font-medium">{activePlan.name}</span>
                            {activePlan.price_month > 0 && (
                              <span className="text-muted-foreground text-xs">{fmtBRL(activePlan.price_month)}/mês</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Selecione um plano...</span>
                        )}
                        <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                      </button>

                      {/* Picker de planos */}
                      <Dialog open={planPickerOpen} onOpenChange={setPlanPickerOpen}>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Selecionar Plano</DialogTitle>
                          </DialogHeader>
                          <DialogBody>
                            <div className="grid grid-cols-2 gap-3">
                              {plans.map((plan) => {
                                const Icon = plan.has_schema ? DatabaseIcon : MapIcon;
                                const val = String(plan.id);
                                const isSelected = selectedPlan === val;
                                return (
                                  <button
                                    key={plan.id}
                                    type="button"
                                    onClick={() => { setSelectedPlan(val); setPlanPickerOpen(false); }}
                                    className={`relative flex items-start gap-3 rounded-lg border px-4 py-3 text-left cursor-pointer transition-colors w-full ${
                                      isSelected ? "border-primary bg-primary/5" : "border-input hover:border-muted-foreground/40"
                                    }`}
                                  >
                                    {plan.recommended && (
                                      <span className="absolute top-2 right-2 text-[10px] font-semibold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                                        Recomendado
                                      </span>
                                    )}
                                    {isSelected && <CheckIcon className="absolute bottom-2 right-2 size-3.5 text-primary" />}
                                    <Icon className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="space-y-0.5 min-w-0">
                                      <p className="text-sm font-medium leading-none">{plan.name}</p>
                                      {plan.description && (
                                        <p className="text-xs text-muted-foreground whitespace-pre-line">{plan.description}</p>
                                      )}
                                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                                        {plan.price_setup > 0 && (
                                          <p className="text-xs text-muted-foreground">Setup: <span className="font-semibold text-foreground">{fmtBRL(plan.price_setup)}</span></p>
                                        )}
                                        {plan.price_month > 0 && (
                                          <p className="text-xs text-muted-foreground">Mensal: <span className="font-semibold text-foreground">{fmtBRL(plan.price_month)}</span></p>
                                        )}
                                        {plan.max_users != null && (
                                          <p className="text-xs text-muted-foreground">Até <span className="font-semibold text-foreground">{plan.max_users}</span> usuário{Number(plan.max_users) !== 1 ? "s" : ""}</p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </DialogBody>
                        </DialogContent>
                      </Dialog>
                    </div>
                  );
                })()}

              </div>
            </DialogBody>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={!canFinish}
                onClick={() => {
                  if (!selectedCandidate) return;
                  setCandidaciesLoading(true);
                  api.get<MapCandidacy[]>(`/map-candidates/${selectedCandidate.id}/candidacies`)
                    .then((res) => setCandidacies(res.data))
                    .finally(() => { setCandidaciesLoading(false); setSelectedCandidacies([]); setStep(4); });
                }}
              >
                Próximo
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Step 4: Candidatura ───────────────────────────────────────── */}
        {step === 4 && (
          <>
            <DialogBody className="flex flex-col py-6 gap-4">
              {candidaciesLoading ? (
                <div className="flex items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
                  <span className="inline-block size-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                  Carregando candidaturas...
                </div>
              ) : candidacies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-sm text-muted-foreground">
                  <CircleIcon className="size-8 opacity-30" />
                  Nenhuma candidatura encontrada para este candidato.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {candidacies.map((cy) => {
                    const isSelected = selectedCandidacies.some((c) => c.id === cy.id);
                    const location = cy.city_name
                      ? `${cy.city_name} · ${cy.state_uf}`
                      : cy.state_uf ?? "";
                    return (
                      <button
                        key={cy.id}
                        type="button"
                        onClick={() => setSelectedCandidacies((prev) =>
                          isSelected ? prev.filter((c) => c.id !== cy.id) : [...prev, cy]
                        )}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-input hover:border-muted-foreground/40 hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {cy.ballot_name ?? selectedCandidate?.name.toLowerCase()}
                            </span>
                            {cy.party && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded font-bold text-white"
                                style={cy.party_color_gradient
                                  ? { background: cy.party_color_gradient }
                                  : { backgroundColor: cy.party_color_bg ?? "#e5e7eb", color: cy.party_color_text ?? "#111" }
                                }
                              >
                                {cy.party}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {cy.role} · {cy.year}{cy.number ? ` · Nº ${cy.number}` : ""}{location ? ` · ${location}` : ""}
                          </div>
                        </div>
                        {cy.status && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${
                            cy.status === "ELEITO" || cy.status === "ELEITO POR QP" || cy.status === "ELEITO POR MÉDIA" || cy.status === "2º TURNO" ? "bg-emerald-100 text-emerald-700" :
                            cy.status === "SUPLENTE" ? "bg-yellow-100 text-yellow-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {cy.status}
                          </span>
                        )}
                        {isSelected && <CheckIcon className="size-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </DialogBody>

            {submitError && (
              <div className="px-6 pb-2">
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertTriangleIcon className="size-3.5 shrink-0" />
                  {submitError}
                </div>
              </div>
            )}

            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => setStep(3)}>
                Voltar
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={selectedCandidacies.length === 0 || submitting}
                onClick={async () => {
                  setSubmitting(true);
                  setErrors({});
                  setSubmitError(null);
                  let personId: number | null = null;
                  try {
                    // 1. Criar person
                    const personRes = await api.post("/people", {
                      name: name,
                      birth_date: birthDate || null,
                      type_people_id: typePeopleId ? Number(typePeopleId) : null,
                      active,
                    });
                    personId = personRes.data.id;

                    // 2. Criar user
                    await api.post(`/people/${personId}/user`, {
                      email,
                      password,
                      password_confirmation: passwordConfirmation,
                    });

                    // 3. Criar tenant (já linka person via people_id)
                    const tenantRes = await api.post("/tenants", {
                      name: gabineteName,
                      slug,
                      has_schema: plans.find((p) => String(p.id) === selectedPlan)?.has_schema ?? false,
                      plan_id: selectedPlan ? Number(selectedPlan) : null,
                      active: true,
                      valid_until: validUntil,
                      people_id: personId,
                    });

                    // 4. Vincular candidaturas
                    await api.post(`/people/${personId}/candidacies`, {
                      candidacy_ids: selectedCandidacies.map((c) => c.id),
                    });

                    personId = null; // criação concluída — não deletar no catch
                    onCreated(tenantRes.data);
                    onClose();
                  } catch (err: unknown) {
                    // Limpa person órfão se criado antes do erro
                    if (personId) {
                      api.delete(`/people/${personId}`).catch(() => {});
                      personId = null;
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const res = (err as any)?.response;
                    const data = res?.data;
                    const status: number | undefined = res?.status;
                    console.error("[GabinetCreateModal] submit error:", err);
                    console.log("[GabinetCreateModal] response data:", JSON.stringify(data));
                    if (data?.errors && typeof data.errors === "object") {
                      const flat: Record<string, string> = {};
                      for (const [field, msgs] of Object.entries(data.errors as Record<string, unknown>)) {
                        flat[field] = Array.isArray(msgs) ? String(msgs[0]) : String(msgs);
                      }
                      setErrors(flat);
                      const firstMsg = Object.values(flat)[0];
                      setSubmitError(firstMsg ?? "Erro de validação.");
                      // Voltar para o step correto se o erro for de e-mail ou senha
                      if (flat.email || flat.password) setStep(2);
                    } else if (typeof data?.message === "string") {
                      setSubmitError(data.message);
                    } else if (status) {
                      setSubmitError(`Erro HTTP ${status}.`);
                    } else {
                      setSubmitError("Erro de conexão.");
                    }
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? "Criando..." : "Criar Gabinete"}
              </Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
