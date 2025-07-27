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
  aspect_ratio?: string;
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

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(params: HeyGenGenerateVideoParams): Promise<HeyGenGeneratedVideo> {
    console.log("HeyGen generateVideo called with params:", params);
    
    const voiceConfig: any = {
      type: "text",
      text: params.script,
      speed: 1.0
    };
    
    // Only add voice_id if it's provided and not empty
    if (params.voice_id && params.voice_id.trim() !== "") {
      voiceConfig.voice_id = params.voice_id;
    }
    
    const requestBody = {
      video_inputs: [{
        character: {
          type: "avatar",
          avatar_id: params.avatar_id || "d5d7bcf8fd334bdba1b34bd67a2fb652_public", // Default avatar
          scale: 1
        },
        voice: voiceConfig
      }],
      dimension: {
        width: 1920,
        height: 1080
      },
      aspect_ratio: params.aspect_ratio || "16:9"
    };

    console.log("HeyGen request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${this.baseUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    console.log("HeyGen API Response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("HeyGen API Error Response:", errorData);
      
      // More specific error messages
      let errorMessage = "Erro na geração do vídeo";
      if (errorData.error) {
        // Safely handle different error types
        const errorStr = typeof errorData.error === 'string' ? errorData.error : String(errorData.error);
        const error = errorStr.toLowerCase();
        if (error.includes("voice")) {
          errorMessage = "Voz inválida ou indisponível. Tente usar 'Auto' ou selecione outra voz.";
        } else if (error.includes("credit")) {
          errorMessage = "Créditos insuficientes na conta HeyGen.";
        } else if (error.includes("avatar")) {
          errorMessage = "Avatar inválido ou indisponível.";
        } else {
          errorMessage = `Erro HeyGen: ${errorData.error}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("HeyGen response data:", data);
    
    if (data.error) {
      throw new Error(data.error.message || 'Erro na geração do vídeo');
    }

    // Poll video status
    const videoId = data.data.video_id;
    return await this.pollVideoStatus(videoId);
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

        // Wait 3 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
        
        // Update user on progress
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
      { id: "d5d7bcf8fd334bdba1b34bd67a2fb652_public", name: 'Avatar Padrão', category: 'business' },
      { id: "Kristin_public_3_20240108", name: 'Apresentadora Profissional', category: 'business' },
      { id: "Tyler_public_20240711", name: 'Empresário Casual', category: 'business' },
      { id: "Susan_public_2_20240328", name: 'Mulher de Negócios', category: 'professional' },
      { id: "Wayne_20240711", name: 'Homem Confiável', category: 'trustworthy' },
    ];
  }

  static getRecommendedVoices() {
    return [
      { id: "auto", name: 'Auto (Deixar HeyGen escolher)', language: 'pt-BR' },
      { id: "11af9e82-2de0-4e6d-b222-6a81b7c3b3c3", name: 'Clara - Mulher Brasileira', language: 'pt-BR' },
      { id: "7b32c7e4-8b9d-4c2a-9f5e-3d1a2b3c4d5e", name: 'João - Homem Brasileiro', language: 'pt-BR' },
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