import { toast } from 'sonner';
import { ApiConfigManager } from './apiConfig';
import { OpenAIService } from './openai';
import type { BusinessAnalysis, AdPromptElements, MultipleAdOptions } from './openai';

export type TextProvider = 'openai' | 'claude' | 'gemini';

export interface UnifiedTextParams {
  documentText?: string;
  businessAnalysis?: BusinessAnalysis;
}

export interface TextProviderInterface {
  analyzeBusinessDocument(documentText: string): Promise<BusinessAnalysis>;
  generateAdPrompt(analysis: BusinessAnalysis): Promise<AdPromptElements>;
  generateMultipleAdOptions(analysis: BusinessAnalysis): Promise<MultipleAdOptions>;
  isConfigured(): boolean;
  getProviderName(): string;
}

// OpenAI Text Provider
class OpenAITextProvider implements TextProviderInterface {
  private service: OpenAIService | null = null;

  constructor() {
    const apiManager = ApiConfigManager.getInstance();
    const apiKey = apiManager.getApiKey('openai');
    if (apiKey) {
      this.service = new OpenAIService(apiKey);
    }
  }

  async analyzeBusinessDocument(documentText: string): Promise<BusinessAnalysis> {
    if (!this.service) throw new Error('OpenAI não configurado');
    return this.service.analyzeBusinessDocument(documentText);
  }

  async generateAdPrompt(analysis: BusinessAnalysis): Promise<AdPromptElements> {
    if (!this.service) throw new Error('OpenAI não configurado');
    return this.service.generateAdPrompt(analysis);
  }

  async generateMultipleAdOptions(analysis: BusinessAnalysis): Promise<MultipleAdOptions> {
    if (!this.service) throw new Error('OpenAI não configurado');
    return this.service.generateMultipleAdOptions(analysis);
  }

  isConfigured(): boolean {
    const apiManager = ApiConfigManager.getInstance();
    return apiManager.hasApiKey('openai');
  }

  getProviderName(): string {
    return 'OpenAI GPT-4';
  }
}

// Placeholder providers for future implementation
class ClaudeTextProvider implements TextProviderInterface {
  async analyzeBusinessDocument(documentText: string): Promise<BusinessAnalysis> {
    throw new Error('Claude provider not implemented yet');
  }

  async generateAdPrompt(analysis: BusinessAnalysis): Promise<AdPromptElements> {
    throw new Error('Claude provider not implemented yet');
  }

  async generateMultipleAdOptions(analysis: BusinessAnalysis): Promise<MultipleAdOptions> {
    throw new Error('Claude provider not implemented yet');
  }

  isConfigured(): boolean {
    return false;
  }

  getProviderName(): string {
    return 'Claude (Em breve)';
  }
}

class GeminiTextProvider implements TextProviderInterface {
  async analyzeBusinessDocument(documentText: string): Promise<BusinessAnalysis> {
    throw new Error('Gemini provider not implemented yet');
  }

  async generateAdPrompt(analysis: BusinessAnalysis): Promise<AdPromptElements> {
    throw new Error('Gemini provider not implemented yet');
  }

  async generateMultipleAdOptions(analysis: BusinessAnalysis): Promise<MultipleAdOptions> {
    throw new Error('Gemini provider not implemented yet');
  }

  isConfigured(): boolean {
    return false;
  }

  getProviderName(): string {
    return 'Gemini (Em breve)';
  }
}

export class TextProviderFactory {
  private static providers: Map<TextProvider, TextProviderInterface> = new Map([
    ['openai', new OpenAITextProvider()],
    ['claude', new ClaudeTextProvider()],
    ['gemini', new GeminiTextProvider()],
  ]);

  public static getProvider(providerType?: TextProvider): TextProviderInterface {
    const apiManager = ApiConfigManager.getInstance();
    const selectedProvider = providerType || apiManager.getSelectedTextProvider();
    
    const provider = this.providers.get(selectedProvider);
    if (!provider) {
      throw new Error(`Provedor de texto não encontrado: ${selectedProvider}`);
    }
    
    return provider;
  }

  public static async analyzeBusinessDocument(
    documentText: string, 
    providerType?: TextProvider
  ): Promise<BusinessAnalysis> {
    const provider = this.getProvider(providerType);
    
    if (!provider.isConfigured()) {
      const message = `${provider.getProviderName()} não está configurado. Configure a API key nas configurações.`;
      toast.error(message);
      throw new Error(message);
    }

    return provider.analyzeBusinessDocument(documentText);
  }

  public static async generateAdPrompt(
    analysis: BusinessAnalysis, 
    providerType?: TextProvider
  ): Promise<AdPromptElements> {
    const provider = this.getProvider(providerType);
    
    if (!provider.isConfigured()) {
      const message = `${provider.getProviderName()} não está configurado. Configure a API key nas configurações.`;
      toast.error(message);
      throw new Error(message);
    }

    return provider.generateAdPrompt(analysis);
  }

  public static async generateMultipleAdOptions(
    analysis: BusinessAnalysis, 
    providerType?: TextProvider
  ): Promise<MultipleAdOptions> {
    const provider = this.getProvider(providerType);
    
    if (!provider.isConfigured()) {
      const message = `${provider.getProviderName()} não está configurado. Configure a API key nas configurações.`;
      toast.error(message);
      throw new Error(message);
    }

    return provider.generateMultipleAdOptions(analysis);
  }

  public static getAvailableProviders(): Array<{
    id: TextProvider;
    name: string;
    configured: boolean;
    comingSoon: boolean;
  }> {
    return Array.from(this.providers.entries()).map(([id, provider]) => ({
      id,
      name: provider.getProviderName(),
      configured: provider.isConfigured(),
      comingSoon: id !== 'openai',
    }));
  }

  public static validateProvider(providerType: TextProvider): boolean {
    const provider = this.providers.get(providerType);
    return provider ? provider.isConfigured() : false;
  }
}