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
import { CandidateSearch, Candidate } from "@/components/map/candidate-search";

interface Tenant {
  id: number;
  name: string;
  slug: string;
  active: boolean;
  valid_until: string;
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

export function GabinetCreateModal({ open, onClose, existingSlugs }: GabinetCreateModalProps) {
  const [step, setStep] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setSelectedCandidate(null);
    setSlug("");
    setSlugManual(false);
    setErrors({});
  }, [open]);

  const slugTaken = slug.length > 0 && existingSlugs.includes(slug);

  const handleCandidateSelect = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    if (!slugManual) {
      setSlug(toSlug(candidate.ballot_name ?? candidate.name));
    }
  };

  const handleCandidateClear = () => {
    setSelectedCandidate(null);
    if (!slugManual) setSlug("");
  };

  const handleSlugChange = (v: string) => {
    setSlugManual(true);
    setSlug(toSlug(v));
  };

  const canProceed = selectedCandidate !== null && slug.length > 0 && !slugTaken;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Gabinete — Passo {step} de 2</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <>
            <DialogBody className="flex flex-col items-center justify-center py-10 gap-3">
              <span className="text-4xl">🚧</span>
              <p className="text-muted-foreground text-sm">Em breve</p>
            </DialogBody>
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" variant="primary" onClick={() => setStep(2)}>
                Próximo
              </Button>
            </DialogFooter>
          </>
        )}

        {step === 2 && (
          <>
            <DialogBody className="space-y-4">
              <div className="space-y-1.5">
                <Label>Candidato</Label>
                <CandidateSearch
                  variant="modal"
                  onSelect={handleCandidateSelect}
                  onClear={handleCandidateClear}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Subdomínio</Label>
                <div className="flex items-center gap-0">
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="nomepolitico"
                    className={`rounded-r-none font-mono text-sm ${slugTaken ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <span className="h-9 px-3 flex items-center border border-l-0 rounded-r-md bg-muted text-muted-foreground text-sm font-mono whitespace-nowrap">
                    .mapadovoto.com
                  </span>
                </div>
                {slugTaken && <p className="text-xs text-destructive">Este subdomínio já está em uso.</p>}
                {!slugTaken && errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
              </div>
            </DialogBody>
            <DialogFooter className="mt-5">
              <Button type="button" variant="outline" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="button" variant="primary" disabled={!canProceed}>
                Próximo
              </Button>
            </DialogFooter>
          </>
        )}

      </DialogContent>
    </Dialog>
  );
}
