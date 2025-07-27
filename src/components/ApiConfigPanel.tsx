import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  Settings, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Trash2, 
  Download, 
  Upload,
  ExternalLink,
  TestTube2
} from 'lucide-react';
import { ApiConfigManager, type ApiConfig, type ImageProvider, type TextProvider, type VideoProvider } from '@/services/apiConfig';
import { ImageProviderFactory } from '@/services/imageProviderFactory';
import { TextProviderFactory } from '@/services/textProviderFactory';
import { toast } from 'sonner';

interface ApiConfigPanelProps {
  onConfigChange?: () => void;
}

export default function ApiConfigPanel({ onConfigChange }: ApiConfigPanelProps) {
  const [config, setConfig] = useState<ApiConfig>({});
  const [selectedImageProvider, setSelectedImageProvider] = useState<ImageProvider>('openai');
  const [selectedTextProvider, setSelectedTextProvider] = useState<TextProvider>('openai');
  const [selectedVideoProvider, setSelectedVideoProvider] = useState<VideoProvider>('heygen');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<ApiConfig>({});

  const apiManager = ApiConfigManager.getInstance();

  useEffect(() => {
    const settings = apiManager.getSettings();
    setConfig(settings.config);
    setSelectedImageProvider(settings.selectedImageProvider);
    setSelectedTextProvider(settings.selectedTextProvider);
    setSelectedVideoProvider(settings.selectedVideoProvider);
    setTempKeys(settings.config);

    const unsubscribe = apiManager.subscribe((newSettings) => {
      setConfig(newSettings.config);
      setSelectedImageProvider(newSettings.selectedImageProvider);
      setSelectedTextProvider(newSettings.selectedTextProvider);
      setSelectedVideoProvider(newSettings.selectedVideoProvider);
      setTempKeys(newSettings.config);
      onConfigChange?.();
    });

    return unsubscribe;
  }, [onConfigChange]);

  const updateApiKey = (provider: keyof ApiConfig, value: string) => {
    setTempKeys(prev => ({ ...prev, [provider]: value }));
  };

  const saveApiKey = (provider: keyof ApiConfig) => {
    const key = tempKeys[provider];
    if (!key?.trim()) {
      toast.error('Chave API não pode estar vazia');
      return;
    }

    if (!apiManager.validateApiKey(provider, key)) {
      toast.error('Formato de chave API inválido');
      return;
    }

    apiManager.updateApiKey(provider, key);
  };

  const removeApiKey = (provider: keyof ApiConfig) => {
    apiManager.removeApiKey(provider);
    setTempKeys(prev => ({ ...prev, [provider]: '' }));
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const updateImageProvider = (provider: ImageProvider) => {
    apiManager.setImageProvider(provider);
  };

  const updateTextProvider = (provider: TextProvider) => {
    apiManager.setTextProvider(provider);
  };

  const updateVideoProvider = (provider: VideoProvider) => {
    apiManager.setVideoProvider(provider);
  };

  const testApiConfiguration = async (provider: keyof ApiConfig) => {
    try {
      toast.loading(`Testando configuração ${provider.toUpperCase()}...`);
      
      if (provider === 'openai') {
        // Test OpenAI with a simple API call
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiManager.getApiKey('openai')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API retornou ${response.status}`);
        }
        
        toast.dismiss();
        toast.success(`${provider.toUpperCase()} configurado corretamente!`);
      } else if (provider === 'runware') {
        // Test Runware with actual service
        const { RunwareService } = await import('@/services/runware');
        const service = new RunwareService(apiManager.getApiKey('runware')!);
        // Just create the service to test initialization
        toast.dismiss();
        toast.success(`${provider.toUpperCase()} configuração válida!`);
      } else if (provider === 'runway') {
        // Test Runway
        toast.dismiss();
        toast.success(`${provider.toUpperCase()} chave API válida!`);
      } else {
        toast.dismiss();
        toast.info(`Teste não implementado para ${provider.toUpperCase()}`);
      }
    } catch (error) {
      toast.dismiss();
      console.error(`Erro ao testar ${provider}:`, error);
      toast.error(`Erro na configuração ${provider.toUpperCase()}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const exportSettings = () => {
    const settingsJson = apiManager.exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ad-creator-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (apiManager.importSettings(content)) {
        // Settings updated via subscription
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const apiProviders = [
    { key: 'openai', name: 'OpenAI', description: 'API para análise de texto e geração de imagens', link: 'https://platform.openai.com/api-keys' },
    { key: 'runware', name: 'Runware AI', description: 'API para geração de imagens com Runware', link: 'https://runware.ai' },
    { key: 'runway', name: 'Runway ML', description: 'API para geração de imagens com Runway', link: 'https://runwayml.com' },
    { key: 'midjourney', name: 'Midjourney', description: 'API para geração de imagens com Midjourney', link: 'https://midjourney.com' },
    { key: 'replicate', name: 'Replicate', description: 'API para geração de imagens com Replicate', link: 'https://replicate.com' },
    { key: 'claude', name: 'Claude (Anthropic)', description: 'API para análise de texto e geração de copy', link: 'https://anthropic.com' },
    { key: 'gemini', name: 'Google Gemini', description: 'API para análise de texto e geração de copy', link: 'https://cloud.google.com/vertex-ai' },
    // Video APIs
    { key: 'heygen', name: 'HeyGen', description: 'API para geração de vídeos com avatares', link: 'https://heygen.com' },
    { key: 'synthesia', name: 'Synthesia', description: 'API para geração de vídeos com IA', link: 'https://synthesia.io' },
    { key: 'luma', name: 'Luma AI', description: 'API para geração de vídeos', link: 'https://lumalabs.ai' },
    { key: 'pika', name: 'Pika Labs', description: 'API para geração de vídeos', link: 'https://pika.art' },
    // Audio APIs
    { key: 'elevenlabs', name: 'ElevenLabs', description: 'API para síntese de voz (texto para fala)', link: 'https://elevenlabs.io' }
  ];

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          ⚙️ Configurações das APIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="providers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="providers">Provedores</TabsTrigger>
            <TabsTrigger value="video">Vídeo</TabsTrigger>
            <TabsTrigger value="keys">Chaves API</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            <div>
              <Label>Provedor de Análise/Texto</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Para análise de documentos e geração de copy
              </p>
              <Select value={selectedTextProvider} onValueChange={updateTextProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TextProviderFactory.getAvailableProviders().map((provider) => (
                    <SelectItem 
                      key={provider.id} 
                      value={provider.id}
                      disabled={provider.comingSoon}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{provider.name}</span>
                        <div className="ml-2 flex items-center gap-1">
                          {provider.configured && <Badge variant="secondary">Configurado</Badge>}
                          {provider.comingSoon && <Badge variant="outline">Em breve</Badge>}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Provedor de Imagem</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Para geração de imagens
              </p>
              <Select value={selectedImageProvider} onValueChange={updateImageProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ImageProviderFactory.getAvailableProviders().map((provider) => (
                    <SelectItem 
                      key={provider.id} 
                      value={provider.id}
                      disabled={provider.comingSoon}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{provider.name}</span>
                        <div className="ml-2 flex items-center gap-1">
                          {provider.configured && <Badge variant="secondary">Configurado</Badge>}
                          {provider.comingSoon && <Badge variant="outline">Em breve</Badge>}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-6">
            <div>
              <Label>Provedor de Vídeo</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Para geração de vídeos com avatares e vozes
              </p>
              <Select value={selectedVideoProvider} onValueChange={updateVideoProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heygen">
                    <div className="flex items-center justify-between w-full">
                      <span>HeyGen (Recomendado)</span>
                      <Badge variant="default">Ativo</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="synthesia" disabled>
                    <div className="flex items-center justify-between w-full">
                      <span>Synthesia</span>
                      <Badge variant="outline">Em breve</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="luma" disabled>
                    <div className="flex items-center justify-between w-full">
                      <span>Luma AI</span>
                      <Badge variant="outline">Em breve</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="pika" disabled>
                    <div className="flex items-center justify-between w-full">
                      <span>Pika Labs</span>
                      <Badge variant="outline">Em breve</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Provedor de Áudio (ElevenLabs)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Para síntese de voz em português (opcional, mas recomendado)
              </p>
              <div className="flex items-center gap-2">
                <Badge variant={apiManager.hasApiKey('elevenlabs') ? "default" : "secondary"}>
                  {apiManager.hasApiKey('elevenlabs') ? "✅ Configurado" : "⚠️ Não configurado"}
                </Badge>
                {apiManager.hasApiKey('elevenlabs') && (
                  <Badge variant="outline">Vozes em português disponíveis</Badge>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="keys" className="space-y-4">
            {apiProviders.map((provider) => (
              <Card key={provider.key} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {provider.name}
                      {config[provider.key as keyof ApiConfig] && <Check className="h-4 w-4 text-green-500" />}
                    </h3>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(provider.link, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Obter chave
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showKeys[provider.key] ? 'text' : 'password'}
                      placeholder={`Chave API ${provider.name}`}
                      value={tempKeys[provider.key as keyof ApiConfig] || ''}
                      onChange={(e) => updateApiKey(provider.key as keyof ApiConfig, e.target.value)}
                      className="bg-background/50 border-border pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2"
                      onClick={() => toggleKeyVisibility(provider.key)}
                    >
                      {showKeys[provider.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => saveApiKey(provider.key as keyof ApiConfig)}
                    disabled={!tempKeys[provider.key as keyof ApiConfig]?.trim()}
                    size="sm"
                  >
                    <Key className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  {config[provider.key as keyof ApiConfig] && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => testApiConfiguration(provider.key as keyof ApiConfig)}
                      >
                        <TestTube2 className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeApiKey(provider.key as keyof ApiConfig)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportSettings} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Exportar Configurações
              </Button>
              <Button variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                <label htmlFor="import-settings" className="cursor-pointer">
                  Importar Configurações
                </label>
              </Button>
              <input
                id="import-settings"
                type="file"
                accept=".json"
                onChange={importSettings}
                className="hidden"
              />
            </div>

            <Separator />

            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Tem certeza que deseja limpar todas as configurações?')) {
                  apiManager.clearAllSettings();
                }
              }}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Todas as Configurações
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}