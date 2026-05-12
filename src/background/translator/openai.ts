import OpenAI from 'openai';
import type { TranslationResult } from '../../shared/types';
import type { SourceConfig, TranslationSource } from './types';
import { TranslationError } from './types';
import { retryOnceOnRateLimit } from './utils';

const DEFAULT_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_SYSTEM_PROMPT =
  'You are a professional translation engine. Translate the user text into the target language. Preserve meaning, tone, formatting, line breaks, and terminology. Return only the translated text.';

function buildUserPrompt(text: string, source: string, target: string): string {
  const sourceLabel = source || 'auto';
  return `Source language: ${sourceLabel}\nTarget language: ${target}\n\nText:\n${text}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'OpenAI 兼容接口调用失败';
}

export const openaiTranslator: TranslationSource = {
  name: 'openai',
  async translate(
    text: string,
    source: string,
    target: string,
    config: SourceConfig,
  ): Promise<TranslationResult> {
    if (!config.apiKey) {
      throw new TranslationError('OpenAI API Key 未配置', 'MISSING_CONFIG');
    }
    if (!config.model) {
      throw new TranslationError('OpenAI 模型未配置', 'MISSING_CONFIG');
    }

    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || DEFAULT_BASE_URL,
      dangerouslyAllowBrowser: true,
    });

    return retryOnceOnRateLimit(async () => {
      try {
        const completion = await client.chat.completions.create({
          model: config.model || DEFAULT_MODEL,
          messages: [
            {
              role: 'system',
              content: config.systemPrompt || DEFAULT_SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: buildUserPrompt(text, source, target),
            },
          ],
          temperature: 0.2,
        });

        const translatedText = completion.choices[0]?.message?.content?.trim();
        if (!translatedText) {
          throw new TranslationError('OpenAI 响应格式错误', 'INVALID_RESPONSE');
        }

        return {
          text: translatedText,
          source: 'openai',
        };
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 429) {
          throw new TranslationError('OpenAI 请求过于频繁', 'RATE_LIMITED', true);
        }
        if (status === 401 || status === 403) {
          throw new TranslationError('OpenAI 认证失败', 'UNAUTHORIZED');
        }
        if (error instanceof TranslationError) {
          throw error;
        }
        throw new TranslationError(getErrorMessage(error), 'UNKNOWN', true);
      }
    });
  },
};
