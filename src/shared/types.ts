export type TranslatorName = 'google' | 'youdao';

export interface SourceConfigMap {
  google: {
    apiKey: string;
  };
  youdao: {
    appKey: string;
    appSecret: string;
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
