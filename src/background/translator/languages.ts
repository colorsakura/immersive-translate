const GOOGLE_LANG_MAP: Record<string, string | undefined> = {
  auto: undefined,
  zh: 'zh-CN',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  fr: 'fr',
  de: 'de',
  es: 'es',
};

const YOUDAO_LANG_MAP: Record<string, string> = {
  auto: 'auto',
  zh: 'zh-CHS',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  fr: 'fr',
  de: 'de',
  es: 'es',
};

const OPENAI_LANG_MAP: Record<string, string> = {
  auto: 'auto',
  zh: 'Chinese',
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
};

export function mapGoogleLang(lang: string): string | undefined {
  return GOOGLE_LANG_MAP[lang] ?? lang;
}

export function mapYoudaoLang(lang: string): string {
  return YOUDAO_LANG_MAP[lang] ?? lang;
}

export function mapOpenAILang(lang: string): string {
  return OPENAI_LANG_MAP[lang] ?? lang;
}
