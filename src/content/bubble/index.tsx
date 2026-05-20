import { createRoot, type Root } from 'react-dom/client';
import { App } from './App';
import { ensureBubbleHost, removeBubbleHost } from './shadow';

export interface DOMRectLike {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}

export type BubbleState =
  | { status: 'icon'; rect: DOMRectLike; onClick: () => void }
  | {
      status: 'loading';
      rect: DOMRectLike;
      onPin?: (isPinned: boolean) => void;
      onClose?: () => void;
    }
  | {
      status: 'result';
      rect: DOMRectLike;
      text: string;
      onPin?: (isPinned: boolean) => void;
      onClose?: () => void;
    }
  | {
      status: 'error';
      rect: DOMRectLike;
      message: string;
      onPin?: (isPinned: boolean) => void;
      onClose?: () => void;
    };

let root: Root | null = null;
let container: HTMLDivElement | null = null;

export function renderBubble(state: BubbleState): void {
  const { shadowRoot } = ensureBubbleHost();
  if (!container) {
    container = document.createElement('div');
    shadowRoot.appendChild(container);
  }
  if (!root) {
    root = createRoot(container);
  }
  root.render(<App state={state} />);
}

export function destroyBubble(): void {
  root?.unmount();
  root = null;
  container = null;
  removeBubbleHost();
}
