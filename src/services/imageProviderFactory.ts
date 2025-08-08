import { OpenAIService, type GenerateImageParams as OpenAIParams, type GeneratedImage as OpenAIImage } from './openai';
import { ApiConfigManager, type ImageProvider } from './apiConfig';
import { toast } from 'sonner';

// Unified interfaces
export interface UnifiedImageParams {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  textPosition?: "center" | "top" | "bottom" | "left" | "right";
  mainText?: string;
  subText?: string;
  seed?: number;
  steps?: number;
  guidance?: number;
}

export interface UnifiedImageResult {
  url: string;
  prompt: string;
  seed?: number;
  revisedPrompt?: string;
  provider: ImageProvider;
}

export interface ImageProviderInterface {
  generateImage(params: UnifiedImageParams): Promise<UnifiedImageResult>;
  isConfigured(): boolean;
  getProviderName(): string;
}

// OpenAI Provider Implementation
class OpenAIProvider implements ImageProviderInterface {
  private apiConfigManager = ApiConfigManager.getInstance();

  private getService(): OpenAIService {
    const apiKey = this.apiConfigManager.getApiKey('openai');
    if (!apiKey) {
      throw new Error('Chave API OpenAI não configurada. Configure nas configurações.');
    }
    // Always create a new instance to ensure latest API key
    return new OpenAIService(apiKey);
  }

  async generateImage(params: UnifiedImageParams): Promise<UnifiedImageResult> {
    const service = this.getService();
    
    const openaiParams: OpenAIParams = {
      prompt: params.prompt,
      size: params.size,
      quality: params.quality,
      style: params.style,
      textPosition: params.textPosition,
      mainText: params.mainText,
      subText: params.subText
    };
    
    const result = await service.generateImage(openaiParams);
    
    return {
      url: result.url,
      prompt: params.prompt,
      revisedPrompt: result.revisedPrompt,
      provider: 'openai'
    };
  }

  isConfigured(): boolean {
    return this.apiConfigManager.hasApiKey('openai');
  }

  getProviderName(): string {
    return 'OpenAI DALL-E 3';
  }
}


// Factory Implementation
export class ImageProviderFactory {
  private static providers: Record<ImageProvider, ImageProviderInterface> = {
    openai: new OpenAIProvider()
  };

  private static apiConfigManager = ApiConfigManager.getInstance();

  public static getProvider(providerType?: ImageProvider): ImageProviderInterface {
    const selectedProvider = 'openai'; // Always use OpenAI
    const provider = this.providers[selectedProvider];
    
    if (!provider) {
      throw new Error(`Provider ${selectedProvider} não encontrado`);
    }
    
    return provider;
  }

  public static async generateImage(
    params: UnifiedImageParams, 
    providerType?: ImageProvider
  ): Promise<UnifiedImageResult> {
    try {
      const provider = this.getProvider(providerType);
      
      if (!provider.isConfigured()) {
        throw new Error(`${provider.getProviderName()} não está configurado. Configure a chave API primeiro.`);
      }
      
      toast.loading(`Gerando imagem com ${provider.getProviderName()}...`);
      
      const result = await provider.generateImage(params);
      
      toast.dismiss();
      toast.success(`Imagem gerada com ${provider.getProviderName()}!`);
      
      return result;
    } catch (error) {
      toast.dismiss();
      console.error('Erro ao gerar imagem:', error);
      
      if (error instanceof Error) {
        toast.error(error.message);
        throw error;
      }
      
      toast.error('Erro desconhecido ao gerar imagem');
      throw new Error('Erro desconhecido ao gerar imagem');
    }
  }

  public static getAvailableProviders(): Array<{
    id: ImageProvider;
    name: string;
    configured: boolean;
    comingSoon: boolean;
  }> {
    return Object.entries(this.providers).map(([key, provider]) => ({
      id: key as ImageProvider,
      name: provider.getProviderName(),
      configured: provider.isConfigured(),
      comingSoon: false
    }));
  }

  public static validateProvider(providerType: ImageProvider): boolean {
    const provider = this.providers[providerType];
    return provider ? provider.isConfigured() : false;
  }
}