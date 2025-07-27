import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Download, Wand2, FileText, Brain, Zap, ImageIcon, Settings, Mic, AlertTriangle, CheckCircle, Video } from "lucide-react";
import { toast } from "sonner";
import heroImage from "@/assets/idea-mining-hero.jpg";
import { OpenAIService, type BusinessAnalysis, type AdPromptElements, type MultipleAdOptions } from "@/services/openai";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ImageProviderFactory, type UnifiedImageParams } from "@/services/imageProviderFactory";
import { VideoProviderFactory, type UnifiedVideoParams } from "@/services/videoProviderFactory";
import { TextProviderFactory } from "@/services/textProviderFactory";
import { ApiConfigManager } from "@/services/apiConfig";
import SimpleApiConfig from "./SimpleApiConfig";
import AudioRecorderPanel from "./AudioRecorderPanel";
import VideoCreator from "./VideoCreator";
import ImageAnimationDialog from "./ImageAnimationDialog";

interface GeneratedImageData {
  id: string;
  url: string;
  topPhrase: string;
  bottomCTA: string;
  imageDescription: string;
  timestamp: Date;
  videoUrl?: string;
  isComplete?: boolean;
  prompt?: string;
}

interface GeneratedVideoData {
  id: string;
  url: string;
  script: string;
  timestamp: Date;
  imageUrl?: string; // Associated image if generated together
}

interface GeneratedContentData {
  id: string;
  type: 'image' | 'video' | 'both';
  image?: GeneratedImageData;
  video?: GeneratedVideoData;
  timestamp: Date;
}

interface ImageGalleryProps {
  images: GeneratedImageData[];
  activeImageId: string | null;
  onImageSelect: (imageId: string) => void;
  onDownload: (imageUrl: string, index: number) => void;
  onAnimateImage: (image: GeneratedImageData) => void;
}

