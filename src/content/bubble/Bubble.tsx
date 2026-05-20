import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  return {
    left,
    top: clamp(rect.bottom + 8, VIEWPORT_PADDING, window.innerHeight - VIEWPORT_PADDING),
  };
}

export function Bubble({ rect, children, compact = false }: BubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
    width: number;
    height: number;
  } | null>(null);
  const wasDraggedRef = useRef(false);
  const [position, setPosition] = useState(() => estimatePosition(rect));
  const [isDragging, setIsDragging] = useState(false);

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
      left: clamp(
        left,
        VIEWPORT_PADDING,
        Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING),
      ),
      top: clamp(
        top,
        VIEWPORT_PADDING,
        Math.max(VIEWPORT_PADDING, window.innerHeight - height - VIEWPORT_PADDING),
      ),
    });
  }, [rect]);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }

      if (Math.abs(event.clientX - drag.startX) > 3 || Math.abs(event.clientY - drag.startY) > 3) {
        wasDraggedRef.current = true;
      }

      setPosition({
        left: clamp(
          event.clientX - drag.offsetX,
          VIEWPORT_PADDING,
          Math.max(VIEWPORT_PADDING, window.innerWidth - drag.width - VIEWPORT_PADDING),
        ),
        top: clamp(
          event.clientY - drag.offsetY,
          VIEWPORT_PADDING,
          Math.max(VIEWPORT_PADDING, window.innerHeight - drag.height - VIEWPORT_PADDING),
        ),
      });
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }

    const element = bubbleRef.current;
    if (!element) {
      return;
    }

    const elementRect = element.getBoundingClientRect();
    dragRef.current = {
      offsetX: event.clientX - elementRect.left,
      offsetY: event.clientY - elementRect.top,
      startX: event.clientX,
      startY: event.clientY,
      width: elementRect.width,
      height: elementRect.height,
    };
    wasDraggedRef.current = false;
    setIsDragging(true);
    event.preventDefault();
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!wasDraggedRef.current) {
      return;
    }

    wasDraggedRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      ref={bubbleRef}
      onClickCapture={handleClickCapture}
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
      {!compact && (
        <div
          aria-hidden="true"
          onMouseDown={handleMouseDown}
          style={{
            height: '10px',
            margin: '-2px -4px 4px',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        />
      )}
      {children}
    </div>
  );
}
