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
  ExternalLink
} from 'lucide-react';
import { ApiConfigManager, type ApiConfig, type ImageProvider } from '@/services/apiConfig';
import { ImageProviderFactory } from '@/services/imageProviderFactory';
import { toast } from 'sonner';

interface ApiConfigPanelProps {
  onConfigChange?: () => void;
}

export default function ApiConfigPanel({ onConfigChange }: ApiConfigPanelProps) {
  const [config, setConfig] = useState<ApiConfig>({});
  const [selectedProvider, setSelectedProvider] = useState<ImageProvider>('openai');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [tempKeys, setTempKeys] = useState<ApiConfig>({});

  const apiManager = ApiConfigManager.getInstance();

  useEffect(() => {
    const settings = apiManager.getSettings();
    setConfig(settings.config);
    setSelectedProvider(settings.selectedImageProvider);
    setTempKeys(settings.config);

    const unsubscribe = apiManager.subscribe((newSettings) => {
      setConfig(newSettings.config);
      setSelectedProvider(newSettings.selectedImageProvider);
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
    setSelectedProvider(provider);
    apiManager.setImageProvider(provider);
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

  const availableProviders = ImageProviderFactory.getAvailableProviders();

  const apiProviders = [
    {
      key: 'openai' as keyof ApiConfig,
      name: 'OpenAI',
      description: 'Para DALL-E 3 e transcrição Whisper',
      placeholder: 'sk-...',
      linkText: 'Obter chave API',
      link: 'https://platform.openai.com/api-keys'
    },
    {
      key: 'runware' as keyof ApiConfig,
      name: 'Runware',
      description: 'Para geração rápida de imagens',
      placeholder: 'Chave API Runware',
      linkText: 'Obter chave API',
      link: 'https://runware.ai'
    },
    {
      key: 'runway' as keyof ApiConfig,
      name: 'Runway ML',
      description: 'Em breve - Geração avançada de imagens',
      placeholder: 'Chave API Runway',
      linkText: 'Runway ML',
      link: 'https://runwayml.com',
      disabled: true
    }
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="providers">Provedores</TabsTrigger>
            <TabsTrigger value="apis">Chaves API</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Image Providers Tab */}
          <TabsContent value="providers" className="space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">
                Provedor de Imagens Ativo
              </Label>
              <Select value={selectedProvider} onValueChange={updateImageProvider}>
                <SelectTrigger className="bg-background/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableProviders.map((provider) => (
                    <SelectItem 
                      key={provider.key} 
                      value={provider.key}
                      disabled={provider.comingSoon}
                    >
                      <div className="flex items-center gap-2">
                        <span>{provider.name}</span>
                        {provider.configured && (
                          <Badge variant="secondary" className="text-xs">
                            <Check className="h-3 w-3 mr-1" />
                            Configurado
                          </Badge>
                        )}
                        {provider.comingSoon && (
                          <Badge variant="outline" className="text-xs">
                            Em breve
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3">
              {availableProviders.map((provider) => (
                <Card key={provider.key} className={`p-3 ${provider.configured ? 'border-green-500/50' : 'border-border'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${provider.configured ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {provider.configured ? 'Pronto para usar' : 'Configuração necessária'}
                          {provider.comingSoon && ' - Em desenvolvimento'}
                        </p>
                      </div>
                    </div>
                    {provider.key === selectedProvider && (
                      <Badge variant="default" className="text-xs">Ativo</Badge>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="apis" className="space-y-4">
            {apiProviders.map((provider) => (
              <Card key={provider.key} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium flex items-center gap-2">
                      {provider.name}
                      {config[provider.key] && <Check className="h-4 w-4 text-green-500" />}
                    </h3>
                    <p className="text-xs text-muted-foreground">{provider.description}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(provider.link, '_blank')}
                    disabled={provider.disabled}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {provider.linkText}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Input
                      type={showKeys[provider.key] ? 'text' : 'password'}
                      placeholder={provider.placeholder}
                      value={tempKeys[provider.key] || ''}
                      onChange={(e) => updateApiKey(provider.key, e.target.value)}
                      className="bg-background/50 border-border pr-10"
                      disabled={provider.disabled}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2"
                      onClick={() => toggleKeyVisibility(provider.key)}
                      disabled={provider.disabled}
                    >
                      {showKeys[provider.key] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  <Button
                    onClick={() => saveApiKey(provider.key)}
                    disabled={!tempKeys[provider.key]?.trim() || provider.disabled}
                    size="sm"
                  >
                    <Key className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  {config[provider.key] && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeApiKey(provider.key)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Settings Tab */}
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