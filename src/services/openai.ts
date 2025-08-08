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

export interface BusinessAnalysis {
  businessType: string;
  targetAudience: string;
  painPoints: string[];
  uniqueValue: string;
  persuasionOpportunities: string[];
}

export interface AdPromptElements {
  topPhrase: string;
  imageDescription: string;
  bottomCTA: string;
  completePrompt: string;
}

export interface MultipleAdOptions {
  topPhrases: string[];
  imageDescriptions: string[];
  bottomCTAs: string[];
}

export class OpenAIService {
  private apiKey: string;
  private baseUrl = "https://api.openai.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async analyzeBusinessDocument(documentText: string): Promise<BusinessAnalysis> {
    const prompt = `
Analise o seguinte documento de negócio e extraia informações estratégicas para criação de anúncios persuasivos:

DOCUMENTO:
${documentText}

Forneça a análise em formato JSON com os seguintes campos:
{
  "businessType": "Tipo específico do negócio",
  "targetAudience": "Perfil detalhado do público-alvo",
  "painPoints": ["Dor principal 1", "Dor principal 2", "Dor principal 3"],
  "uniqueValue": "Principal diferencial/proposta de valor",
  "persuasionOpportunities": ["Oportunidade 1", "Oportunidade 2", "Oportunidade 3"]
}

Responda APENAS com o JSON válido, sem texto adicional.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-2025-04-14",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Erro ao analisar documento");
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      return JSON.parse(analysisText);
    } catch (error) {
      console.error("Erro ao analisar documento:", error);
      throw new Error("Falha na análise do documento. Verifique sua chave API e tente novamente.");
    }
  }

  async generateMultipleAdOptions(analysis: BusinessAnalysis): Promise<MultipleAdOptions> {
    const prompt = `
Com base na análise do negócio, crie MÚLTIPLAS OPÇÕES para um anúncio Meta Ads formato Instagram:

ANÁLISE DO NEGÓCIO:
- Tipo: ${analysis.businessType}
- Público: ${analysis.targetAudience}
- Dores: ${analysis.painPoints.join(', ')}
- Valor Único: ${analysis.uniqueValue}
- Oportunidades: ${analysis.persuasionOpportunities.join(', ')}

Gere 7 OPÇÕES de cada elemento:

1. FRASES DE TOPO: Extremamente agressivas, sensacionalistas, geradoras de cliques (máximo 8 palavras cada)
2. CONCEITOS VISUAIS: Imagens contraintuitivas e impactantes que chamam atenção no feed do Instagram
3. CALLS-TO-ACTION: Frases curtas e intrigantes (máximo 6 palavras cada)

FORMATO OBRIGATÓRIO - responda APENAS o JSON:
{
  "topPhrases": [
    "Frase sensacionalista 1",
    "Frase sensacionalista 2",
    "Frase sensacionalista 3",
    "Frase sensacionalista 4",
    "Frase sensacionalista 5",
    "Frase sensacionalista 6",
    "Frase sensacionalista 7"
  ],
  "imageDescriptions": [
    "Conceito visual contraintuitivo 1 para Instagram",
    "Conceito visual contraintuitivo 2 para Instagram",
    "Conceito visual contraintuitivo 3 para Instagram",
    "Conceito visual contraintuitivo 4 para Instagram",
    "Conceito visual contraintuitivo 5 para Instagram",
    "Conceito visual contraintuitivo 6 para Instagram",
    "Conceito visual contraintuitivo 7 para Instagram"
  ],
  "bottomCTAs": [
    "CTA intrigante 1",
    "CTA intrigante 2", 
    "CTA intrigante 3",
    "CTA intrigante 4",
    "CTA intrigante 5",
    "CTA intrigante 6",
    "CTA intrigante 7"
  ]
}

REGRAS:
- Português brasileiro perfeito
- Sensacionalismo sem ofensividade
- Incongruência visual para parar o scroll
- Foco total em curiosidade extrema
- Formato Instagram 1080x1080`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-2025-04-14",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Erro ao gerar opções múltiplas");
      }

      const data = await response.json();
      let optionsText = data.choices[0].message.content;
      
      // Remove markdown formatting if present
      optionsText = optionsText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(optionsText);
    } catch (error) {
      console.error("Erro ao gerar opções múltiplas:", error);
      throw new Error("Falha na geração de opções múltiplas. Tente novamente.");
    }
  }

  async generateAdPrompt(analysis: BusinessAnalysis): Promise<AdPromptElements> {
    const prompt = `
Com base na análise do negócio, crie elementos para um anúncio altamente persuasivo e sensacionalista:

ANÁLISE DO NEGÓCIO:
- Tipo: ${analysis.businessType}
- Público: ${analysis.targetAudience}
- Dores: ${analysis.painPoints.join(', ')}
- Valor Único: ${analysis.uniqueValue}
- Oportunidades: ${analysis.persuasionOpportunities.join(', ')}

Crie um anúncio com:

1. FRASE DE TOPO: Uma frase extremamente agressiva, sensacionalista e geradora de cliques (máximo 8 palavras)
2. DESCRIÇÃO DA IMAGEM: Conceito visual com incongruência criativa e impactante
3. CALL-TO-ACTION: Frase curta e intrigante na parte inferior (máximo 6 palavras)

Formate a resposta em JSON:
{
  "topPhrase": "Frase de topo sensacionalista",
  "imageDescription": "Descrição detalhada da imagem com incongruência criativa",
  "bottomCTA": "Call-to-action intrigante",
  "completePrompt": "Prompt completo unificado para geração da imagem incluindo a frase de topo '...' no centro da imagem e o CTA '...' na parte inferior, com a descrição visual criativa"
}

IMPORTANTE: 
- Use português brasileiro perfeito
- Seja sensacionalista mas não ofensivo
- Crie incongruência visual interessante
- Foque em gerar curiosidade extrema
- No completePrompt, integre TUDO em um prompt único para DALL-E
- Responda APENAS com JSON válido`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4.1-2025-04-14",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Erro ao gerar prompt do anúncio");
      }

      const data = await response.json();
      let promptText = data.choices[0].message.content;
      
      // Remove markdown formatting if present
      promptText = promptText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      return JSON.parse(promptText);
    } catch (error) {
      console.error("Erro ao gerar prompt do anúncio:", error);
      throw new Error("Falha na geração do prompt. Tente novamente.");
    }
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
        prompt += `. Render the EXACT following texts inside the image (embedded in the scene, not as a UI overlay): Main heading: "${params.mainText}" ${textInstruction}, in large, bold, high-contrast typography; Subtext/CTA: "${params.subText}" positioned directly below the heading. The texts must be verbatim (do not translate, paraphrase, or alter characters, casing, or punctuation). Do not add quotation marks. Ensure perfect legibility and professional typography.`;
      } else if (params.mainText) {
        prompt += `. Render the EXACT text "${params.mainText}" ${textInstruction}, embedded within the image, large, bold, high-contrast, and perfectly legible. Do not translate, paraphrase, or alter characters; do not add quotes.`;
      } else if (params.subText) {
        prompt += `. Render the EXACT text "${params.subText}" ${textInstruction}, embedded within the image, clear and high-contrast. Do not translate, paraphrase, or alter characters; do not add quotes.`;
      }

      prompt += ` Use professional, modern typography that fits the design. The text must be in Portuguese (pt-BR), integrated into the composition (not floating or watermarked), and not cropped or obscured. Avoid placeholder or dummy text.`;
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
        return "centered both vertically and horizontally";
    }
  }
}