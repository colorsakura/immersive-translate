import browser from 'webextension-polyfill';
import type { ExtensionSettings, TranslatorName } from './types';

const SUPPORTED_TRANSLATORS: TranslatorName[] = ['google', 'youdao'];
const STORAGE_KEY = 'settings';

export const DEFAULT_SETTINGS: ExtensionSettings = {
  sourceLang: 'auto',
  targetLang: 'zh',
  fallbackChain: ['google', 'youdao'],
  sources: {
    google: { apiKey: '' },
    youdao: { appKey: '', appSecret: '' },
  },
};

function normalizeFallbackChain(chain: unknown, allowDefault: boolean): TranslatorName[] {
  if (!Array.isArray(chain)) {
    return allowDefault ? DEFAULT_SETTINGS.fallbackChain : [];
  }

  const seen = new Set<TranslatorName>();
  const normalized: TranslatorName[] = [];
  for (const item of chain) {
    if (
      SUPPORTED_TRANSLATORS.includes(item as TranslatorName) &&
      !seen.has(item as TranslatorName)
    ) {
      seen.add(item as TranslatorName);
      normalized.push(item as TranslatorName);
    }
  }

  if (normalized.length === 0 && allowDefault) {
    return DEFAULT_SETTINGS.fallbackChain;
  }

  return normalized;
}

function mergeWithDefaults(value: Partial<ExtensionSettings> | undefined): ExtensionSettings {
  return {
    sourceLang: value?.sourceLang || DEFAULT_SETTINGS.sourceLang,
    targetLang: value?.targetLang || DEFAULT_SETTINGS.targetLang,
    fallbackChain: normalizeFallbackChain(value?.fallbackChain, true),
    sources: {
      google: {
        ...DEFAULT_SETTINGS.sources.google,
        ...value?.sources?.google,
      },
      youdao: {
        ...DEFAULT_SETTINGS.sources.youdao,
        ...value?.sources?.youdao,
      },
    },
  };
}

function normalizeForSave(settings: ExtensionSettings): ExtensionSettings {
  const fallbackChain = normalizeFallbackChain(settings.fallbackChain, false);
  if (fallbackChain.length === 0) {
    throw new Error('请至少启用一个翻译源');
  }

  return mergeWithDefaults({
    ...settings,
    fallbackChain,
  });
}

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await browser.storage.sync.get(STORAGE_KEY);
  return mergeWithDefaults(result[STORAGE_KEY] as Partial<ExtensionSettings> | undefined);
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  const normalized = normalizeForSave(settings);
  await browser.storage.sync.set({ [STORAGE_KEY]: normalized });
}

export async function mergeSettings(
  partial: Partial<ExtensionSettings>,
): Promise<ExtensionSettings> {
  const current = await getSettings();
  const merged = mergeWithDefaults({
    ...current,
    ...partial,
    sources: {
      google: {
        ...current.sources.google,
        ...partial.sources?.google,
      },
      youdao: {
        ...current.sources.youdao,
        ...partial.sources?.youdao,
      },
    },
  });
  await saveSettings(merged);
  return merged;
}
