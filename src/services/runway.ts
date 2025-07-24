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

interface RunwayTaskResponse {
  id: string;
}

interface RunwayTaskResult {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  image?: string;
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
}