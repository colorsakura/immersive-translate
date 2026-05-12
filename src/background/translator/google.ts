import type { TranslationResult } from '../../shared/types';
import type { SourceConfig, TranslationSource } from './types';
import { TranslationError } from './types';
import {
  decodeHtmlEntities,
  fetchWithTimeout,
  parseJsonResponse,
  retryOnceOnRateLimit,
} from './utils';

interface GoogleTranslateResponse {
  data?: {
    translations?: Array<{ translatedText?: string }>;
  };
  error?: {
    message?: string;
  };
}

export const googleTranslator: TranslationSource = {
  name: 'google',
  async translate(
    text: string,
    source: string,
    target: string,
    config: SourceConfig,
  ): Promise<TranslationResult> {
    if (!config.apiKey) {
      throw new TranslationError('Google API Key 未配置', 'MISSING_CONFIG');
    }

    return retryOnceOnRateLimit(async () => {
      const params = new URLSearchParams({
        key: config.apiKey || '',
        q: text,
        target,
        format: 'text',
      });
      if (source) {
        params.set('source', source);
      }

      const response = await fetchWithTimeout(
        'https://translation.googleapis.com/language/translate/v2',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        },
      );
      const data = await parseJsonResponse<GoogleTranslateResponse>(response);
      const translatedText = data.data?.translations?.[0]?.translatedText;
      if (!translatedText) {
        throw new TranslationError(
          data.error?.message || 'Google 响应格式错误',
          'INVALID_RESPONSE',
        );
      }

      return {
        text: decodeHtmlEntities(translatedText),
        source: 'google',
      };
    });
  },
};
