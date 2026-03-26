import { useState, useEffect } from "react";
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
import { BirthDatePicker } from "@/components/people/birth-date-picker";

export interface InstallmentConfig {
  divide: boolean;
  intervalDays: number;
  firstDueDate: string;
}

interface FinInstallmentModalProps {
  open: boolean;
  total: number;
  amount: number;
  dueDate: string;
  onClose: () => void;
  onConfirm: (config: InstallmentConfig) => void;
}

function fmtBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function fmtDate(raw: string): string {
  const [year, month, day] = raw.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function FinInstallmentModal({
  open,
  total,
  amount,
  dueDate,
  onClose,
  onConfirm,
}: FinInstallmentModalProps) {
  const [divide, setDivide] = useState(true);
  const [intervalDays, setIntervalDays] = useState(30);
  const [firstDueDate, setFirstDueDate] = useState(dueDate);

  useEffect(() => {
    if (open) {
      setDivide(true);
      setIntervalDays(30);
      setFirstDueDate(dueDate);
    }
  }, [open, dueDate]);

  const perInstallment = divide ? amount / total : amount;

  const preview = Array.from({ length: total }, (_, i) => ({
    n: i + 1,
    dueDate: addDays(firstDueDate, i * intervalDays),
    amount: perInstallment,
  }));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Configurar Parcelamento</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Resumo */}
          <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Valor total: </span>
              <span className="font-semibold">{fmtBRL(amount)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Parcelas: </span>
              <span className="font-semibold">{total}x</span>
            </div>
          </div>

          {/* Dividir ou repetir */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDivide(true)}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  divide
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input hover:bg-accent"
                }`}
              >
                <div className="font-medium">Dividir o Valor</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Cada parcela = {fmtBRL(amount / total)}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDivide(false)}
                className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                  !divide
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-input hover:bg-accent"
                }`}
              >
                <div className="font-medium">Repetir o Valor</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Cada parcela = {fmtBRL(amount)}
                </div>
              </button>
            </div>
          </div>

          {/* Intervalo e 1ª data */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Intervalo entre parcelas</Label>
              <div className="relative">
                <Input
                  type="number"
                  min={1}
                  value={intervalDays}
                  onChange={(e) =>
                    setIntervalDays(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  dias
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vencimento da 1ª parcela</Label>
              <BirthDatePicker
                value={firstDueDate}
                onChange={setFirstDueDate}
                minYear={2000}
                maxYear={2100}
              />
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-1.5">
            <Label>Prévia</Label>
            <div className="rounded-lg border divide-y max-h-48 overflow-y-auto text-sm">
              {preview.map((p) => (
                <div
                  key={p.n}
                  className="flex items-center justify-between px-3 py-1.5"
                >
                  <span className="text-muted-foreground font-mono w-24">
                    Parcela {p.n}/{total}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {fmtDate(p.dueDate)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {fmtBRL(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="mt-5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => onConfirm({ divide, intervalDays, firstDueDate })}
          >
            Gerar {total} títulos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
