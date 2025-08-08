import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface PromptAssistantProps {
  reinforce: boolean;
  onToggleReinforce: (value: boolean) => void;
}

const TEMPLATES = [
  {
    id: "odontologia",
    name: "Clínica Odontológica",
    headline: "Sorriso novo em 7 dias",
    cta: "Agende sua avaliação",
    description:
      "Close-up de um sorriso branco e saudável em ambiente clínico moderno, luz suave, estética premium."
  },
  {
    id: "fitness",
    name: "Academia / Fitness",
    headline: "Queime gordura sem perder músculo",
    cta: "Comece hoje",
    description:
      "Pessoa treinando com halteres, iluminação dramática, tons escuros com toques neon, energia e foco."
  },
  {
    id: "curso",
    name: "Curso Online",
    headline: "Domine IA do zero ao avançado",
    cta: "Inscreva-se agora",
    description:
      "Notebook aberto com gráficos e código, mesa minimalista, paleta clara, look profissional e tecnológico."
  },
  {
    id: "restaurante",
    name: "Restaurante / Delivery",
    headline: "Burger artesanal suculento",
    cta: "Peça já",
    description:
      "Hambúrguer com queijo derretendo e pão brioche, fundo de cozinha rústica, iluminação apetitosa."
  },
  {
    id: "moda",
    name: "E-commerce de Moda",
    headline: "Estilo premium sem pagar caro",
    cta: "Compre agora",
    description:
      "Modelo em estúdio minimalista com roupa tendência, luz difusa, contraste suave, fotografia editorial."
  }
];

function wordCount(text: string) {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}

export default function PromptAssistant({ reinforce, onToggleReinforce }: PromptAssistantProps) {
  const [templateId, setTemplateId] = useState<string>("odontologia");
  const [headline, setHeadline] = useState<string>(TEMPLATES[0].headline);
  const [cta, setCta] = useState<string>(TEMPLATES[0].cta);
  const [description, setDescription] = useState<string>(TEMPLATES[0].description);

  const maxHeadlineWords = 8;
  const maxCtaWords = 5;

  const headlineWords = wordCount(headline);
  const ctaWords = wordCount(cta);

  const applyTemplate = (id: string) => {
    const tpl = TEMPLATES.find(t => t.id === id);
    if (!tpl) return;
    setTemplateId(id);
    setHeadline(tpl.headline);
    setCta(tpl.cta);
    setDescription(tpl.description);
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle>🧠 Assistente de Prompt (Anúncios)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <Label>Modelo rápido por nicho</Label>
            <Select value={templateId} onValueChange={(v) => applyTemplate(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um nicho" />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATES.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 grid gap-4">
            <div className="space-y-2">
              <Label>Headline (máx. {maxHeadlineWords} palavras)</Label>
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} />
              <p className={`text-xs ${headlineWords > maxHeadlineWords ? 'text-destructive' : 'text-muted-foreground'}`}>
                {headlineWords}/{maxHeadlineWords} palavras
              </p>
            </div>
            <div className="space-y-2">
              <Label>Call to Action (máx. {maxCtaWords} palavras)</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} />
              <p className={`text-xs ${ctaWords > maxCtaWords ? 'text-destructive' : 'text-muted-foreground'}`}>
                {ctaWords}/{maxCtaWords} palavras
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Descrição visual (opcional, para orientar o estilo)</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-24" />
          <p className="text-xs text-muted-foreground">
            Dica: mantenha a headline curta e impactante; CTA direto. Evite símbolos complexos. Pt-BR.
          </p>
        </div>

        <div className="flex items-center justify-between rounded-md border border-border p-3">
          <div>
            <p className="font-medium">Reforçar texto na próxima geração</p>
            <p className="text-xs text-muted-foreground">Adiciona instruções fortes para renderizar exatamente a headline e o CTA dentro da imagem.</p>
          </div>
          <Switch checked={reinforce} onCheckedChange={onToggleReinforce} />
        </div>

        <div className="text-xs text-muted-foreground">
          Presets bloqueados: 1024x1024 • Qualidade HD • Estilo Vivid • Texto centralizado
        </div>
      </CardContent>
    </Card>
  );
}
