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
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";
import { EventType } from "./event-types-data-grid";

interface EventTypesModalProps {
  open: boolean;
  eventType: EventType | null;
  onClose: () => void;
  onSaved: (et: EventType) => void;
}

export function EventTypesModal({ open, eventType, onClose, onSaved }: EventTypesModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6b7280");
  const [allDay, setAllDay] = useState(false);
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(eventType?.name ?? "");
    setColor(eventType?.color ?? "#6b7280");
    setAllDay(eventType?.all_day ?? false);
    setActive(eventType?.active ?? true);
    setErrors({});
  }, [open, eventType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      let res;
      if (eventType) {
        res = await api.put<EventType>(`/event-types/${eventType.id}`, { name, color, all_day: allDay, active });
      } else {
        res = await api.post<EventType>("/event-types", { name, color, all_day: allDay, active });
      }
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
        setErrors(flat);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{eventType ? "Editar Tipo de Evento" : "Novo Tipo de Evento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="et-name">Nome</Label>
              <Input
                id="et-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Aniversário, Reunião..."
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="et-color">Cor</Label>
              <div className="flex items-center gap-3">
                <input
                  id="et-color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-14 cursor-pointer rounded-md border border-input p-0.5"
                />
                <span className="text-sm text-muted-foreground font-mono">{color}</span>
              </div>
              {errors.color && <p className="text-xs text-destructive">{errors.color}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="et-allday">Dia inteiro por padrão</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{allDay ? "Sim" : "Não"}</span>
                <Switch id="et-allday" checked={allDay} onCheckedChange={setAllDay} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="et-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="et-active" checked={active} onCheckedChange={setActive} />
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !name.trim()}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
