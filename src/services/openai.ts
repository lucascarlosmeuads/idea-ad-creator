import { toast } from "sonner";

export interface GenerateImageParams {
  prompt: string;
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  textPosition?: "center" | "top" | "bottom" | "left" | "right";
  mainText?: string;
  subText?: string;
}

export interface GeneratedImage {
  url: string;
  revisedPrompt: string;
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateImage(params: GenerateImageParams): Promise<GeneratedImage> {
    const enhancedPrompt = this.buildPromptWithText(params);

    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: params.size || "1024x1024",
          quality: params.quality || "hd",
          style: params.style || "vivid",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Erro ao gerar imagem");
      }

      const data = await response.json();
      return {
        url: data.data[0].url,
        revisedPrompt: data.data[0].revised_prompt,
      };
    } catch (error) {
      console.error("Erro na API OpenAI:", error);
      throw error;
    }
  }

  private buildPromptWithText(params: GenerateImageParams): string {
    let prompt = params.prompt;

    if (params.mainText || params.subText) {
      const textInstruction = this.getTextPositionInstruction(params.textPosition || "center");
      
      if (params.mainText && params.subText) {
        prompt += `. Include text elements: "${params.mainText}" as the main heading in large, bold letters ${textInstruction}, and "${params.subText}" as smaller descriptive text below it. Make sure the text is clearly readable and professionally styled.`;
      } else if (params.mainText) {
        prompt += `. Include the text "${params.mainText}" prominently displayed ${textInstruction} in large, bold, readable letters that complement the overall design.`;
      } else if (params.subText) {
        prompt += `. Include the text "${params.subText}" ${textInstruction} in clear, readable letters.`;
      }

      prompt += ` The text should be perfectly integrated into the design, not overlaid. Use professional typography that matches the overall aesthetic.`;
    }

    return prompt;
  }

  private getTextPositionInstruction(position: string): string {
    switch (position) {
      case "top":
        return "at the top of the image";
      case "bottom":
        return "at the bottom of the image";
      case "left":
        return "on the left side of the image";
      case "right":
        return "on the right side of the image";
      case "center":
      default:
        return "in the center of the image";
    }
  }
}