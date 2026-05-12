import { useLayoutEffect, useRef, useState } from 'react';
import type { DOMRectLike } from './index';

interface BubbleProps {
  rect: DOMRectLike;
  children: React.ReactNode;
  compact?: boolean;
}

const VIEWPORT_PADDING = 8;
const ESTIMATED_WIDTH = 240;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function estimatePosition(rect: DOMRectLike): { left: number; top: number } {
  const left = clamp(
    rect.left + rect.width / 2 - ESTIMATED_WIDTH / 2,
    VIEWPORT_PADDING,
    Math.max(VIEWPORT_PADDING, window.innerWidth - ESTIMATED_WIDTH - VIEWPORT_PADDING),
  );
  return { left, top: clamp(rect.bottom + 8, VIEWPORT_PADDING, window.innerHeight - VIEWPORT_PADDING) };
}

export function Bubble({ rect, children, compact = false }: BubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => estimatePosition(rect));

  useLayoutEffect(() => {
    const element = bubbleRef.current;
    if (!element) {
      return;
    }

    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const belowTop = rect.bottom + 8;
    const aboveTop = rect.top - height - 8;
    const hasSpaceBelow = belowTop + height <= window.innerHeight - VIEWPORT_PADDING;
    const top = hasSpaceBelow ? belowTop : aboveTop;
    const left = rect.left + rect.width / 2 - width / 2;

    setPosition({
      left: clamp(left, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING)),
      top: clamp(top, VIEWPORT_PADDING, Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING)),
    });
  }, [rect]);

  return (
    <div
      ref={bubbleRef}
      style={{
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top}px`,
        maxWidth: compact ? 'none' : '360px',
        padding: compact ? '4px' : '8px 10px',
        borderRadius: compact ? '999px' : '8px',
        background: 'rgba(24, 24, 27, 0.96)',
        color: '#fff',
        fontSize: '14px',
        lineHeight: 1.5,
        boxShadow: '0 8px 24px rgba(0,0,0,.24)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {children}
    </div>
  );
}
