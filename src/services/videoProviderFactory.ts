import { toast } from 'sonner';
import { ApiConfigManager } from './apiConfig';
import { HeyGenService } from './heygen';
import { RunwayService, type RunwayVideoParams } from './runway';

export type VideoProvider = 'heygen' | 'synthesia' | 'runway' | 'luma' | 'pika';

export interface UnifiedVideoParams {
  script?: string;
  image_url?: string;
  motion_prompt?: string;
  avatar?: string;
  voice?: string;
  background?: string;
  style?: 'professional' | 'casual' | 'energetic' | 'cinematic';
  duration?: number;
  format?: 'square' | 'vertical' | 'horizontal';
  resolution?: '720p' | '1080p' | '4k';
}

export interface UnifiedVideoResult {
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  format: string;
  provider: VideoProvider;
}

export interface VideoProviderInterface {
  generateVideo(params: UnifiedVideoParams): Promise<UnifiedVideoResult>;
  isConfigured(): boolean;
  getProviderName(): string;
}

// HeyGen Provider
class HeyGenProvider implements VideoProviderInterface {
  getProviderName(): string {
    return 'HeyGen';
  }

  isConfigured(): boolean {
    const apiManager = ApiConfigManager.getInstance();
    return apiManager.hasApiKey('heygen');
  }

  async generateVideo(params: UnifiedVideoParams): Promise<UnifiedVideoResult> {
    const apiManager = ApiConfigManager.getInstance();
    const apiKey = apiManager.getApiKey('heygen');
    
    if (!apiKey) {
      throw new Error('Chave API HeyGen não configurada');
    }

    const heygenService = new HeyGenService(apiKey);
    
    // Mapear formato para dimensões
    const dimensionMap = {
      square: { width: 1080, height: 1080 },
      vertical: { width: 1080, height: 1920 },
      horizontal: { width: 1920, height: 1080 }
    };

    const result = await heygenService.generateVideo({
      script: params.script,
      avatar_id: params.avatar,
      voice_id: params.voice,
      background: params.background,
      dimension: dimensionMap[params.format || 'vertical'],
      title: 'Anúncio de Vídeo'
    });

    return {
      video_url: result.video_url || '',
      thumbnail_url: result.thumbnail_url,
      duration: result.duration,
      format: params.format || 'vertical',
      provider: 'heygen'
    };
  }
}

// Synthesia Provider (placeholder)
class SynthesiaProvider implements VideoProviderInterface {
  getProviderName(): string {
    return 'Synthesia';
  }

  isConfigured(): boolean {
    const apiManager = ApiConfigManager.getInstance();
    return apiManager.hasApiKey('synthesia');
  }

  async generateVideo(params: UnifiedVideoParams): Promise<UnifiedVideoResult> {
    throw new Error('Synthesia provider ainda não implementado');
  }
}

// Runway Provider (usando o serviço existente)
class RunwayVideoProvider implements VideoProviderInterface {
  getProviderName(): string {
    return 'Runway ML';
  }

  isConfigured(): boolean {
    const apiManager = ApiConfigManager.getInstance();
    const hasKey = apiManager.hasApiKey('runway');
    console.log('[DEBUG] RunwayVideoProvider.isConfigured():', hasKey);
    return hasKey;
  }

  async generateVideo(params: UnifiedVideoParams): Promise<UnifiedVideoResult> {
    const apiManager = ApiConfigManager.getInstance();
    const apiKey = apiManager.getApiKey('runway');
    
    if (!apiKey) {
      throw new Error('Chave API Runway não configurada');
    }

    const runwayService = new RunwayService(apiKey);
    
    const runwayParams: RunwayVideoParams = {
      duration: params.duration || 5,
      seed: Math.floor(Math.random() * 1000000),
    };

    if (params.image_url) {
      runwayParams.image_url = params.image_url;
      runwayParams.motion_prompt = params.motion_prompt;
    } else {
      runwayParams.text_prompt = params.script;
    }

    const result = await runwayService.generateVideo(runwayParams);
    
    return {
      video_url: result.video_url,
      duration: params.duration || 5,
      format: params.format || 'vertical',
      provider: 'runway'
    };
  }
}

// Luma Provider (placeholder)
class LumaProvider implements VideoProviderInterface {
  getProviderName(): string {
    return 'Luma AI';
  }

  isConfigured(): boolean {
    const apiManager = ApiConfigManager.getInstance();
    return apiManager.hasApiKey('luma');
  }

  async generateVideo(params: UnifiedVideoParams): Promise<UnifiedVideoResult> {
    throw new Error('Luma provider ainda não implementado');
  }
}

// Pika Provider (placeholder)
class PikaProvider implements VideoProviderInterface {
  getProviderName(): string {
    return 'Pika Labs';
  }

  isConfigured(): boolean {
    const apiManager = ApiConfigManager.getInstance();
    return apiManager.hasApiKey('pika');
  }

  async generateVideo(params: UnifiedVideoParams): Promise<UnifiedVideoResult> {
    throw new Error('Pika provider ainda não implementado');
  }
}

export class VideoProviderFactory {
  private static providers: Map<VideoProvider, VideoProviderInterface> = new Map([
    ['heygen', new HeyGenProvider()],
    ['synthesia', new SynthesiaProvider()],
    ['runway', new RunwayVideoProvider()],
    ['luma', new LumaProvider()],
    ['pika', new PikaProvider()],
  ]);

  static getProvider(providerType?: VideoProvider): VideoProviderInterface {
    const apiManager = ApiConfigManager.getInstance();
    const settings = apiManager.getSettings();
    
    // Se não especificado, usa HeyGen como padrão
    const targetProvider = providerType || 'heygen';
    const provider = this.providers.get(targetProvider);
    
    if (!provider) {
      throw new Error(`Provedor de vídeo ${targetProvider} não encontrado`);
    }

    return provider;
  }

  static async generateVideo(
    params: UnifiedVideoParams, 
    providerType?: VideoProvider
  ): Promise<UnifiedVideoResult> {
    const provider = this.getProvider(providerType);
    
    if (!provider.isConfigured()) {
      throw new Error(`Provedor ${provider.getProviderName()} não está configurado`);
    }

    toast.loading(`Gerando vídeo com ${provider.getProviderName()}...`);
    
    try {
      const result = await provider.generateVideo(params);
      toast.dismiss();
      toast.success('Vídeo gerado com sucesso!');
      return result;
    } catch (error) {
      toast.dismiss();
      toast.error(`Erro na geração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      throw error;
    }
  }

  static getAvailableProviders() {
    const apiManager = ApiConfigManager.getInstance();
    
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.getProviderName(),
      configured: provider.isConfigured(),
      comingSoon: ['synthesia', 'luma', 'pika'].includes(id)
    }));
  }

  static validateProvider(providerType: VideoProvider): boolean {
    const provider = this.providers.get(providerType);
    return provider ? provider.isConfigured() : false;
  }

  static hasAnyVideoProviderConfigured(): boolean {
    return Array.from(this.providers.values()).some(provider => provider.isConfigured());
  }

  static getConfiguredProviders(): VideoProvider[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isConfigured())
      .map(([id, _]) => id);
  }
}