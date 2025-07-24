import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Wand2, Key, FileText, Brain, Zap } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/idea-mining-hero.jpg";
import { OpenAIService, type BusinessAnalysis, type AdPromptElements, type MultipleAdOptions } from "@/services/openai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

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
  const [textPosition, setTextPosition] = useState("center");
  const [includeTextInImage, setIncludeTextInImage] = useState(true);
  
  // Document analysis state
  const [documentText, setDocumentText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [businessAnalysis, setBusinessAnalysis] = useState<BusinessAnalysis | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<AdPromptElements | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  // Multiple options state
  const [multipleOptions, setMultipleOptions] = useState<MultipleAdOptions | null>(null);
  const [isGeneratingOptions, setIsGeneratingOptions] = useState(false);
  const [selectedTopPhrase, setSelectedTopPhrase] = useState<string>("");
  const [selectedImageDescription, setSelectedImageDescription] = useState<string>("");
  const [selectedBottomCTA, setSelectedBottomCTA] = useState<string>("");

  const analyzeDocument = async () => {
    if (!documentText.trim()) {
      toast.error("Por favor, insira o texto do documento para análise");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua chave da API OpenAI");
      return;
    }

    setIsAnalyzing(true);
    try {
      const openaiService = new OpenAIService(apiKey);
      const analysis = await openaiService.analyzeBusinessDocument(documentText);
      setBusinessAnalysis(analysis);
      setShowAnalysis(true);
      toast.success("Documento analisado com sucesso!");
    } catch (error) {
      console.error("Erro ao analisar documento:", error);
      toast.error("Erro ao analisar documento. Verifique sua chave API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCompleteAd = async () => {
    if (!businessAnalysis) {
      toast.error("Primeiro analise um documento");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua chave da API OpenAI");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const openaiService = new OpenAIService(apiKey);
      
      // Generate the ad prompt elements
      const promptElements = await openaiService.generateAdPrompt(businessAnalysis);
      setGeneratedPrompt(promptElements);
      
      // Auto-fill the form fields
      setTopText(promptElements.topPhrase);
      setBottomText(promptElements.bottomCTA);
      setImagePrompt(promptElements.imageDescription);
      setIncludeTextInImage(true);
      
      // Generate the image with the complete prompt
      const imageResult = await openaiService.generateImage({
        prompt: promptElements.completePrompt,
        mainText: promptElements.topPhrase,
        subText: promptElements.bottomCTA,
        textPosition: textPosition as any,
        size: "1024x1024",
        quality: "hd",
        style: "vivid"
      });
      
      setGeneratedImageUrl(imageResult.url);
      toast.success("Anúncio completo gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar anúncio completo:", error);
      toast.error("Erro ao gerar anúncio. Tente novamente.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateCustomImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("Digite uma descrição para a imagem");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Digite sua chave da API do OpenAI");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const openaiService = new OpenAIService(apiKey);
      const result = await openaiService.generateImage({
        prompt: imagePrompt,
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
        textPosition: textPosition as any,
        mainText: includeTextInImage ? topText : undefined,
        subText: includeTextInImage ? (bottomText.length > 100 ? bottomText.slice(0, 100) + "..." : bottomText) : undefined,
      });
      
      setGeneratedImageUrl(result.url);
      toast.success("Imagem gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast.error("Erro ao gerar imagem. Verifique sua chave da API.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateMultipleOptions = async () => {
    if (!businessAnalysis) {
      toast.error("Primeiro analise um documento");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua chave da API OpenAI");
      return;
    }

    setIsGeneratingOptions(true);
    try {
      const openaiService = new OpenAIService(apiKey);
      const options = await openaiService.generateMultipleAdOptions(businessAnalysis);
      setMultipleOptions(options);
      toast.success("Múltiplas opções geradas com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar múltiplas opções:", error);
      toast.error("Erro ao gerar opções. Tente novamente.");
    } finally {
      setIsGeneratingOptions(false);
    }
  };

  const generateImageFromSelection = async () => {
    if (!selectedTopPhrase || !selectedImageDescription || !selectedBottomCTA) {
      toast.error("Selecione uma opção de cada categoria");
      return;
    }

    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua chave da API OpenAI");
      return;
    }

    setIsGeneratingImage(true);
    try {
      const openaiService = new OpenAIService(apiKey);
      
      // Update the manual fields with selected options
      setTopText(selectedTopPhrase);
      setBottomText(selectedBottomCTA);
      setImagePrompt(selectedImageDescription);
      
      // Create complete prompt for Instagram format
      const completePrompt = `${selectedImageDescription}. Include the text "${selectedTopPhrase}" prominently at the top of the image in large, bold letters, and "${selectedBottomCTA}" at the bottom in smaller but clear text. Design for Instagram post format (1024x1024), optimized for Meta Ads with high visual impact and professional typography. Text must be in Portuguese and clearly legible.`;
      
      // Generate the image
      const imageResult = await openaiService.generateImage({
        prompt: completePrompt,
        mainText: selectedTopPhrase,
        subText: selectedBottomCTA,
        textPosition: "center",
        size: "1024x1024",
        quality: "hd",
        style: "vivid"
      });
      
      setGeneratedImageUrl(imageResult.url);
      toast.success("Anúncio gerado com as opções selecionadas!");
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast.error("Erro ao gerar anúncio. Tente novamente.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadAd = () => {
    if (generatedImageUrl) {
      const link = document.createElement("a");
      link.href = generatedImageUrl;
      link.download = "anuncio-gerado.png";
      link.click();
      toast.success("Download iniciado!");
    } else {
      toast.error("Nenhuma imagem para baixar");
    }
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
            Criador de Anúncios Inteligente
          </h1>
          <p className="text-muted-foreground text-lg">
            Analise documentos e gere anúncios persuasivos automaticamente
          </p>
        </div>

        <div className="space-y-6">
          {/* Document Analysis Section */}
          <Card className="bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                📄 Análise Inteligente de Documento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey" className="text-foreground font-medium">
                  Chave da API OpenAI *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="bg-background/50 border-border"
                  />
                  <Button 
                    onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                    size="icon"
                    variant="outline"
                    className="border-border"
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="documentText" className="text-foreground font-medium">
                  Documento do Negócio
                </Label>
                <Textarea
                  id="documentText"
                  placeholder="Cole aqui o relatório, descrição do negócio, pitch, ou qualquer documento que descreva o produto/serviço, público-alvo, problemas que resolve, etc..."
                  className="min-h-32 bg-background/50 border-border resize-none"
                  value={documentText}
                  onChange={(e) => setDocumentText(e.target.value)}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={analyzeDocument} 
                  disabled={isAnalyzing || !documentText.trim() || !apiKey.trim()}
                  className="flex-1"
                  variant="outline"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-2 h-4 w-4" />
                      🔍 Analisar Documento
                    </>
                  )}
                </Button>
                
                {businessAnalysis && (
                  <>
                    <Button 
                      onClick={generateCompleteAd} 
                      disabled={isGeneratingImage}
                      variant="outline"
                      className="flex-1"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          🚀 Gerar Anúncio Rápido
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={generateMultipleOptions} 
                      disabled={isGeneratingOptions}
                      variant="gradient"
                      className="flex-1"
                    >
                      {isGeneratingOptions ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          ✨ Gerar Múltiplas Opções
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Business Analysis Results */}
          {showAnalysis && businessAnalysis && (
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle>📊 Análise do Negócio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-primary">Tipo de Negócio:</h4>
                    <p className="text-muted-foreground">{businessAnalysis.businessType}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary">Público-Alvo:</h4>
                    <p className="text-muted-foreground">{businessAnalysis.targetAudience}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary">Principais Dores:</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {businessAnalysis.painPoints.map((pain, index) => (
                      <li key={index}>{pain}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary">Proposta de Valor:</h4>
                  <p className="text-muted-foreground">{businessAnalysis.uniqueValue}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary">Oportunidades de Persuasão:</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {businessAnalysis.persuasionOpportunities.map((opp, index) => (
                      <li key={index}>{opp}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generated Prompt Preview */}
          {generatedPrompt && (
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle>📝 Elementos do Anúncio Gerados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-primary">Frase de Topo (Sensacionalista):</h4>
                  <p className="text-lg font-bold bg-primary/10 p-3 rounded-md">{generatedPrompt.topPhrase}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary">Conceito Visual:</h4>
                  <p className="text-muted-foreground bg-secondary/50 p-3 rounded-md">{generatedPrompt.imageDescription}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-primary">Call-to-Action:</h4>
                  <p className="text-lg font-semibold bg-accent/20 p-3 rounded-md">{generatedPrompt.bottomCTA}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multiple Options Selection */}
          {multipleOptions && (
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle>🎯 Selecione os Elementos do seu Anúncio Meta Ads</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Top Phrases Selection */}
                <div>
                  <h4 className="font-semibold text-primary mb-3">📈 Frases de Topo (Sensacionalistas):</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {multipleOptions.topPhrases.map((phrase, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTopPhrase(phrase)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedTopPhrase === phrase
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border bg-background/50 hover:border-primary/50'
                        }`}
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Descriptions Selection */}
                <div>
                  <h4 className="font-semibold text-primary mb-3">🎨 Conceitos Visuais (Contraintuitivos):</h4>
                  <div className="grid md:grid-cols-1 gap-2">
                    {multipleOptions.imageDescriptions.map((description, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageDescription(description)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedImageDescription === description
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border bg-background/50 hover:border-primary/50'
                        }`}
                      >
                        {description}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom CTAs Selection */}
                <div>
                  <h4 className="font-semibold text-primary mb-3">🚀 Calls-to-Action (Intrigantes):</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {multipleOptions.bottomCTAs.map((cta, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedBottomCTA(cta)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          selectedBottomCTA === cta
                            ? 'border-primary bg-primary/10 text-primary font-semibold'
                            : 'border-border bg-background/50 hover:border-primary/50'
                        }`}
                      >
                        {cta}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                {selectedTopPhrase && selectedImageDescription && selectedBottomCTA && (
                  <div className="pt-4 border-t border-border">
                    <div className="bg-secondary/20 p-4 rounded-lg mb-4">
                      <h5 className="font-semibold text-primary mb-2">🎯 Sua Seleção:</h5>
                      <div className="space-y-2 text-sm">
                        <p><strong>Topo:</strong> {selectedTopPhrase}</p>
                        <p><strong>Visual:</strong> {selectedImageDescription.slice(0, 100)}...</p>
                        <p><strong>CTA:</strong> {selectedBottomCTA}</p>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={generateImageFromSelection} 
                      disabled={isGeneratingImage}
                      className="w-full bg-gradient-primary hover:opacity-90 shadow-glow"
                    >
                      {isGeneratingImage ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Gerando Anúncio Instagram...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          🎯 Gerar Anúncio com Seleção (1024x1024)
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Manual Controls and Preview */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Manual Controls */}
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle>🎨 Personalização Final</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-1 gap-4">
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
                    <Label htmlFor="bottomText" className="text-foreground font-medium">
                      Descrição (Parte Inferior)
                    </Label>
                    <Textarea
                      id="bottomText"
                      value={bottomText}
                      onChange={(e) => setBottomText(e.target.value)}
                      placeholder="Digite a descrição detalhada..."
                      rows={3}
                      className="bg-background/50 border-border resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imagePrompt" className="text-foreground font-medium">
                    Descrição da Imagem
                  </Label>
                  <Textarea
                    id="imagePrompt"
                    placeholder="Descreva a imagem que deseja gerar..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={2}
                    className="bg-background/50 border-border resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="includeText"
                      checked={includeTextInImage}
                      onChange={(e) => setIncludeTextInImage(e.target.checked)}
                      className="rounded border-border"
                    />
                    <Label htmlFor="includeText" className="text-sm">
                      Incluir texto do anúncio dentro da imagem
                    </Label>
                  </div>

                  {includeTextInImage && (
                    <div className="space-y-2">
                      <Label className="text-foreground font-medium">
                        Posição do Texto na Imagem
                      </Label>
                      <Select value={textPosition} onValueChange={setTextPosition}>
                        <SelectTrigger className="bg-background/50 border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="top">Topo</SelectItem>
                          <SelectItem value="bottom">Parte Inferior</SelectItem>
                          <SelectItem value="left">Esquerda</SelectItem>
                          <SelectItem value="right">Direita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={generateCustomImage} 
                  disabled={isGeneratingImage || !imagePrompt || !apiKey.trim()}
                  className="w-full bg-gradient-primary hover:opacity-90"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Gerar Imagem Personalizada
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Preview */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">🎯 Preview do Anúncio Final</h3>
              <AdPreview 
                topText={includeTextInImage ? "" : topText}
                imageUrl={generatedImageUrl || heroImage}
                bottomText={includeTextInImage ? "" : bottomText}
              />
              
              {generatedImageUrl && (
                <Button 
                  onClick={downloadAd}
                  className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
                >
                  <Download className="mr-2 h-4 w-4" />
                  📥 Baixar Anúncio
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}