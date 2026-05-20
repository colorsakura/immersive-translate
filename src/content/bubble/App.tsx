import { useState } from 'react';
import type { BubbleState } from './index';
import { Bubble } from './Bubble';

interface AppProps {
  state: BubbleState;
}

export function App({ state }: AppProps) {
  const [isPinned, setIsPinned] = useState(false);

  const handlePin = () => {
    const newIsPinned = !isPinned;
    setIsPinned(newIsPinned);
    if (state.status !== 'icon') {
      state.onPin?.(newIsPinned);
    }
  };

  const handleClose = () => {
    if (state.status !== 'icon') {
      state.onClose?.();
    }
  };

  if (state.status === 'icon') {
    return (
      <Bubble rect={state.rect} compact isPinned={false} onPin={() => {}} onClose={() => {}}>
        <button
          type="button"
          onClick={state.onClick}
          title="翻译"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            padding: 0,
            border: 0,
            borderRadius: '999px',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          译
        </button>
      </Bubble>
    );
  }

  return (
    <Bubble rect={state.rect} isPinned={isPinned} onPin={handlePin} onClose={handleClose}>
      {state.status === 'loading' && '翻译中...'}
      {state.status === 'error' && state.message}
      {state.status === 'result' && state.text}
    </Bubble>
  );
}
