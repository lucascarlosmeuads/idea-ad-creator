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
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  const apiManager = ApiConfigManager.getInstance();

  useEffect(() => {
    const settings = apiManager.getSettings();
    setOpenaiKey(settings.config.openai || '');
    setIsConfigured(!!settings.config.openai);

    const unsubscribe = apiManager.subscribe((newSettings) => {
      setOpenaiKey(newSettings.config.openai || '');
      setIsConfigured(!!newSettings.config.openai);
      onConfigChange?.();
    });

    return unsubscribe;
  }, [onConfigChange]);

  const saveApiKey = (key: string) => {
    if (!key?.trim()) {
      toast.error('Chave API não pode estar vazia');
      return;
    }

    if (!apiManager.validateApiKey('openai', key)) {
      toast.error('Formato de chave API inválido');
      return;
    }

    apiManager.updateApiKey('openai', key);
    
    // Set OpenAI as text provider automatically
    apiManager.setTextProvider('openai');

    toast.success('OpenAI configurado com sucesso!');
  };

  const testConnection = async () => {
    try {
      toast.loading('Testando conexão OpenAI...');
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiManager.getApiKey('openai')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`API retornou ${response.status}`);
      }
      
      toast.dismiss();
      toast.success('OpenAI conectado com sucesso!');
    } catch (error) {
      toast.dismiss();
      console.error('Erro ao testar OpenAI:', error);
      toast.error(`Erro na conexão OpenAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          ⚙️ Configuração da API
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Summary */}
        <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
          {isConfigured ? (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-semibold">✅ OpenAI configurado! Pronto para gerar anúncios.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-600">
                <X className="h-5 w-5" />
                <span className="font-semibold">⚠️ Configuração incompleta</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure sua chave da API <strong>OpenAI</strong> para gerar anúncios com DALL-E 3.
              </p>
            </div>
          )}
        </div>

        {/* OpenAI Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold flex items-center gap-2">
                OpenAI DALL-E 3
                {isConfigured && <Badge variant="secondary">✅ Configurado</Badge>}
              </Label>
              <p className="text-sm text-muted-foreground">
                Para análise de documentos e geração de imagens com DALL-E 3
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
              onClick={() => saveApiKey(openaiKey)}
              disabled={!openaiKey.trim()}
              size="sm"
            >
              Salvar
            </Button>
            {isConfigured && (
              <Button
                variant="secondary"
                size="sm"
                onClick={testConnection}
              >
                <TestTube2 className="h-3 w-3 mr-1" />
                Testar
              </Button>
            )}
          </div>
        </div>

        {/* Information about image generation */}
        <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
          <h4 className="font-semibold text-foreground mb-2">🎨 Geração de Imagens</h4>
          <p className="text-sm text-muted-foreground">
            Agora usamos exclusivamente o <strong>OpenAI DALL-E 3</strong> para geração de imagens de alta qualidade. 
            Configure sua chave API acima para começar a criar anúncios visuais impressionantes.
          </p>
        </div>

        {/* Warning for incomplete configuration */}
        {!isConfigured && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Configure a API OpenAI para usar todas as funcionalidades. 
              Sem essa configuração, você não poderá gerar anúncios com imagens.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}