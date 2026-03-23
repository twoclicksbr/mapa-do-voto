import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogBody,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FinTitle } from "./fin-titles-data-grid";

interface FinCompositionModalProps {
  open: boolean;
  titles: FinTitle[];
  onClose: () => void;
  onConfirm: (titles: FinTitle[], quantity: number, interval: number, firstDueDate: string) => Promise<void>;
}

function fmtBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function fmtDate(raw: string): string {
  const [year, month, day] = raw.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function TableGrid({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{label}</p>
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[222px] overflow-y-auto overflow-x-hidden">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Título</th>
                <th className="px-4 py-2 text-left font-medium text-muted-foreground">Vencimento</th>
                <th className="px-4 py-2 text-right font-medium text-muted-foreground">Valor</th>
              </tr>
            </thead>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
}

export function FinCompositionModal({ open, titles, onClose, onConfirm }: FinCompositionModalProps) {
  const [loading, setLoading]         = useState(false);
  const [quantity, setQuantity]       = useState(2);
  const [interval, setInterval]       = useState(30);
  const [firstDueDate, setFirstDueDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuantity(titles.length > 1 ? 1 : 2);
    setInterval(30);
    setFirstDueDate(titles[0]?.due_date ?? "");
  }, [open, titles]);

  const total = titles.reduce((sum, t) => sum + t.amount, 0);

  const preview = useMemo(() => {
    const base      = Math.floor((total / quantity) * 100) / 100;
    const remainder = Math.round((total - base * quantity) * 100) / 100;
    return Array.from({ length: quantity }, (_, i) => ({
      label:   `Parcela ${i + 1}/${quantity}`,
      dueDate: firstDueDate ? addDays(firstDueDate, i * interval) : "",
      amount:  i === quantity - 1 ? base + remainder : base,
    }));
  }, [total, quantity, interval, firstDueDate]);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(titles, quantity, interval, firstDueDate);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Composição de Títulos</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">

          {/* Linha 1: quantidade */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium whitespace-nowrap">Gerar quantos registros?</label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24"
            />
          </div>

          {/* Linha 2: intervalo + vencimento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Intervalo entre parcelas</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  value={interval}
                  onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">dias</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Vencimento da 1ª parcela</label>
              <Input
                type="date"
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Títulos selecionados */}
          <TableGrid label="Títulos selecionados">
            <tbody className="divide-y">
              {titles.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-mono text-muted-foreground">
                    {t.invoice_number ?? `#${String(t.id).padStart(5, "0")}`}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="secondary" appearance="light" className="tabular-nums font-normal">
                      {fmtDate(t.due_date)}
                    </Badge>
                  </td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    {fmtBRL(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-muted/50">
              <tr>
                <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-right text-muted-foreground">Total</td>
                <td className="px-4 py-2 text-right font-bold tabular-nums">{fmtBRL(total)}</td>
              </tr>
            </tfoot>
          </TableGrid>

          {/* Preview — registros a gerar */}
          <TableGrid label="Registros a gerar">
            <tbody className="divide-y">
              {preview.map((p, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 text-muted-foreground">{p.label}</td>
                  <td className="px-4 py-2">
                    {p.dueDate && (
                      <Badge variant="secondary" appearance="light" className="tabular-nums font-normal">
                        {fmtDate(p.dueDate)}
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-medium tabular-nums">
                    {fmtBRL(p.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t bg-muted/50">
              <tr>
                <td colSpan={2} className="px-4 py-2 text-sm font-semibold text-right text-muted-foreground">Total</td>
                <td className="px-4 py-2 text-right font-bold tabular-nums">{fmtBRL(total)}</td>
              </tr>
            </tfoot>
          </TableGrid>

        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading ? "Salvando..." : `Gerar ${quantity} ${quantity === 1 ? "título" : "títulos"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
