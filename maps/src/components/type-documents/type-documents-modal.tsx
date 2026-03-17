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
import { TypeDocument } from "./type-documents-data-grid";

interface TypeDocumentsModalProps {
  open: boolean;
  typeDocument: TypeDocument | null;
  onClose: () => void;
  onSaved: (td: TypeDocument) => void;
}

export function TypeDocumentsModal({ open, typeDocument, onClose, onSaved }: TypeDocumentsModalProps) {
  const [name, setName] = useState("");
  const [mask, setMask] = useState("");
  const [validity, setValidity] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setName(typeDocument?.name ?? "");
    setMask(typeDocument?.mask ?? "");
    setValidity(typeDocument?.validity ?? "");
    setActive(typeDocument?.active ?? true);
    setErrors({});
  }, [open, typeDocument]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      let res;
      if (typeDocument) {
        res = await api.put<TypeDocument>(`/type-documents/${typeDocument.id}`, { name, mask: mask || null, validity: validity || null, active });
      } else {
        res = await api.post<TypeDocument>("/type-documents", { name, mask: mask || null, validity: validity || null, active });
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
          <DialogTitle>{typeDocument ? "Editar Tipo de Documento" : "Novo Tipo de Documento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="td-name">Nome</Label>
              <Input
                id="td-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: CPF, RG, CNH..."
                autoFocus
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="td-mask">Máscara</Label>
              <Input
                id="td-mask"
                value={mask}
                onChange={(e) => setMask(e.target.value)}
                placeholder="Ex: 999.999.999-99"
              />
              {errors.mask && <p className="text-xs text-destructive">{errors.mask}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="td-validity">Validade</Label>
              <Input
                id="td-validity"
                type="date"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
              />
              {errors.validity && <p className="text-xs text-destructive">{errors.validity}</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="td-active">Status</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                <Switch id="td-active" checked={active} onCheckedChange={setActive} />
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
