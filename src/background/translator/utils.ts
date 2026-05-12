import { TranslationError } from './types';

export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TranslationError('请求超时', 'TIMEOUT', true);
    }
    throw new TranslationError('网络错误', 'NETWORK_ERROR', true);
  } finally {
    window.clearTimeout(timer);
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function retryOnceOnRateLimit<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof TranslationError && error.code === 'RATE_LIMITED') {
      await sleep(1000);
      return fn();
    }
    throw error;
  }
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (response.status === 429) {
    throw new TranslationError('请求过于频繁', 'RATE_LIMITED', true);
  }
  if (response.status === 401 || response.status === 403) {
    throw new TranslationError('认证失败', 'UNAUTHORIZED');
  }
  if (!response.ok) {
    throw new TranslationError(`HTTP ${response.status}`, 'NETWORK_ERROR', true);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new TranslationError('响应格式错误', 'INVALID_RESPONSE');
  }
}

export function decodeHtmlEntities(value: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = value;
  return textarea.value;
}
