import type { TranslationResult } from '../../shared/types';
import type { SourceConfig, TranslationSource } from './types';
import { TranslationError } from './types';
import { fetchWithTimeout, parseJsonResponse, retryOnceOnRateLimit } from './utils';

interface YoudaoTranslateResponse {
  errorCode?: string;
  translation?: string[];
}

export function truncateForYoudaoSign(text: string): string {
  if (text.length <= 20) {
    return text;
  }
  return `${text.slice(0, 10)}${text.length}${text.slice(-10)}`;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function mapYoudaoError(errorCode: string | undefined): TranslationError | undefined {
  if (!errorCode || errorCode === '0') {
    return undefined;
  }
  if (errorCode === '411') {
    return new TranslationError('请求过于频繁', 'RATE_LIMITED', true);
  }
  if (['108', '202', '401'].includes(errorCode)) {
    return new TranslationError('有道认证失败', 'UNAUTHORIZED');
  }
  return new TranslationError(`有道错误 ${errorCode}`, 'UNKNOWN', true);
}

export const youdaoTranslator: TranslationSource = {
  name: 'youdao',
  async translate(
    text: string,
    source: string,
    target: string,
    config: SourceConfig,
  ): Promise<TranslationResult> {
    if (!config.appKey || !config.appSecret) {
      throw new TranslationError('有道配置未完成', 'MISSING_CONFIG');
    }

    return retryOnceOnRateLimit(async () => {
      const salt = String(Date.now());
      const curtime = String(Math.floor(Date.now() / 1000));
      const sign = await sha256Hex(
        `${config.appKey}${truncateForYoudaoSign(text)}${salt}${curtime}${config.appSecret}`,
      );
      const params = new URLSearchParams({
        q: text,
        from: source,
        to: target,
        appKey: config.appKey || '',
        salt,
        signType: 'v3',
        curtime,
        sign,
      });

      const response = await fetchWithTimeout('https://openapi.youdao.com/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data = await parseJsonResponse<YoudaoTranslateResponse>(response);
      const mappedError = mapYoudaoError(data.errorCode);
      if (mappedError) {
        throw mappedError;
      }

      const translatedText = data.translation?.[0];
      if (!translatedText) {
        throw new TranslationError('有道响应格式错误', 'INVALID_RESPONSE');
      }

      return {
        text: translatedText,
        source: 'youdao',
      };
    });
  },
};
