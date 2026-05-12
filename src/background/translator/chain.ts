import type { ExtensionSettings, TranslationResult, TranslatorName } from '../../shared/types';
import { googleTranslator } from './google';
import { mapGoogleLang, mapOpenAILang, mapYoudaoLang } from './languages';
import { openaiTranslator } from './openai';
import type { SourceConfig, TranslationSource } from './types';
import { TranslationError } from './types';
import { youdaoTranslator } from './youdao';

const SOURCES: Record<TranslatorName, TranslationSource> = {
  google: googleTranslator,
  youdao: youdaoTranslator,
  openai: openaiTranslator,
};

function mapLanguages(
  sourceName: TranslatorName,
  sourceLang: string,
  targetLang: string,
): { source: string; target: string } {
  if (sourceName === 'google') {
    return {
      source: mapGoogleLang(sourceLang) || '',
      target: mapGoogleLang(targetLang) || targetLang,
    };
  }
  if (sourceName === 'openai') {
    return {
      source: mapOpenAILang(sourceLang),
      target: mapOpenAILang(targetLang),
    };
  }
  return {
    source: mapYoudaoLang(sourceLang),
    target: mapYoudaoLang(targetLang),
  };
}

function getSourceConfig(settings: ExtensionSettings, sourceName: TranslatorName): SourceConfig {
  return settings.sources[sourceName];
}

export async function translateWithFallback(
  text: string,
  settings: ExtensionSettings,
): Promise<TranslationResult> {
  for (const sourceName of settings.fallbackChain) {
    const source = SOURCES[sourceName];
    if (!source) {
      continue;
    }

    try {
      const languages = mapLanguages(sourceName, settings.sourceLang, settings.targetLang);
      return await source.translate(
        text,
        languages.source,
        languages.target,
        getSourceConfig(settings, sourceName),
      );
    } catch (error) {
      console.warn('[translator] source failed', sourceName, error);
    }
  }

  throw new TranslationError('翻译失败，请检查 API Key', 'UNKNOWN');
}
