import { toast } from 'sonner';

export interface ApiConfig {
  openai?: string;
  runware?: string;
  // Future APIs
  runway?: string;
  midjourney?: string;
  replicate?: string;
  claude?: string;
  gemini?: string;
}

export type ImageProvider = 'openai' | 'runware' | 'runway' | 'midjourney' | 'replicate';
export type TextProvider = 'openai' | 'claude' | 'gemini';

export interface ApiSettings {
  config: ApiConfig;
  selectedImageProvider: ImageProvider;
  selectedTextProvider: TextProvider;
}

const STORAGE_KEY = 'ad_creator_api_settings';

export class ApiConfigManager {
  private static instance: ApiConfigManager;
  private settings: ApiSettings;
  private listeners: Array<(settings: ApiSettings) => void> = [];

  private constructor() {
    this.settings = this.loadSettings();
  }

  public static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager();
    }
    return ApiConfigManager.instance;
  }

  private loadSettings(): ApiSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
    
    return {
      config: {},
      selectedImageProvider: 'openai',
      selectedTextProvider: 'openai'
    };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      this.notifyListeners();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.settings));
  }

  public getSettings(): ApiSettings {
    return { ...this.settings };
  }

  public updateApiKey(provider: keyof ApiConfig, apiKey: string): void {
    this.settings.config[provider] = apiKey;
    this.saveSettings();
    toast.success(`Chave API ${provider.toUpperCase()} atualizada`);
  }

  public removeApiKey(provider: keyof ApiConfig): void {
    delete this.settings.config[provider];
    this.saveSettings();
    toast.success(`Chave API ${provider.toUpperCase()} removida`);
  }

  public setImageProvider(provider: ImageProvider): void {
    this.settings.selectedImageProvider = provider;
    this.saveSettings();
    toast.success(`Provedor de imagem alterado para ${provider.toUpperCase()}`);
  }

  public setTextProvider(provider: TextProvider): void {
    this.settings.selectedTextProvider = provider;
    this.saveSettings();
    toast.success(`Provedor de texto alterado para ${provider.toUpperCase()}`);
  }

  public getApiKey(provider: keyof ApiConfig): string | undefined {
    return this.settings.config[provider];
  }

  public hasApiKey(provider: keyof ApiConfig): boolean {
    return !!this.settings.config[provider]?.trim();
  }

  public getSelectedImageProvider(): ImageProvider {
    return this.settings.selectedImageProvider;
  }

  public getSelectedTextProvider(): TextProvider {
    return this.settings.selectedTextProvider;
  }

  public validateApiKey(provider: keyof ApiConfig, apiKey: string): boolean {
    switch (provider) {
      case 'openai':
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      case 'runware':
        return apiKey.length > 10;
      case 'runway':
        return apiKey.length > 10;
      case 'midjourney':
        return apiKey.length > 10;
      case 'replicate':
        return apiKey.startsWith('r8_') && apiKey.length > 20;
      case 'claude':
        return apiKey.startsWith('sk-') && apiKey.length > 20;
      case 'gemini':
        return apiKey.length > 10;
      default:
        return apiKey.length > 0;
    }
  }

  public subscribe(listener: (settings: ApiSettings) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public clearAllSettings(): void {
    this.settings = {
      config: {},
      selectedImageProvider: 'openai',
      selectedTextProvider: 'openai'
    };
    this.saveSettings();
    toast.success('Todas as configurações foram limpas');
  }

  public exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  public importSettings(settingsJson: string): boolean {
    try {
      const imported = JSON.parse(settingsJson);
      if (imported.config && imported.selectedImageProvider) {
        // Ensure backward compatibility
        if (!imported.selectedTextProvider) {
          imported.selectedTextProvider = 'openai';
        }
        this.settings = imported;
        this.saveSettings();
        toast.success('Configurações importadas com sucesso');
        return true;
      }
      throw new Error('Formato inválido');
    } catch (error) {
      toast.error('Erro ao importar configurações');
      return false;
    }
  }
}