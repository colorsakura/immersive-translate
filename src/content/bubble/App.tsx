import type { BubbleState } from './index';
import { Bubble } from './Bubble';

interface AppProps {
  state: BubbleState;
}

export function App({ state }: AppProps) {
  if (state.status === 'icon') {
    return (
      <Bubble rect={state.rect} compact>
        <button
          type="button"
          onClick={state.onClick}
          title="翻译"
          style={{
            display: 'block',
            width: '28px',
            height: '28px',
            padding: 0,
            border: 0,
            borderRadius: '999px',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: '28px',
          }}
        >
          译
        </button>
      </Bubble>
    );
  }

  if (state.status === 'loading') {
    return <Bubble rect={state.rect}>翻译中...</Bubble>;
  }

  if (state.status === 'error') {
    return <Bubble rect={state.rect}>{state.message}</Bubble>;
  }

  return <Bubble rect={state.rect}>{state.text}</Bubble>;
}
