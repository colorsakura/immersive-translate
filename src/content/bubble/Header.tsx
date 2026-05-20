import { Pin, Close } from './icons';

interface HeaderProps {
  isPinned: boolean;
  onPin: () => void;
  onClose: () => void;
  onDragStart: (event: React.MouseEvent<HTMLDivElement>) => void;
  isDragging: boolean;
}

export function Header({ isPinned, onPin, onClose, onDragStart, isDragging }: HeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 6px',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      <div
        aria-hidden="true"
        onMouseDown={onDragStart}
        style={{
          flex: 1,
          height: '16px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          color: '#4a5568',
        }}
      >
        <button
          type="button"
          onClick={onPin}
          title={isPinned ? 'Unpin' : 'Pin'}
          style={{
            display: 'flex',
            padding: '4px',
            border: 0,
            borderRadius: '4px',
            background: isPinned ? '#e2e8f0' : 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          <Pin style={{ width: '16px', height: '16px' }} />
        </button>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          style={{
            display: 'flex',
            padding: '4px',
            border: 0,
            borderRadius: '4px',
            background: 'transparent',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          <Close style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
    </div>
  );
}
