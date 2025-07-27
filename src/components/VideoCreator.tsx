import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Video, Download, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { VideoProviderFactory, type UnifiedVideoParams, type UnifiedVideoResult } from "@/services/videoProviderFactory";
import { ElevenLabsService } from "@/services/elevenlabs";
import { TextProviderFactory } from "@/services/textProviderFactory";
import { ApiConfigManager } from "@/services/apiConfig";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { BusinessAnalysis } from "@/services/openai";

interface VideoCreatorProps {
  businessAnalysis?: BusinessAnalysis | null;
}

interface GeneratedVideoData {
  id: string;
  video_url: string;
  thumbnail_url?: string;
  script: string;
  duration?: number;
  timestamp: Date;
  provider: string;
}

export default function VideoCreator({ businessAnalysis }: VideoCreatorProps) {
  const [script, setScript] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedStyle, setSelectedStyle] = useState<'professional' | 'casual' | 'energetic' | 'cinematic'>('professional');
  const [selectedFormat, setSelectedFormat] = useState<'square' | 'vertical' | 'horizontal'>('vertical');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideoData[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const apiManager = ApiConfigManager.getInstance();

  const generateVideoScript = async () => {
    if (!businessAnalysis) {
      toast.error("Primeiro analise um documento para gerar roteiro");
      return;
    }

    setIsGeneratingScript(true);
    try {
      // Usar TextProviderFactory para gerar um roteiro específico para vídeo
      const prompt = `Com base na análise do negócio, crie um roteiro de vídeo de anúncio de 30-60 segundos:

ANÁLISE DO NEGÓCIO:
- Tipo: ${businessAnalysis.businessType}
- Público: ${businessAnalysis.targetAudience}
- Dores: ${businessAnalysis.painPoints.join(', ')}
- Valor Único: ${businessAnalysis.uniqueValue}

FORMATO DO ROTEIRO:
- Duração: 30-60 segundos de fala
- Tom: Conversacional e persuasivo
- Estrutura: Gancho inicial + Problema + Solução + CTA
- Linguagem: Português brasileiro, natural para fala

Responda APENAS com o texto do roteiro, sem formatação ou explicações adicionais.`;

      // Simular uma chamada para geração de roteiro
      // Na prática, você usaria o serviço de texto configurado
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiManager.getApiKey('openai')}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 500,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar roteiro');
      }

      const data = await response.json();
      const generatedScript = data.choices[0].message.content.trim();
      setScript(generatedScript);
      toast.success("Roteiro gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar roteiro:", error);
      toast.error("Erro ao gerar roteiro. Verifique as configurações da API.");
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateVideo = async () => {
    if (!script.trim()) {
      toast.error("Digite ou gere um roteiro para o vídeo");
      return;
    }

    setIsGeneratingVideo(true);
    try {
      const videoParams: UnifiedVideoParams = {
        script,
        avatar: selectedAvatar || undefined,
        voice: selectedVoice || undefined,
        style: selectedStyle,
        format: selectedFormat,
        duration: 60, // 60 segundos máximo
        resolution: '1080p'
      };

      const result = await VideoProviderFactory.generateVideo(videoParams);
      
      const newVideoData: GeneratedVideoData = {
        id: Date.now().toString(),
        video_url: result.video_url,
        thumbnail_url: result.thumbnail_url,
        script,
        duration: result.duration,
        timestamp: new Date(),
        provider: result.provider
      };

      setGeneratedVideos(prev => [...prev, newVideoData]);
      setActiveVideoId(newVideoData.id);
      
      toast.success("Vídeo gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar vídeo:", error);
      toast.error("Erro ao gerar vídeo. Tente novamente.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const downloadVideo = (videoUrl: string, index: number) => {
    if (videoUrl) {
      const link = document.createElement("a");
      link.href = videoUrl;
      link.download = `anuncio-video-${index + 1}.mp4`;
      link.click();
      toast.success("Download iniciado!");
    } else {
      toast.error("Nenhum vídeo para baixar");
    }
  };

  const togglePlayPause = () => {
    const videoElement = document.getElementById('active-video') as HTMLVideoElement;
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const videoElement = document.getElementById('active-video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const activeVideo = generatedVideos.find(video => video.id === activeVideoId) || generatedVideos[generatedVideos.length - 1];

  const hasVideoProvider = VideoProviderFactory.hasAnyVideoProviderConfigured();
  const hasTextProvider = TextProviderFactory.hasAnyTextProviderConfigured();
  const hasElevenLabs = apiManager.hasApiKey('elevenlabs');

  return (
    <div className="space-y-6">
      {/* Configuração Status */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            🎬 Status de Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={hasVideoProvider ? "default" : "destructive"}>
              {hasVideoProvider ? "✅" : "❌"} Provedor de Vídeo
            </Badge>
            <Badge variant={hasTextProvider ? "default" : "destructive"}>
              {hasTextProvider ? "✅" : "❌"} Geração de Roteiro
            </Badge>
            <Badge variant={hasElevenLabs ? "default" : "secondary"}>
              {hasElevenLabs ? "✅" : "⚠️"} ElevenLabs (Opcional)
            </Badge>
          </div>
          {!hasVideoProvider && (
            <p className="text-sm text-muted-foreground">
              Configure um provedor de vídeo (HeyGen recomendado) na aba APIs para gerar vídeos.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Geração de Roteiro */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📝 Roteiro do Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="script">Roteiro (30-60 segundos de fala)</Label>
            <Textarea
              id="script"
              placeholder="Digite o roteiro do vídeo ou clique em 'Gerar Roteiro' para criar automaticamente..."
              className="min-h-32 bg-background/50 border-border resize-none"
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
          </div>
          
          {businessAnalysis && (
            <Button 
              onClick={generateVideoScript} 
              disabled={isGeneratingScript || !hasTextProvider}
              variant="outline"
              className="w-full"
            >
              {isGeneratingScript ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Roteiro...
                </>
              ) : (
                "🤖 Gerar Roteiro Automático"
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Configurações do Vídeo */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle>⚙️ Configurações do Vídeo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estilo do Vídeo</Label>
              <Select value={selectedStyle} onValueChange={(value: any) => setSelectedStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">🏢 Profissional</SelectItem>
                  <SelectItem value="casual">😊 Casual</SelectItem>
                  <SelectItem value="energetic">⚡ Energético</SelectItem>
                  <SelectItem value="cinematic">🎬 Cinematográfico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Formato do Vídeo</Label>
              <Select value={selectedFormat} onValueChange={(value: any) => setSelectedFormat(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vertical">📱 Vertical (Stories/Reels)</SelectItem>
                  <SelectItem value="square">⬜ Quadrado (Instagram)</SelectItem>
                  <SelectItem value="horizontal">📺 Horizontal (YouTube)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Avatar/Apresentador</Label>
              <Select value={selectedAvatar} onValueChange={setSelectedAvatar}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar avatar (padrão: automático)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🤖 Automático</SelectItem>
                  <SelectItem value="professional-woman">👩‍💼 Mulher Profissional</SelectItem>
                  <SelectItem value="professional-man">👨‍💼 Homem Profissional</SelectItem>
                  <SelectItem value="casual-woman">👩 Mulher Casual</SelectItem>
                  <SelectItem value="casual-man">👨 Homem Casual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Voz (ElevenLabs)</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar voz (padrão: automática)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">🔄 Automática</SelectItem>
                  {hasElevenLabs && ElevenLabsService.getPortugueseVoices().map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gerar Vídeo */}
      <Card className="bg-gradient-card border-border shadow-card">
        <CardContent className="pt-6">
          <Button 
            onClick={generateVideo} 
            disabled={isGeneratingVideo || !script.trim() || !hasVideoProvider}
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity shadow-glow"
            size="lg"
          >
            {isGeneratingVideo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando Vídeo... (pode levar alguns minutos)
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                🎬 Gerar Vídeo de Anúncio
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Player de Vídeo */}
      {activeVideo && (
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              🎬 Vídeo Gerado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                id="active-video"
                src={activeVideo.video_url}
                poster={activeVideo.thumbnail_url}
                className="w-full max-w-md mx-auto rounded-lg"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                controls
              />
              
              {/* Controles customizados */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                  </Button>
                </div>
                
                <Badge variant="secondary">
                  {activeVideo.provider} • {activeVideo.duration ? `${activeVideo.duration}s` : 'Processando...'}
                </Badge>
              </div>
            </div>

            {/* Detalhes do Vídeo */}
            <div className="bg-secondary/20 p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Roteiro:</strong> {activeVideo.script.slice(0, 150)}...
              </p>
              <p className="text-xs text-muted-foreground">
                Gerado em: {activeVideo.timestamp.toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Download */}
            <Button 
              onClick={() => downloadVideo(activeVideo.video_url, generatedVideos.findIndex(v => v.id === activeVideo.id))}
              className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              <Download className="mr-2 h-4 w-4" />
              📥 Baixar Vídeo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Vídeos */}
      {generatedVideos.length > 1 && (
        <Card className="bg-gradient-card border-border shadow-card">
          <CardHeader>
            <CardTitle>📚 Histórico de Vídeos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {generatedVideos.slice().reverse().map((video, index) => (
                <button
                  key={video.id}
                  onClick={() => setActiveVideoId(video.id)}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    activeVideoId === video.id 
                      ? 'border-primary shadow-glow' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <video 
                    src={video.video_url}
                    poster={video.thumbnail_url}
                    className="w-full h-24 object-cover"
                    muted
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">
                    #{generatedVideos.length - index}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}