const ImageGallery = ({ images, activeImageId, onImageSelect, onDownload, onAnimateImage }: ImageGalleryProps) => {
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
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={() => onAnimateImage(activeImage)}
              variant="outline"
              className="border-primary/20 hover:border-primary hover:bg-primary/10"
            >
              🎬 Animar
            </Button>
            <Button 
              onClick={() => onDownload(activeImage.url, images.findIndex(img => img.id === activeImage.id))}
              className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
            >
              <Download className="mr-2 h-4 w-4" />
              📥 Baixar
            </Button>
          </div>
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
  
  // Multiple options state - now fully automated
  const [isGeneratingCompleteAds, setIsGeneratingCompleteAds] = useState(false);
  const [completeAdsProgress, setCompleteAdsProgress] = useState<number>(0);
  
  // Content gallery state (images + videos)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImageData[]>([]);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoData[]>([]);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContentData[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  
  // Video generation state
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ image: boolean; video: boolean }>({ image: false, video: false });
  
  // Image animation state
  const [showAnimationDialog, setShowAnimationDialog] = useState(false);
  const [imageToAnimate, setImageToAnimate] = useState<GeneratedImageData | null>(null);
  const [isAnimatingImage, setIsAnimatingImage] = useState(false);
  
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

  const generateMultipleOptions = async () => {
    if (!businessAnalysis) {
      toast.error("Analise um documento primeiro para gerar múltiplas opções");
      return;
    }

    // Check if both OpenAI and Runway are configured
    const hasOpenAI = !!apiManager.getApiKey('openai');
    const hasRunway = !!apiManager.getApiKey('runway');
    
    if (!hasOpenAI) {
      toast.error("⚠️ Configure a API do OpenAI primeiro para gerar anúncios");
      return;
    }
    
    if (!hasRunway) {
      toast.error("⚠️ Configure a API do Runway primeiro para gerar imagens e vídeos");
      return;
    }

    setIsGeneratingCompleteAds(true);
    setCompleteAdsProgress(0);
    
    try {
      toast.loading("🎨 Gerando combinações de anúncios completos...");
      
      // Force Runway for both image and video
      apiManager.setImageProvider('runway');
      apiManager.setVideoProvider('runway');
      
      // Generate 5-8 different ad combinations
      const openaiService = new OpenAIService(apiManager.getApiKey('openai')!);
      const adCombinations = await openaiService.generateMultipleAdOptions(businessAnalysis);
      
      setCompleteAdsProgress(25);
      
      const completeAds: GeneratedImageData[] = [];
      const totalCombinations = Math.min(6, adCombinations.topPhrases.length); // Generate 6 complete ads
      
      // Generate each complete ad (image + animation)
      for (let i = 0; i < totalCombinations; i++) {
        const topPhrase = adCombinations.topPhrases[i];
        const imageDesc = adCombinations.imageDescriptions[i % adCombinations.imageDescriptions.length];
        const bottomCTA = adCombinations.bottomCTAs[i % adCombinations.bottomCTAs.length];
        
        try {
          // Generate image
          const imageParams: UnifiedImageParams = {
            prompt: imageDesc
          };
          
          const imageResult = await ImageProviderFactory.generateImage(imageParams, 'runway');
          
          const adData: GeneratedImageData = {
            id: crypto.randomUUID(),
            url: imageResult.image_url,
            topPhrase,
            bottomCTA,
            imageDescription: imageDesc,
            timestamp: new Date(),
            prompt: imageDesc,
            isComplete: false
          };
          
          completeAds.push(adData);
          setGeneratedImages(prev => [...prev, adData]);
          
          // Animate the image automatically
          try {
            const videoParams: UnifiedVideoParams = {
              script: `${topPhrase}. ${imageDesc}. ${bottomCTA}`,
              image_url: imageResult.image_url,
              duration: 5
            };
            
            const videoResult = await VideoProviderFactory.generateVideo(videoParams, 'runway');
            
            // Update the ad with video
            const completeAd = { ...adData, videoUrl: videoResult.video_url, isComplete: true };
            setGeneratedImages(prev => 
              prev.map(img => img.id === adData.id ? completeAd : img)
            );
            
          } catch (videoError) {
            console.warn(`Erro ao gerar vídeo para anúncio ${i + 1}:`, videoError);
            // Keep the ad even if video generation fails
          }
          
          setCompleteAdsProgress((i + 1) / totalCombinations * 100);
          
        } catch (error) {
          console.error(`Erro ao gerar anúncio ${i + 1}:`, error);
          toast.error(`Erro ao gerar anúncio ${i + 1}`);
        }
      }
      
      toast.dismiss();
      toast.success(`🎉 ${completeAds.length} anúncios completos gerados com sucesso!`);
      setShowAnalysis(false);
      
      // Set the last generated ad as active
      if (completeAds.length > 0) {
        setActiveImageId(completeAds[completeAds.length - 1].id);
      }
      
    } catch (error) {
      console.error("Erro ao gerar anúncios completos:", error);
      toast.dismiss();
      toast.error("Erro ao gerar anúncios completos. Verifique suas configurações de API.");
    } finally {
      setIsGeneratingCompleteAds(false);
      setCompleteAdsProgress(0);
    }
  };

  const handleAnimateImage = (image: GeneratedImageData) => {
    setImageToAnimate(image);
    setShowAnimationDialog(true);
  };

  const animateImage = async (motionPrompt: string, duration: number) => {
    if (!imageToAnimate) return;

    setIsAnimatingImage(true);
    setShowAnimationDialog(false);
    
    try {
      toast.info("🎬 Animando imagem...", {
        description: "Isso pode levar alguns minutos com Runway ML"
      });

      const videoResult = await VideoProviderFactory.generateVideo({
        image_url: imageToAnimate.url,
        motion_prompt: motionPrompt,
        duration: duration
      }, 'runway');

      const newVideoData: GeneratedVideoData = {
        id: Date.now().toString(),
        url: videoResult.video_url,
        script: `Animação: ${motionPrompt}`,
        timestamp: new Date(),
        imageUrl: imageToAnimate.url
      };

      setGeneratedVideos(prev => [...prev, newVideoData]);
      toast.success("🎉 Imagem animada com sucesso!");
      
    } catch (error) {
      console.error('Erro na animação da imagem:', error);
      toast.error(error instanceof Error ? error.message : 'Erro na animação da imagem');
    } finally {
      setIsAnimatingImage(false);
      setImageToAnimate(null);
    }
  };

  const downloadAd = (imageIdOrUrl: string, index?: number) => {
    // If it's an ID, find the image
    let imageUrl = imageIdOrUrl;
    if (!imageIdOrUrl.startsWith('http')) {
      const image = generatedImages.find(img => img.id === imageIdOrUrl);
      if (image) {
        imageUrl = image.url;
      } else {
        toast.error("Imagem não encontrada");
        return;
      }
    }
    
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `anuncio-gerado-${index !== undefined ? index + 1 : Date.now()}.png`;
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">📄 Análise</TabsTrigger>
            <TabsTrigger value="video">🎬 Vídeo</TabsTrigger>
            <TabsTrigger value="config">⚙️ APIs</TabsTrigger>
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
                    disabled={isAnalyzing || !documentText.trim() || !TextProviderFactory.hasAnyTextProviderConfigured()}
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
                      disabled={!businessAnalysis || isGeneratingCompleteAds}
                      className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
                    >
                      {isGeneratingCompleteAds ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          🎨 Gerando Anúncios Completos... {Math.round(completeAdsProgress)}%
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4" />
                          🎯 Gerar Múltiplas Opções Completas
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {!TextProviderFactory.hasAnyTextProviderConfigured() && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Configuração necessária</AlertTitle>
                    <AlertDescription>
                      Configure pelo menos um provedor de texto (OpenAI, Claude ou Gemini) na aba "APIs" para usar as funcionalidades de análise.
                    </AlertDescription>
                  </Alert>
                )}
                
                {TextProviderFactory.hasAnyTextProviderConfigured() && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Provedor de texto configurado</AlertTitle>
                    <AlertDescription>
                      Usando: {TextProviderFactory.getConfiguredProviders().map(p => p.name).join(', ')} para análise de texto
                    </AlertDescription>
                  </Alert>
                )}
                
                {ImageProviderFactory.getAvailableProviders().filter(p => p.configured).length > 0 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Provedor de imagem configurado</AlertTitle>
                    <AlertDescription>
                      Usando: {ImageProviderFactory.getAvailableProviders().filter(p => p.configured).map(p => p.name).join(', ')} para geração de imagem
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Video Creator Tab */}
          <TabsContent value="video" className="space-y-6">
            <VideoCreator businessAnalysis={businessAnalysis} />
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config" className="space-y-4">
            <SimpleApiConfig onConfigChange={() => {
              // Force re-render to update provider status
              setShowAnalysis(prev => prev);
            }} />
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
          {/* Progress indicator for complete ads generation */}
          {isGeneratingCompleteAds && (
            <Card className="bg-gradient-card border-border shadow-card">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gerando anúncios completos...</span>
                    <span className="text-sm text-muted-foreground">{Math.round(completeAdsProgress)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${completeAdsProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Criando combinações automáticas de copy + imagem + vídeo com Runway ML
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Image Gallery */}
          <ImageGallery 
            images={generatedImages}
            activeImageId={activeImageId}
            onImageSelect={handleImageSelect}
            onDownload={downloadAd}
            onAnimateImage={handleAnimateImage}
          />

          {/* Image Animation Dialog */}
          <ImageAnimationDialog
            isOpen={showAnimationDialog}
            onClose={() => setShowAnimationDialog(false)}
            image={imageToAnimate}
            onAnimate={animateImage}
            isAnimating={isAnimatingImage}
          />
        </div>
      </div>
    </div>
  );
}
