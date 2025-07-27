import { toast } from 'sonner';

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image: string;
  category: string;
}

export interface HeyGenVoice {
  voice_id: string;
  name: string;
  language: string;
  gender: string;
  preview_audio: string;
}

export interface HeyGenGenerateVideoParams {
  script: string;
  avatar_id?: string;
  voice_id?: string;
  background?: string;
  dimension?: {
    width: number;
    height: number;
  };
  duration?: number;
  title?: string;
}

export interface HeyGenGeneratedVideo {
  video_id: string;
  video_url?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  thumbnail_url?: string;
  duration?: number;
}

export class HeyGenService {
  private apiKey: string;
  private baseUrl = 'https://api.heygen.com/v2';

  // Avatares recomendados para anúncios em português
  public static readonly PORTUGUESE_AVATARS = {
    'apresentadora-profissional': 'Kristin_public_3_20240108',
    'empresario-casual': 'Tyler_public_20240711',
    'mulher-negocios': 'Susan_public_2_20240328',
    'homem-confiavel': 'Wayne_20240711',
    'mulher-jovem': 'Lily_public_3_20240108'
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(params: HeyGenGenerateVideoParams): Promise<HeyGenGeneratedVideo> {
    const avatarId = params.avatar_id || HeyGenService.PORTUGUESE_AVATARS['apresentadora-profissional'];
    
    try {
      const requestBody = {
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: avatarId,
              scale: 1.0,
            },
            voice: {
              type: 'text',
              input_text: params.script,
              voice_id: params.voice_id, // Remove default voice ID to let HeyGen choose
            },
            background: {
              type: 'color',
              value: params.background || '#ffffff',
            },
          },
        ],
        dimension: params.dimension || {
          width: 1080,
          height: 1920, // Formato vertical para stories/reels
        },
        aspect_ratio: null,
        title: params.title || 'Anúncio Gerado',
      };

      const response = await fetch(`${this.baseUrl}/video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Erro na geração do vídeo';
        
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message?.includes('voice')) {
            errorMessage = 'Voz não encontrada. Tentando novamente sem voz específica...';
          } else if (errorData.message?.includes('credit')) {
            errorMessage = 'Créditos insuficientes na conta HeyGen';
          } else if (errorData.message?.includes('avatar')) {
            errorMessage = 'Avatar não encontrado';
          }
        } catch (e) {
          // Keep default error message
        }
        
        throw new Error(`HeyGen API error: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Erro na geração do vídeo');
      }

      // Inicia o polling do status
      const videoId = data.data.video_id;
      return await this.pollVideoStatus(videoId);
      
    } catch (error) {
      console.error('Erro na geração de vídeo HeyGen:', error);
      throw new Error('Falha na geração de vídeo. Verifique sua chave API HeyGen.');
    }
  }

  private async pollVideoStatus(videoId: string, maxAttempts = 30): Promise<HeyGenGeneratedVideo> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/video/${videoId}`, {
          headers: {
            'X-API-Key': this.apiKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao verificar status: ${response.status}`);
        }

        const data = await response.json();
        const status = data.data.status;

        if (status === 'completed') {
          return {
            video_id: videoId,
            video_url: data.data.video_url,
            status: 'completed',
            thumbnail_url: data.data.thumbnail_url,
            duration: data.data.duration,
          };
        }

        if (status === 'failed') {
          throw new Error('Falha na geração do vídeo');
        }

        // Aguarda 3 segundos antes da próxima verificação
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
        
        // Atualiza o usuário sobre o progresso
        if (attempts % 5 === 0) {
          toast.loading(`Gerando vídeo... ${Math.round((attempts / maxAttempts) * 100)}%`);
        }
        
      } catch (error) {
        console.error('Erro ao verificar status do vídeo:', error);
        attempts++;
      }
    }

    throw new Error('Timeout na geração do vídeo. Tente novamente.');
  }

  async getAvatars(): Promise<HeyGenAvatar[]> {
    try {
      const response = await fetch(`${this.baseUrl}/avatars`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar avatares: ${response.status}`);
      }

      const data = await response.json();
      return data.data.avatars;
    } catch (error) {
      console.error('Erro ao buscar avatares:', error);
      throw new Error('Falha ao carregar avatares disponíveis.');
    }
  }

  async getVoices(): Promise<HeyGenVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar vozes: ${response.status}`);
      }

      const data = await response.json();
      return data.data.voices.filter((voice: any) => 
        voice.language.includes('pt') || voice.language.includes('Portuguese')
      );
    } catch (error) {
      console.error('Erro ao buscar vozes:', error);
      return []; // Return empty array if voices fetch fails
    }
  }

  static getRecommendedAvatars() {
    return [
      { id: HeyGenService.PORTUGUESE_AVATARS['apresentadora-profissional'], name: 'Apresentadora Profissional', category: 'business' },
      { id: HeyGenService.PORTUGUESE_AVATARS['empresario-casual'], name: 'Empresário Casual', category: 'business' },
      { id: HeyGenService.PORTUGUESE_AVATARS['mulher-negocios'], name: 'Mulher de Negócios', category: 'professional' },
      { id: HeyGenService.PORTUGUESE_AVATARS['homem-confiavel'], name: 'Homem Confiável', category: 'trustworthy' },
      { id: HeyGenService.PORTUGUESE_AVATARS['mulher-jovem'], name: 'Mulher Jovem', category: 'modern' },
    ];
  }

  static getRecommendedVoices() {
    return [
      { id: '11af9e82-2de0-4e6d-b222-6a81b7c3b3c3', name: 'Clara - Mulher Brasileira', language: 'pt-BR' },
      { id: '7b32c7e4-8b9d-4c2a-9f5e-3d1a2b3c4d5e', name: 'João - Homem Brasileiro', language: 'pt-BR' },
      { id: '9c41d8f7-1e2d-4b8c-a7f6-8e9f0a1b2c3d', name: 'Ana - Mulher Portuguesa', language: 'pt-PT' },
    ];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/avatars`, {
        headers: {
          'X-API-Key': this.apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}