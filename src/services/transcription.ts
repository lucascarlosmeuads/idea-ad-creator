import { toast } from 'sonner';

export interface TranscriptionOptions {
  language?: string;
  model?: 'whisper-1';
  temperature?: number;
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

export class TranscriptionService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribeAudio(
    audioBlob: Blob, 
    options: TranscriptionOptions = {}
  ): Promise<TranscriptionResult> {
    try {
      // Convert webm to a format OpenAI accepts
      const audioFile = await this.convertToSupportedFormat(audioBlob);
      
      const formData = new FormData();
      formData.append('file', audioFile, 'recording.mp3');
      formData.append('model', options.model || 'whisper-1');
      
      if (options.language) {
        formData.append('language', options.language);
      }
      
      if (options.temperature) {
        formData.append('temperature', options.temperature.toString());
      }
      
      formData.append('response_format', options.response_format || 'verbose_json');

      const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erro na transcrição');
      }

      const result = await response.json();
      
      if (options.response_format === 'verbose_json') {
        return {
          text: result.text,
          language: result.language,
          duration: result.duration
        };
      }
      
      return {
        text: typeof result === 'string' ? result : result.text
      };
    } catch (error) {
      console.error('Erro na transcrição:', error);
      throw new Error('Falha na transcrição do áudio. Verifique sua chave API e tente novamente.');
    }
  }

  private async convertToSupportedFormat(audioBlob: Blob): Promise<File> {
    // For now, we'll create a File object with mp3 extension
    // In a real implementation, you might want to use FFmpeg.js for actual conversion
    return new File([audioBlob], 'recording.mp3', { 
      type: 'audio/mpeg' 
    });
  }

  async transcribeWithProgress(
    audioBlob: Blob,
    options: TranscriptionOptions = {},
    onProgress?: (status: string) => void
  ): Promise<TranscriptionResult> {
    try {
      onProgress?.('Preparando áudio...');
      
      // Simulate some processing time for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onProgress?.('Enviando para transcrição...');
      
      const result = await this.transcribeAudio(audioBlob, options);
      
      onProgress?.('Transcrição concluída!');
      
      return result;
    } catch (error) {
      onProgress?.('Erro na transcrição');
      throw error;
    }
  }

  validateAudioFile(file: Blob): boolean {
    const maxSize = 25 * 1024 * 1024; // 25MB limit for OpenAI Whisper
    
    if (file.size > maxSize) {
      toast.error('Arquivo de áudio muito grande (máximo 25MB)');
      return false;
    }
    
    return true;
  }

  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'pt', name: 'Português' },
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'it', name: 'Italiano' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'zh', name: '中文' },
      { code: 'ru', name: 'Русский' },
      { code: 'ar', name: 'العربية' },
      { code: 'hi', name: 'हिन्दी' }
    ];
  }
}