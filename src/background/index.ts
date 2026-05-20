import browser from 'webextension-polyfill';
import type { RuntimeMessage, TranslateResponse } from '../shared/messages';
import { getSettings } from '../shared/storage';
import { translateWithFallback } from './translator/chain';

const MAX_TEXT_LENGTH = 5000;

function normalizeText(text: string): string {
  return text.trim().slice(0, MAX_TEXT_LENGTH);
}

function isRuntimeMessage(message: unknown): message is RuntimeMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as { type?: unknown }).type === 'translate'
  );
}

browser.runtime.onMessage.addListener(
  async (message: unknown): Promise<TranslateResponse | undefined> => {
    if (!isRuntimeMessage(message)) {
      return undefined;
    }

    const text = normalizeText(message.text);
    if (!text) {
      return { ok: false, error: '未选中内容' };
    }

    try {
      const settings = await getSettings();
      const result = await translateWithFallback(text, settings);
      return { ok: true, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : '翻译失败，请检查 API Key';
      return { ok: false, error: message || '翻译失败，请检查 API Key' };
    }
  },
);

browser.browserAction.onClicked.addListener(() => {
  browser.runtime.openOptionsPage();
});
