import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export interface PromptDraft {
  id: string;
  headline: string;
  description: string;
  cta: string;
}

interface PromptReviewDialogProps {
  open: boolean;
  drafts: PromptDraft[];
  reinforce: boolean;
  onToggleReinforce: (v: boolean) => void;
  onClose: () => void;
  onConfirm: (drafts: PromptDraft[]) => void;
}

function wordCount(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export default function PromptReviewDialog({ open, drafts, onClose, onConfirm, reinforce, onToggleReinforce }: PromptReviewDialogProps) {
  const [localDrafts, setLocalDrafts] = useState<PromptDraft[]>(drafts);

  useEffect(() => {
    setLocalDrafts(drafts);
  }, [drafts]);

  const maxHeadline = 8;
  const maxCTA = 5;

  const isValid = useMemo(() => {
    return localDrafts.every(d => wordCount(d.headline) <= maxHeadline && wordCount(d.cta) <= maxCTA && !!d.description.trim());
  }, [localDrafts]);

  const updateDraft = (idx: number, patch: Partial<PromptDraft>) => {
    setLocalDrafts(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d));
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>🔎 Revisar prompts gerados</DialogTitle>
          <DialogDescription>
            Edite headline, conceito visual e CTA. Depois clique em "Gerar Imagens" para produzir todas de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {localDrafts.map((d, idx) => {
            const headlineWords = wordCount(d.headline);
            const ctaWords = wordCount(d.cta);
            return (
              <div key={d.id} className="rounded-lg border border-border p-4 bg-secondary/20 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Rascunho #{idx + 1}</p>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Headline (máx. {maxHeadline} palavras)</Label>
                    <Input value={d.headline} onChange={(e) => updateDraft(idx, { headline: e.target.value })} />
                    <p className={`text-xs ${headlineWords > maxHeadline ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {headlineWords}/{maxHeadline} palavras
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>CTA (máx. {maxCTA} palavras)</Label>
                    <Input value={d.cta} onChange={(e) => updateDraft(idx, { cta: e.target.value })} />
                    <p className={`text-xs ${ctaWords > maxCTA ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {ctaWords}/{maxCTA} palavras
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Descrição visual</Label>
                  <Textarea value={d.description} onChange={(e) => updateDraft(idx, { description: e.target.value })} className="min-h-24" />
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="font-medium">Reforçar texto na geração</p>
              <p className="text-xs text-muted-foreground">Instruções extras para renderizar exatamente a headline e o CTA dentro da imagem.</p>
            </div>
            <Switch checked={reinforce} onCheckedChange={onToggleReinforce} />
          </div>

          <p className="text-xs text-muted-foreground">Presets: 1024x1024 • Qualidade HD • Estilo Vivid • Texto centralizado</p>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button className="bg-gradient-primary hover:opacity-90" onClick={() => onConfirm(localDrafts)} disabled={!isValid}>
              🎨 Gerar Imagens
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
