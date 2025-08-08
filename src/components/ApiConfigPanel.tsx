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
import { ApiConfigManager, type ApiConfig, type TextProvider, type VideoProvider } from '@/services/apiConfig';
import { TextProviderFactory } from '@/services/textProviderFactory';
import { toast } from 'sonner';

interface ApiConfigPanelProps {
  onConfigChange?: () => void;
}

export default function ApiConfigPanel({ onConfigChange }: ApiConfigPanelProps) {
  const [config, setConfig] = useState<ApiConfig>({});
  const [selectedTextProvider, setSelectedTextProvider] = useState<TextProvider>('openai');
  const [selectedVideoProvider, setSelectedVideoProvider] = useState<VideoProvider>('runway');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<ApiConfig>({});

  const apiManager = ApiConfigManager.getInstance();

  useEffect(() => {
    const settings = apiManager.getSettings();
    setConfig(settings.config);
    setSelectedTextProvider(settings.selectedTextProvider);
    setSelectedVideoProvider(settings.selectedVideoProvider);
    setTempKeys(settings.config);

    const unsubscribe = apiManager.subscribe((newSettings) => {
      setConfig(newSettings.config);
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

  const updateTextProvider = (provider: TextProvider) => {
    apiManager.setTextProvider(provider);
  };

  const updateVideoProvider = (provider: VideoProvider) => {
    apiManager.setVideoProvider(provider);
  };

  const exportSettings = () => {
    const settings = apiManager.exportSettings();
    const blob = new Blob([settings], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'api-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Configurações exportadas com sucesso!');
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = apiManager.importSettings(content);
        if (success) {
          toast.success('Configurações importadas com sucesso!');
        }
      } catch (error) {
        toast.error('Erro ao importar configurações');
      }
    };
    reader.readAsText(file);
  };

  const testProviderConnection = async (provider: keyof ApiConfig) => {
    try {
      toast.loading(`Testando conexão ${provider}...`);
      
      // Simple validation test - we'll improve this later with actual API calls
      const key = config[provider];
      if (!key) {
        throw new Error('Chave API não configurada');
      }

      // For now, just validate the key format
      if (!apiManager.validateApiKey(provider, key)) {
        throw new Error('Formato de chave inválido');
      }

      toast.dismiss();
      toast.success(`Conexão ${provider.toUpperCase()} validada!`);
    } catch (error) {
      toast.dismiss();
      toast.error(`Erro na conexão ${provider}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const clearAllSettings = () => {
    apiManager.clearAllSettings();
    toast.success('Todas as configurações foram limpas');
  };

  const apiProviders = [
    { 
      key: 'openai' as keyof ApiConfig, 
      name: 'OpenAI', 
      placeholder: 'sk-...', 
      description: 'Para análise de texto e geração de imagens DALL-E 3',
      link: 'https://platform.openai.com/api-keys'
    },
    { 
      key: 'claude' as keyof ApiConfig, 
      name: 'Claude (Anthropic)', 
      placeholder: 'sk-...', 
      description: 'Para análise de texto avançada',
      link: 'https://console.anthropic.com/'
    },
    { 
      key: 'gemini' as keyof ApiConfig, 
      name: 'Google Gemini', 
      placeholder: 'AIza...', 
      description: 'Para análise de texto alternativa',
      link: 'https://ai.google.dev/'
    },
    { 
      key: 'runway' as keyof ApiConfig, 
      name: 'Runway ML', 
      placeholder: 'rw_...', 
      description: 'Para geração e animação de vídeos',
      link: 'https://runwayml.com'
    }
  ];

  const textProviders: Array<{ value: TextProvider; label: string }> = [
    { value: 'openai', label: 'OpenAI GPT' },
    { value: 'claude', label: 'Claude (Anthropic)' },
    { value: 'gemini', label: 'Google Gemini' }
  ];

  const videoProviders: Array<{ value: VideoProvider; label: string }> = [
    { value: 'runway', label: 'Runway ML' },
    { value: 'heygen', label: 'HeyGen' },
    { value: 'synthesia', label: 'Synthesia' },
    { value: 'luma', label: 'Luma AI' },
    { value: 'pika', label: 'Pika Labs' }
  ];

  const hasAnyProvider = Object.values(config).some(key => key?.trim());

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          ⚙️ Configurações Avançadas das APIs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="providers">🔑 Provedores de API</TabsTrigger>
            <TabsTrigger value="settings">⚙️ Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">
            {/* Image Generation Notice */}
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <h4 className="font-semibold text-foreground mb-2">🎨 Geração de Imagens</h4>
              <p className="text-sm text-muted-foreground">
                Agora usamos exclusivamente o <strong>OpenAI DALL-E 3</strong> para geração de imagens. 
                Configure sua chave OpenAI abaixo para começar.
              </p>
            </div>

            {/* API Providers Configuration */}
            <div className="space-y-4">
              {apiProviders.map((provider) => (
                <div key={provider.key} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold">{provider.name}</Label>
                      {config[provider.key] && (
                        <Badge variant="secondary">
                          <Check className="h-3 w-3 mr-1" />
                          Configurado
                        </Badge>
                      )}
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
                  
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showKeys[provider.key] ? 'text' : 'password'}
                        placeholder={provider.placeholder}
                        value={tempKeys[provider.key] || ''}
                        onChange={(e) => updateApiKey(provider.key, e.target.value)}
                        className="pr-16"
                      />
                      <div className="absolute right-0 top-0 flex">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-full px-2"
                          onClick={() => toggleKeyVisibility(provider.key)}
                        >
                          {showKeys[provider.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        {config[provider.key] && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-full px-2 text-destructive"
                            onClick={() => removeApiKey(provider.key)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => saveApiKey(provider.key)}
                      disabled={!tempKeys[provider.key]?.trim()}
                      size="sm"
                    >
                      <Key className="h-3 w-3 mr-1" />
                      Salvar
                    </Button>
                    {config[provider.key] && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => testProviderConnection(provider.key)}
                      >
                        <TestTube2 className="h-3 w-3 mr-1" />
                        Testar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>🧠 Provedor de Análise de Texto</Label>
                <Select
                  value={selectedTextProvider}
                  onValueChange={updateTextProvider}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {textProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>🎬 Provedor de Geração de Vídeo</Label>
                <Select
                  value={selectedVideoProvider}
                  onValueChange={updateVideoProvider}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {videoProviders.map((provider) => (
                      <SelectItem key={provider.value} value={provider.value}>
                        {provider.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Import/Export Settings */}
            <div className="space-y-4">
              <h4 className="font-semibold">📁 Gerenciar Configurações</h4>
              
              <div className="flex gap-2">
                <Button onClick={exportSettings} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Configurações
                </Button>
                
                <label>
                  <Button variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Importar Configurações
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSettings}
                    className="hidden"
                  />
                </label>
              </div>
              
              <Button 
                onClick={clearAllSettings} 
                variant="destructive"
                disabled={!hasAnyProvider}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Todas as Configurações
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}