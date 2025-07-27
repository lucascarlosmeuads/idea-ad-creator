import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Check, X, Eye, EyeOff, ExternalLink, TestTube2, AlertTriangle } from 'lucide-react';
import { ApiConfigManager } from '@/services/apiConfig';
import { toast } from 'sonner';

interface SimpleApiConfigProps {
  onConfigChange?: () => void;
}

export default function SimpleApiConfig({ onConfigChange }: SimpleApiConfigProps) {
  const [openaiKey, setOpenaiKey] = useState('');
  const [runwayKey, setRunwayKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showRunwayKey, setShowRunwayKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState({ openai: false, runway: false });

  const apiManager = ApiConfigManager.getInstance();

  useEffect(() => {
    const settings = apiManager.getSettings();
    setOpenaiKey(settings.config.openai || '');
    setRunwayKey(settings.config.runway || '');
    setIsConfigured({
      openai: !!settings.config.openai,
      runway: !!settings.config.runway
    });

    const unsubscribe = apiManager.subscribe((newSettings) => {
      setOpenaiKey(newSettings.config.openai || '');
      setRunwayKey(newSettings.config.runway || '');
      setIsConfigured({
        openai: !!newSettings.config.openai,
        runway: !!newSettings.config.runway
      });
      onConfigChange?.();
    });

    return unsubscribe;
  }, [onConfigChange]);

  const saveApiKey = (provider: 'openai' | 'runway', key: string) => {
    if (!key?.trim()) {
      toast.error('Chave API não pode estar vazia');
      return;
    }

    if (!apiManager.validateApiKey(provider, key)) {
      toast.error('Formato de chave API inválido');
      return;
    }

    apiManager.updateApiKey(provider, key);
    
    // Set providers automatically
    if (provider === 'openai') {
      apiManager.setTextProvider('openai');
      apiManager.setImageProvider('runway'); // Use Runway for images when OpenAI is configured
    }
    if (provider === 'runway') {
      apiManager.setImageProvider('runway');
      apiManager.setVideoProvider('runway');
    }

    toast.success(`${provider.toUpperCase()} configurado com sucesso!`);
  };

  const testConnection = async (provider: 'openai' | 'runway') => {
    try {
      toast.loading(`Testando conexão ${provider.toUpperCase()}...`);
      
      if (provider === 'openai') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${apiManager.getApiKey('openai')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API retornou ${response.status}`);
        }
      } else if (provider === 'runway') {
        const response = await fetch('https://api.runwayml.com/v1/users/me', {
          headers: {
            'Authorization': `Bearer ${apiManager.getApiKey('runway')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API retornou ${response.status}`);
        }
      }
      
      toast.dismiss();
      toast.success(`${provider.toUpperCase()} conectado com sucesso!`);
    } catch (error) {
      toast.dismiss();
      console.error(`Erro ao testar ${provider}:`, error);
      toast.error(`Erro na conexão ${provider.toUpperCase()}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const isFullyConfigured = isConfigured.openai && isConfigured.runway;
  const missingConfigs = [];
  if (!isConfigured.openai) missingConfigs.push('OpenAI');
  if (!isConfigured.runway) missingConfigs.push('Runway');

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          ⚙️ Configuração das APIs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Summary */}
        <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
          {isFullyConfigured ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-semibold">✅ Tudo configurado! Pronto para gerar anúncios.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-600">
                <X className="h-5 w-5" />
                <span className="font-semibold">⚠️ Configuração incompleta</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Para gerar múltiplas opções, você precisa configurar: <strong>{missingConfigs.join(', ')}</strong>
              </p>
            </div>
          )}
        </div>

        {/* OpenAI Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                OpenAI
                {isConfigured.openai && <Badge variant="secondary">✅ Configurado</Badge>}
              </Label>
              <p className="text-sm text-muted-foreground">
                Para análise de documentos e geração de copy inteligente
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Obter chave
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showOpenaiKey ? 'text' : 'password'}
                placeholder="sk-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="bg-background/50 border-border pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => setShowOpenaiKey(!showOpenaiKey)}
              >
                {showOpenaiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <Button
              onClick={() => saveApiKey('openai', openaiKey)}
              disabled={!openaiKey.trim()}
              size="sm"
            >
              Salvar
            </Button>
            {isConfigured.openai && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => testConnection('openai')}
              >
                <TestTube2 className="h-3 w-3 mr-1" />
                Testar
              </Button>
            )}
          </div>
        </div>

        {/* Runway Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                Runway ML
                {isConfigured.runway && <Badge variant="secondary">✅ Configurado</Badge>}
              </Label>
              <p className="text-sm text-muted-foreground">
                Para geração de imagens e vídeos animados de alta qualidade
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('https://runwayml.com', '_blank')}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Obter chave
            </Button>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                type={showRunwayKey ? 'text' : 'password'}
                placeholder="rw_..."
                value={runwayKey}
                onChange={(e) => setRunwayKey(e.target.value)}
                className="bg-background/50 border-border pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-2"
                onClick={() => setShowRunwayKey(!showRunwayKey)}
              >
                {showRunwayKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            <Button
              onClick={() => saveApiKey('runway', runwayKey)}
              disabled={!runwayKey.trim()}
              size="sm"
            >
              Salvar
            </Button>
            {isConfigured.runway && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => testConnection('runway')}
              >
                <TestTube2 className="h-3 w-3 mr-1" />
                Testar
              </Button>
            )}
          </div>
        </div>

        {/* Warning for incomplete configuration */}
        {!isFullyConfigured && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Configure ambas as APIs para usar todas as funcionalidades. 
              Sem essas configurações, você não poderá gerar anúncios completos com imagem e vídeo.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}