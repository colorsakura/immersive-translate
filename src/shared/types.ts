export type TranslatorName = 'google' | 'youdao' | 'openai';

export interface SourceConfigMap {
  google: {
    apiKey: string;
  };
  youdao: {
    appKey: string;
    appSecret: string;
  };
  openai: {
    apiKey: string;
    baseUrl: string;
    model: string;
    systemPrompt: string;
  };
}

export interface ExtensionSettings {
  sourceLang: string;
  targetLang: string;
  fallbackChain: TranslatorName[];
  sources: SourceConfigMap;
}

export interface TranslationResult {
  text: string;
  source: TranslatorName | string;
}
