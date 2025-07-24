import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Wand2, Key } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/idea-mining-hero.jpg";
import { RunwareService } from "@/services/runware";

interface AdPreviewProps {
  topText: string;
  imageUrl: string;
  bottomText: string;
}

const AdPreview = ({ topText, imageUrl, bottomText }: AdPreviewProps) => (
  <Card className="bg-gradient-card border-border shadow-card overflow-hidden">
    <div className="p-8 space-y-6">
      {/* Top Text */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
          {topText || "Sua frase principal aqui"}
        </h2>
      </div>
      
      {/* Image */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-lg blur-xl transition-opacity group-hover:opacity-30"></div>
        <img 
          src={imageUrl || heroImage}
          alt="Imagem do anúncio"
          className="relative w-full h-64 object-cover rounded-lg border border-border/50"
        />
      </div>
      
      {/* Bottom Text */}
      <div className="text-center space-y-3">
        <p className="text-muted-foreground leading-relaxed">
          {bottomText || "Sua descrição detalhada aqui"}
        </p>
        <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow">
          Começar Agora
        </Button>
      </div>
    </div>
  </Card>
);

export default function AdCreator() {
  const [topText, setTopText] = useState("🔥 Descubra o Minerador de Ideias que Revoluciona Negócios Digitais");
  const [bottomText, setBottomText] = useState("Transforme insights em oportunidades de ouro. Nossa plataforma usa IA avançada para extrair ideias lucrativas do mercado digital. Pare de procurar - comece a encontrar!");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState("");

  const generateCustomImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Digite uma descrição para a imagem");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Digite sua chave da API do Runware");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const runwareService = new RunwareService(apiKey);
      const result = await runwareService.generateImage({
        positivePrompt: imagePrompt,
        model: "runware:100@1",
        numberResults: 1,
        outputFormat: "WEBP"
      });
      
      setGeneratedImageUrl(result.imageURL);
      toast.success("Imagem gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast.error("Erro ao gerar imagem. Verifique sua chave da API.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadAd = () => {
    toast.success("Funcionalidade de download será implementada");
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Criador de Anúncios
          </h1>
          <p className="text-muted-foreground text-lg">
            Crie anúncios impactantes para seu minerador de ideias de negócios digitais
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls */}
          <Card className="bg-gradient-card border-border shadow-card">
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topText" className="text-foreground font-medium">
                  Frase Principal (Topo)
                </Label>
                <Input
                  id="topText"
                  value={topText}
                  onChange={(e) => setTopText(e.target.value)}
                  placeholder="Digite a frase principal..."
                  className="bg-background/50 border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-foreground font-medium">
                  Chave da API Runware
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Digite sua chave da API..."
                    className="bg-background/50 border-border"
                  />
                  <Button 
                    onClick={() => window.open('https://runware.ai/', '_blank')}
                    size="icon"
                    variant="outline"
                    className="border-border"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Obtenha sua chave em runware.ai
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customImage" className="text-foreground font-medium">
                  Descrição para Imagem Personalizada
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="customImage"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="Descreva a imagem que deseja gerar..."
                    className="bg-background/50 border-border"
                  />
                  <Button 
                    onClick={generateCustomImage}
                    disabled={isGeneratingImage || !apiKey.trim()}
                    size="icon"
                    className="bg-gradient-primary hover:opacity-90"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bottomText" className="text-foreground font-medium">
                  Descrição (Parte Inferior)
                </Label>
                <Textarea
                  id="bottomText"
                  value={bottomText}
                  onChange={(e) => setBottomText(e.target.value)}
                  placeholder="Digite a descrição detalhada..."
                  rows={4}
                  className="bg-background/50 border-border resize-none"
                />
              </div>

              <Button 
                onClick={downloadAd}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar Anúncio
              </Button>
            </div>
          </Card>

          {/* Preview */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Preview do Anúncio</h3>
            <AdPreview 
              topText={topText}
              imageUrl={generatedImageUrl || heroImage}
              bottomText={bottomText}
            />
          </div>
        </div>
      </div>
    </div>
  );
}