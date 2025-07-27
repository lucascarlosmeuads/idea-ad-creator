import { toast } from 'sonner';

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
  category: string;
  labels: { [key: string]: string };
}

export interface TextToSpeechParams {
  text: string;
  voice_id?: string;
  model_id?: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface GeneratedAudio {
  audio_url: string;
  audio_blob?: Blob;
}

export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  // Vozes em português recomendadas
  public static readonly PORTUGUESE_VOICES = {
    'masculina-profissional': '9BWtsMINqrJLrRacOk9x', // Aria
    'feminina-comercial': 'EXAVITQu4vr4xnSDxMaL', // Sarah
    'masculina-energetica': 'CwhRBWXzGAHq8TQ4Fs17', // Roger
    'feminina-suave': 'FGY2WhTYpPnrIDTdsKH5', // Laura
    'masculina-casual': 'IKne3meq5aSn9XLyUdCD', // Charlie
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateSpeech(params: TextToSpeechParams): Promise<GeneratedAudio> {
    const voiceId = params.voice_id || ElevenLabsService.PORTUGUESE_VOICES['feminina-comercial'];
    
    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text: params.text,
          model_id: params.model_id || 'eleven_multilingual_v2',
          voice_settings: params.voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      return {
        audio_url: audioUrl,
        audio_blob: audioBlob
      };
    } catch (error) {
      console.error('Erro na geração de áudio:', error);
      throw new Error('Falha na geração de áudio. Verifique sua chave API ElevenLabs.');
    }
  }

  async getVoices(): Promise<ElevenLabsVoice[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar vozes: ${response.status}`);
      }

      const data = await response.json();
      return data.voices;
    } catch (error) {
      console.error('Erro ao buscar vozes:', error);
      throw new Error('Falha ao carregar vozes disponíveis.');
    }
  }

  static getPortugueseVoices() {
    return [
      { id: ElevenLabsService.PORTUGUESE_VOICES['feminina-comercial'], name: 'Feminina Comercial (Sarah)', category: 'professional' },
      { id: ElevenLabsService.PORTUGUESE_VOICES['masculina-profissional'], name: 'Masculina Profissional (Aria)', category: 'professional' },
      { id: ElevenLabsService.PORTUGUESE_VOICES['masculina-energetica'], name: 'Masculina Energética (Roger)', category: 'energetic' },
      { id: ElevenLabsService.PORTUGUESE_VOICES['feminina-suave'], name: 'Feminina Suave (Laura)', category: 'soft' },
      { id: ElevenLabsService.PORTUGUESE_VOICES['masculina-casual'], name: 'Masculina Casual (Charlie)', category: 'casual' },
    ];
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}