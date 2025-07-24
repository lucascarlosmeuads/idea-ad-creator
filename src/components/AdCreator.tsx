import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Wand2, FileText, Brain, Zap, ImageIcon, Settings, Mic } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/idea-mining-hero.jpg";
import { OpenAIService, type BusinessAnalysis, type AdPromptElements, type MultipleAdOptions } from "@/services/openai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImageProviderFactory, type UnifiedImageParams } from "@/services/imageProviderFactory";
import { TextProviderFactory } from "@/services/textProviderFactory";
import { ApiConfigManager } from "@/services/apiConfig";
import ApiConfigPanel from "./ApiConfigPanel";
import AudioRecorderPanel from "./AudioRecorderPanel";

interface GeneratedImageData {
  id: string;
  url: string;
  topPhrase: string;
  bottomCTA: string;
  imageDescription: string;
  timestamp: Date;
}

interface ImageGalleryProps {
  images: GeneratedImageData[];
  activeImageId: string | null;
  onImageSelect: (imageId: string) => void;
  onDownload: (imageUrl: string, index: number) => void;
}

const ImageGallery = ({ images, activeImageId, onImageSelect, onDownload }: ImageGalleryProps) => {
  if (images.length === 0) return null;

  const activeImage = images.find(img => img.id === activeImageId) || images[images.length - 1];

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          🖼️ Galeria de Anúncios Gerados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Image Display */}
        <div className="text-center space-y-4">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-primary opacity-20 rounded-lg blur-xl transition-opacity group-hover:opacity-30"></div>
            <img 
              src={activeImage.url}
              alt="Anúncio gerado"
              className="relative w-full max-w-md mx-auto rounded-lg border border-border/50 shadow-lg"
            />
          </div>
          
          {/* Image Details */}
          <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
            <h3 className="font-bold text-lg text-primary">{activeImage.topPhrase}</h3>
            <p className="text-sm text-muted-foreground">{activeImage.imageDescription}</p>
            <p className="font-semibold text-accent">{activeImage.bottomCTA}</p>
            <p className="text-xs text-muted-foreground">
              Gerado em: {activeImage.timestamp.toLocaleString('pt-BR')}
            </p>
          </div>
          
          {/* Download Button */}
          <Button 
            onClick={() => onDownload(activeImage.url, images.findIndex(img => img.id === activeImage.id))}
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
          >
            <Download className="mr-2 h-4 w-4" />
            📥 Baixar Anúncio
          </Button>
        </div>

        {/* Thumbnail History */}
        {images.length > 1 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">📚 Histórico de Imagens:</h4>
            <div className="grid grid-cols-3 gap-2">
              {images.slice().reverse().map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => onImageSelect(image.id)}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    activeImageId === image.id 
                      ? 'border-primary shadow-glow' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img 
                    src={image.url}
                    alt={`Anúncio ${images.length - index}`}
                    className="w-full h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                    #{images.length - index}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function AdCreator() {
  const [topText, setTopText] = useState("🔥 Descubra o Minerador de Ideias que Revoluciona Negócios Digitais");
  const [bottomText, setBottomText] = useState("Transforme insights em oportunidades de ouro. Nossa plataforma usa IA avançada para extrair ideias lucrativas do mercado digital. Pare de procurar - comece a encontrar!");
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
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
  
  // Image gallery state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageData[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  
  // Input mode state (text vs audio)
  const [inputMode, setInputMode] = useState<'text' | 'audio'>('text');
  
  // API configuration
  const apiManager = ApiConfigManager.getInstance();

  const analyzeDocument = async () => {
    if (!documentText.trim()) {
      toast.error("Por favor, insira o texto do documento para análise");
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await TextProviderFactory.analyzeBusinessDocument(documentText);
      setBusinessAnalysis(analysis);
      setShowAnalysis(true);
      toast.success("Documento analisado com sucesso!");
    } catch (error) {
      console.error("Erro ao analisar documento:", error);
      toast.error("Erro ao analisar documento. Verifique as configurações da API.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateCompleteAd = async () => {
    if (!businessAnalysis) {
      toast.error("Primeiro analise um documento");
      return;
    }

    setIsGeneratingImage(true);
    try {
      // Generate the ad prompt elements using TextProviderFactory
      const promptElements = await TextProviderFactory.generateAdPrompt(businessAnalysis);
      setGeneratedPrompt(promptElements);
      
      // Auto-fill the form fields
      setTopText(promptElements.topPhrase);
      setBottomText(promptElements.bottomCTA);
      setImagePrompt(promptElements.imageDescription);
      setIncludeTextInImage(true);
      
      // Generate the image using the factory
      const imageParams: UnifiedImageParams = {
        prompt: promptElements.completePrompt,
        mainText: promptElements.topPhrase,
        subText: promptElements.bottomCTA,
        textPosition: textPosition as any,
        size: "1024x1024",
        quality: "hd",
        style: "vivid"
      };
      
      const imageResult = await ImageProviderFactory.generateImage(imageParams);
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

    setIsGeneratingImage(true);
    try {
      const imageParams: UnifiedImageParams = {
        prompt: imagePrompt,
        size: "1024x1024",
        quality: "hd",
        style: "vivid",
        textPosition: textPosition as any,
        mainText: includeTextInImage ? topText : undefined,
        subText: includeTextInImage ? (bottomText.length > 100 ? bottomText.slice(0, 100) + "..." : bottomText) : undefined,
      };
      
      const result = await ImageProviderFactory.generateImage(imageParams);
      setGeneratedImageUrl(result.url);
      toast.success("Imagem gerada com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast.error("Erro ao gerar imagem. Verifique as configurações da API.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateMultipleOptions = async () => {
    if (!businessAnalysis) {
      toast.error("Primeiro analise um documento");
      return;
    }

    setIsGeneratingOptions(true);
    try {
      const options = await TextProviderFactory.generateMultipleAdOptions(businessAnalysis);
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

    setIsGeneratingImage(true);
    try {
      // Update the manual fields with selected options
      setTopText(selectedTopPhrase);
      setBottomText(selectedBottomCTA);
      setImagePrompt(selectedImageDescription);
      
      // Create complete prompt for Instagram format
      const completePrompt = `${selectedImageDescription}. Include the text "${selectedTopPhrase}" prominently at the top of the image in large, bold letters, and "${selectedBottomCTA}" at the bottom in smaller but clear text. Design for Instagram post format (1024x1024), optimized for Meta Ads with high visual impact and professional typography. Text must be in Portuguese and clearly legible.`;
      
      // Generate the image using factory
      const imageParams: UnifiedImageParams = {
        prompt: completePrompt,
        mainText: selectedTopPhrase,
        subText: selectedBottomCTA,
        textPosition: "center",
        size: "1024x1024",
        quality: "hd",
        style: "vivid"
      };
      
      const imageResult = await ImageProviderFactory.generateImage(imageParams);
      
      // Create new image data
      const newImageData: GeneratedImageData = {
        id: Date.now().toString(),
        url: imageResult.url,
        topPhrase: selectedTopPhrase,
        bottomCTA: selectedBottomCTA,
        imageDescription: selectedImageDescription,
        timestamp: new Date()
      };
      
      // Add to gallery and set as active
      setGeneratedImages(prev => [...prev, newImageData]);
      setActiveImageId(newImageData.id);
      setGeneratedImageUrl(imageResult.url);
      
      toast.success("Anúncio gerado com as opções selecionadas!");
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast.error("Erro ao gerar anúncio. Tente novamente.");
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadAd = (imageUrl: string, index: number) => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `anuncio-gerado-${index + 1}.png`;
      link.click();
      toast.success("Download iniciado!");
    } else {
      toast.error("Nenhuma imagem para baixar");
    }
  };

  const handleImageSelect = (imageId: string) => {
    setActiveImageId(imageId);
    const selectedImage = generatedImages.find(img => img.id === imageId);
    if (selectedImage) {
      setGeneratedImageUrl(selectedImage.url);
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

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">📄 Análise</TabsTrigger>
            <TabsTrigger value="apis">⚙️ APIs</TabsTrigger>
            <TabsTrigger value="audio">🎤 Áudio</TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card className="bg-gradient-card border-border shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  📄 Análise Inteligente de Documento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as 'text' | 'audio')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">📝 Inserir Texto</TabsTrigger>
                    <TabsTrigger value="audio">🎤 Gravar Áudio</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4">
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
                  </TabsContent>
                  
                  <TabsContent value="audio" className="space-y-4">
                    <AudioRecorderPanel 
                      onTranscriptionComplete={(text) => {
                        setDocumentText(text);
                        setInputMode('text'); // Switch back to text view after transcription
                      }}
                    />
                  </TabsContent>
                </Tabs>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={analyzeDocument} 
                    disabled={isAnalyzing || !documentText.trim() || !apiManager.hasApiKey('openai')}
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
                  )}
                </div>
                
                {!apiManager.hasApiKey('openai') && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      ⚠️ Configure sua chave API OpenAI na aba "APIs" para continuar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* APIs Tab */}
          <TabsContent value="apis">
            <ApiConfigPanel onConfigChange={() => {}} />
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio">
            <AudioRecorderPanel 
              onTranscriptionComplete={(text) => {
                setDocumentText(text);
              }}
            />
          </TabsContent>
        </Tabs>

        <div className="space-y-6">

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

          {/* Image Gallery */}
          <ImageGallery 
            images={generatedImages}
            activeImageId={activeImageId}
            onImageSelect={handleImageSelect}
            onDownload={downloadAd}
          />
        </div>
      </div>
    </div>
  );
}