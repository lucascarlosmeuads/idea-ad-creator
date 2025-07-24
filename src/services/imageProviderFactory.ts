import { OpenAIService, type GenerateImageParams as OpenAIParams, type GeneratedImage as OpenAIImage } from './openai';
import { RunwareService, type GenerateImageParams as RunwareParams, type GeneratedImage as RunwareImage } from './runware';
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
  private service: OpenAIService | null = null;
  private apiConfigManager = ApiConfigManager.getInstance();

  private getService(): OpenAIService {
    const apiKey = this.apiConfigManager.getApiKey('openai');
    if (!apiKey) {
      throw new Error('Chave API OpenAI não configurada');
    }
    
    if (!this.service) {
      this.service = new OpenAIService(apiKey);
    }
    
    return this.service;
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

// Runware Provider Implementation
class RunwareProvider implements ImageProviderInterface {
  private service: RunwareService | null = null;
  private apiConfigManager = ApiConfigManager.getInstance();

  private getService(): RunwareService {
    const apiKey = this.apiConfigManager.getApiKey('runware');
    if (!apiKey) {
      throw new Error('Chave API Runware não configurada');
    }
    
    if (!this.service) {
      this.service = new RunwareService(apiKey);
    }
    
    return this.service;
  }

  async generateImage(params: UnifiedImageParams): Promise<UnifiedImageResult> {
    const service = this.getService();
    
    const runwareParams: RunwareParams = {
      positivePrompt: params.prompt,
      model: "runware:100@1",
      numberResults: 1,
      outputFormat: "WEBP",
      CFGScale: params.guidance || 7,
      seed: params.seed || undefined
    };
    
    const result = await service.generateImage(runwareParams);
    
    return {
      url: result.imageURL,
      prompt: result.positivePrompt,
      seed: result.seed,
      provider: 'runware'
    };
  }

  isConfigured(): boolean {
    return this.apiConfigManager.hasApiKey('runware');
  }

  getProviderName(): string {
    return 'Runware AI';
  }
}

// Future providers can be added here
class RunwayProvider implements ImageProviderInterface {
  async generateImage(params: UnifiedImageParams): Promise<UnifiedImageResult> {
    throw new Error('Runway provider não implementado ainda');
  }

  isConfigured(): boolean {
    return false;
  }

  getProviderName(): string {
    return 'Runway ML (Em breve)';
  }
}

class MidjourneyProvider implements ImageProviderInterface {
  async generateImage(params: UnifiedImageParams): Promise<UnifiedImageResult> {
    throw new Error('Midjourney provider não implementado ainda');
  }

  isConfigured(): boolean {
    return false;
  }

  getProviderName(): string {
    return 'Midjourney (Em breve)';
  }
}

class ReplicateProvider implements ImageProviderInterface {
  async generateImage(params: UnifiedImageParams): Promise<UnifiedImageResult> {
    throw new Error('Replicate provider não implementado ainda');
  }

  isConfigured(): boolean {
    return false;
  }

  getProviderName(): string {
    return 'Replicate (Em breve)';
  }
}

// Factory Implementation
export class ImageProviderFactory {
  private static providers: Record<ImageProvider, ImageProviderInterface> = {
    openai: new OpenAIProvider(),
    runware: new RunwareProvider(),
    runway: new RunwayProvider(),
    midjourney: new MidjourneyProvider(),
    replicate: new ReplicateProvider()
  };

  private static apiConfigManager = ApiConfigManager.getInstance();

  public static getProvider(providerType?: ImageProvider): ImageProviderInterface {
    const selectedProvider = providerType || this.apiConfigManager.getSelectedImageProvider();
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
    key: ImageProvider;
    name: string;
    configured: boolean;
    comingSoon: boolean;
  }> {
    return Object.entries(this.providers).map(([key, provider]) => ({
      key: key as ImageProvider,
      name: provider.getProviderName(),
      configured: provider.isConfigured(),
      comingSoon: ['runway', 'midjourney', 'replicate'].includes(key)
    }));
  }

  public static validateProvider(providerType: ImageProvider): boolean {
    const provider = this.providers[providerType];
    return provider ? provider.isConfigured() : false;
  }
}