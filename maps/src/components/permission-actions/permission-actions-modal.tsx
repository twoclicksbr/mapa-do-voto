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
import api from "@/lib/api";
import { PermissionAction } from "./permission-actions-data-grid";

interface PermissionActionsModalProps {
  open: boolean;
  permissionAction: PermissionAction | null;
  onClose: () => void;
  onSaved: (pa: PermissionAction) => void;
}

export function PermissionActionsModal({ open, permissionAction, onClose, onSaved }: PermissionActionsModalProps) {
  const [module, setModule] = useState("");
  const [nameModule, setNameModule] = useState("");
  const [action, setAction] = useState("");
  const [nameAction, setNameAction] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setModule(permissionAction?.module ?? "");
    setNameModule(permissionAction?.name_module ?? "");
    setAction(permissionAction?.action ?? "");
    setNameAction(permissionAction?.name_action ?? "");
    setDescription(permissionAction?.description ?? "");
    setErrors({});
  }, [open, permissionAction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const payload = {
        module,
        name_module: nameModule || null,
        action,
        name_action: nameAction || null,
        description: description || null,
      };
      let res;
      if (permissionAction && permissionAction.id > 0) {
        res = await api.put<PermissionAction>(`/permission-actions/${permissionAction.id}`, payload);
      } else {
        res = await api.post<PermissionAction>("/permission-actions", payload);
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{permissionAction && permissionAction.id > 0 ? "Editar Permissão" : "Nova Permissão"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pa-module">Módulo <span className="text-muted-foreground text-xs">(chave)</span></Label>
                <Input
                  id="pa-module"
                  value={module}
                  onChange={(e) => setModule(e.target.value)}
                  placeholder="Ex: attendances"
                  autoFocus
                />
                {errors.module && <p className="text-xs text-destructive">{errors.module}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pa-name-module">Nome do Módulo</Label>
                <Input
                  id="pa-name-module"
                  value={nameModule}
                  onChange={(e) => setNameModule(e.target.value)}
                  placeholder="Ex: Atendimentos"
                />
                {errors.name_module && <p className="text-xs text-destructive">{errors.name_module}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pa-action">Ação <span className="text-muted-foreground text-xs">(chave)</span></Label>
                <Input
                  id="pa-action"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Ex: create"
                />
                {errors.action && <p className="text-xs text-destructive">{errors.action}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pa-name-action">Nome da Ação</Label>
                <Input
                  id="pa-name-action"
                  value={nameAction}
                  onChange={(e) => setNameAction(e.target.value)}
                  placeholder="Ex: Criar"
                />
                {errors.name_action && <p className="text-xs text-destructive">{errors.name_action}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pa-description">Descrição <span className="text-muted-foreground text-xs">(opcional)</span></Label>
              <Input
                id="pa-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da permissão..."
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>
          </DialogBody>
          <DialogFooter className="mt-5">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading || !module.trim() || !action.trim()}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
