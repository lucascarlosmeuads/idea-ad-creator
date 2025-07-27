import { toast } from 'sonner';

export interface HeyGenAvatar {
  avatar_id: string;
  avatar_name: string;
  preview_image: string;
  category: string;
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
              voice_id: params.voice_id || 'de2eb8de7a4544c1b6c4b5a1db6a63ae', // Voz em português
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
        const error = await response.text();
        throw new Error(`HeyGen API error: ${response.status} - ${error}`);
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

  static getRecommendedAvatars() {
    return [
      { id: HeyGenService.PORTUGUESE_AVATARS['apresentadora-profissional'], name: 'Apresentadora Profissional', category: 'business' },
      { id: HeyGenService.PORTUGUESE_AVATARS['empresario-casual'], name: 'Empresário Casual', category: 'business' },
      { id: HeyGenService.PORTUGUESE_AVATARS['mulher-negocios'], name: 'Mulher de Negócios', category: 'professional' },
      { id: HeyGenService.PORTUGUESE_AVATARS['homem-confiavel'], name: 'Homem Confiável', category: 'trustworthy' },
      { id: HeyGenService.PORTUGUESE_AVATARS['mulher-jovem'], name: 'Mulher Jovem', category: 'modern' },
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