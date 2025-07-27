export interface RunwayGenerateImageParams {
  prompt: string;
  model?: string;
  seed?: number;
  referenceImages?: Array<{
    uri: string;
    tag?: string;
  }>;
}

export interface RunwayGeneratedImage {
  url: string;
  seed?: number;
  prompt: string;
  taskId: string;
}

export interface RunwayVideoParams {
  text_prompt?: string;
  image_url?: string;
  seed?: number;
  duration?: number;
  motion_prompt?: string;
}

export interface RunwayVideoResult {
  id: string;
  video_url: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  created_at: string;
}

interface RunwayTaskResponse {
  id: string;
}

interface RunwayTaskResult {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  image?: string;
  output?: string[];
  failureReason?: string;
  seed?: number;
}

export class RunwayService {
  private apiKey: string;
  private baseUrl = 'https://api.dev.runwayml.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(params: RunwayGenerateImageParams): Promise<RunwayGeneratedImage> {
    try {
      // Start generation task
      const taskResponse = await fetch(`${this.baseUrl}/text_to_image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: params.prompt,
          model: params.model || 'gen4_image',
          seed: params.seed,
          referenceImages: params.referenceImages
        }),
      });

      if (!taskResponse.ok) {
        const errorText = await taskResponse.text();
        throw new Error(`Runway API erro: ${taskResponse.status} - ${errorText}`);
      }

      const task: RunwayTaskResponse = await taskResponse.json();

      // Poll for completion
      const result = await this.pollForCompletion(task.id);

      if (result.status === 'FAILED') {
        throw new Error(`Geração falhou: ${result.failureReason || 'Erro desconhecido'}`);
      }

      if (!result.image) {
        throw new Error('Nenhuma imagem retornada');
      }

      return {
        url: result.image,
        seed: result.seed,
        prompt: params.prompt,
        taskId: result.id
      };
    } catch (error) {
      console.error('Runway service error:', error);
      throw error;
    }
  }

  private async pollForCompletion(taskId: string, maxAttempts = 30): Promise<RunwayTaskResult> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao verificar status: ${response.status}`);
      }

      const result: RunwayTaskResult = await response.json();

      if (result.status === 'SUCCEEDED' || result.status === 'FAILED') {
        return result;
      }

      // Wait 2 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    }

    throw new Error('Timeout: Geração levou muito tempo para completar');
  }

  async generateVideo(params: RunwayVideoParams): Promise<RunwayVideoResult> {
    try {
      const endpoint = params.image_url ? '/image_to_video' : '/text_to_video';
      const body: any = {
        model: 'gen3a_turbo',
        seed: params.seed || Math.floor(Math.random() * 1000000),
        duration: params.duration || 5,
      };

      if (params.image_url) {
        body.image_url = params.image_url;
        if (params.motion_prompt) {
          body.prompt = params.motion_prompt;
        }
      } else {
        body.prompt = params.text_prompt;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runway Video API error: ${response.status} - ${error}`);
      }

      const task = await response.json();
      
      // Poll for completion
      const result = await this.pollForVideoCompletion(task.id);
      
      if (result.status === 'FAILED') {
        throw new Error(`Geração de vídeo falhou: ${result.failureReason || 'Erro desconhecido'}`);
      }

      if (!result.output || result.output.length === 0) {
        throw new Error('Nenhum vídeo retornado');
      }

      return {
        id: result.id,
        video_url: result.output[0],
        status: 'SUCCEEDED',
        created_at: new Date().toISOString(),
      };
      
    } catch (error) {
      console.error('Erro na geração de vídeo Runway:', error);
      const errorMessage = params.image_url 
        ? 'Falha na animação da imagem Runway. Verifique sua chave API.'
        : 'Falha na geração de vídeo Runway. Verifique sua chave API.';
      throw new Error(errorMessage);
    }
  }

  private async pollForVideoCompletion(taskId: string, maxAttempts = 60): Promise<RunwayTaskResult> {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-Runway-Version': '2024-11-06',
          },
        });

        if (!response.ok) {
          throw new Error(`Erro ao verificar status: ${response.status}`);
        }

        const result: RunwayTaskResult = await response.json();

        if (result.status === 'SUCCEEDED' || result.status === 'FAILED') {
          return result;
        }

        // Wait 5 seconds for video generation (takes longer than images)
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
        
      } catch (error) {
        console.error('Erro ao verificar status do vídeo:', error);
        attempts++;
      }
    }

    throw new Error('Timeout na geração do vídeo Runway. Tente novamente.');
  }

  async generateVideoFromImage(imageUrl: string, motionPrompt?: string, duration?: number): Promise<RunwayVideoResult> {
    return this.generateVideo({
      image_url: imageUrl,
      motion_prompt: motionPrompt,
      duration: duration || 5,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Erro ao testar conexão com Runway:', error);
      return false;
    }
  }
}