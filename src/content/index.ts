import browser from 'webextension-polyfill';
import type { TranslateResponse } from '../shared/messages';
import { destroyBubble, renderBubble, type DOMRectLike } from './bubble';
import { isInsideBubble } from './bubble/shadow';

const MAX_TEXT_LENGTH = 5000;
const SELECTION_DEBOUNCE_MS = 150;

let debounceTimer: number | undefined;
let currentRequestId = 0;
let lastText = '';
let bubbleVisible = false;

function toRectLike(rect: DOMRect): DOMRectLike {
  return {
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

function getSelectionRect(selection: Selection): DOMRectLike | null {
  if (selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  let rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    const rects = range.getClientRects();
    rect = rects[rects.length - 1];
  }

  if (!rect || (rect.width === 0 && rect.height === 0)) {
    return null;
  }

  return toRectLike(rect);
}

function cleanupBubble(): void {
  currentRequestId += 1;
  lastText = '';
  bubbleVisible = false;
  destroyBubble();
}

function showTranslateIcon(text: string, rect: DOMRectLike): void {
  const iconRequestId = ++currentRequestId;
  bubbleVisible = true;
  renderBubble({
    status: 'icon',
    rect,
    onClick: () => {
      if (iconRequestId === currentRequestId) {
        void requestTranslation(text, rect);
      }
    },
  });
}

async function requestTranslation(text: string, rect: DOMRectLike): Promise<void> {
  const requestId = ++currentRequestId;
  bubbleVisible = true;
  renderBubble({ status: 'loading', rect });

  try {
    const response = (await browser.runtime.sendMessage({
      type: 'translate',
      text,
    })) as TranslateResponse;
    if (requestId !== currentRequestId) {
      return;
    }

    if (response.ok) {
      renderBubble({ status: 'result', rect, text: response.result.text });
      return;
    }

    renderBubble({ status: 'error', rect, message: response.error });
    window.setTimeout(() => {
      if (requestId === currentRequestId) {
        cleanupBubble();
      }
    }, 2000);
  } catch {
    if (requestId !== currentRequestId) {
      return;
    }
    renderBubble({ status: 'error', rect, message: '翻译失败，请稍后重试' });
    window.setTimeout(() => {
      if (requestId === currentRequestId) {
        cleanupBubble();
      }
    }, 2000);
  }
}

function handleSelection(): void {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    return;
  }

  const text = selection.toString().trim().slice(0, MAX_TEXT_LENGTH);
  if (!text) {
    return;
  }

  if (bubbleVisible && text === lastText) {
    return;
  }

  const rect = getSelectionRect(selection);
  if (!rect) {
    return;
  }

  lastText = text;
  showTranslateIcon(text, rect);
}

function scheduleSelectionHandling(): void {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(handleSelection, SELECTION_DEBOUNCE_MS);
}

function patchHistoryCleanup(): void {
  const marker = '__immersiveTranslateHistoryPatched';
  const historyWithMarker = history as History & { [marker]?: boolean };
  if (historyWithMarker[marker]) {
    return;
  }
  historyWithMarker[marker] = true;

  const wrap = (method: 'pushState' | 'replaceState') => {
    const original = history[method];
    history[method] = function patchedHistoryMethod(this: History, ...args) {
      const result = original.apply(this, args);
      cleanupBubble();
      return result;
    } as History[typeof method];
  };

  wrap('pushState');
  wrap('replaceState');
}

document.addEventListener('mouseup', scheduleSelectionHandling);
document.addEventListener('mousedown', (event) => {
  if (!isInsideBubble(event.target)) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.toString().trim() !== lastText) {
      cleanupBubble();
    }
  }
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    cleanupBubble();
  }
});
window.addEventListener('scroll', cleanupBubble, true);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cleanupBubble();
  }
});
window.addEventListener('popstate', cleanupBubble);
patchHistoryCleanup();
