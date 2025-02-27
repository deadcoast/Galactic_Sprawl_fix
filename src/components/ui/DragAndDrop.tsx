import { useEffect, useRef, useState } from 'react';

export interface DragItem {
  id: string;
  type: 'module' | 'resource' | 'ship';
  data: any;
}

interface DragPreviewProps {
  item: DragItem;
  currentOffset: { x: number; y: number };
}

function DragPreview({ item, currentOffset }: DragPreviewProps) {
  return (
    <div
      className="fixed pointer-events-none z-50 opacity-75"
      style={{
        left: currentOffset.x,
        top: currentOffset.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="px-4 py-2 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-lg text-white">
        {item.type === 'module' && <span>📦 {item.data.name}</span>}
        {item.type === 'resource' && (
          <span>
            💎 {item.data.amount} {item.data.type}
          </span>
        )}
        {item.type === 'ship' && <span>🚀 {item.data.name}</span>}
      </div>
    </div>
  );
}

interface DropTargetProps {
  accept: string[];
  onDrop: (item: DragItem) => void;
  children: React.ReactNode;
  className?: string;
}

export function DropTarget({ accept, onDrop, children, className = '' }: DropTargetProps) {
  const [isOver, setIsOver] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && accept.includes(JSON.parse(e.dataTransfer.getData('text')).type)) {
        setIsOver(true);
      }
    };

    const handleDragLeave = () => {
      setIsOver(false);
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsOver(false);
      if (e.dataTransfer) {
        const item = JSON.parse(e.dataTransfer.getData('text')) as DragItem;
        if (accept.includes(item.type)) {
          onDrop(item);
        }
      }
    };

    const element = ref.current;
    if (element) {
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('dragleave', handleDragLeave);
      element.addEventListener('drop', handleDrop);

      return () => {
        element.removeEventListener('dragover', handleDragOver);
        element.removeEventListener('dragleave', handleDragLeave);
        element.removeEventListener('drop', handleDrop);
      };
    }
  }, [accept, onDrop]);

  return (
    <div
      ref={ref}
      className={`${className} ${
        isOver ? 'ring-2 ring-cyan-500 ring-opacity-50' : ''
      }`}
    >
      {children}
    </div>
  );
}

interface DraggableProps {
  item: DragItem;
  children: React.ReactNode;
  className?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function Draggable({
  item,
  children,
  className = '',
  onDragStart,
  onDragEnd,
}: DraggableProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text', JSON.stringify(item));
    onDragStart?.();
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`${className} cursor-grab active:cursor-grabbing`}
    >
      {children}
    </div>
  );
}

interface UseDragAndDropProps {
  onDrop?: (item: DragItem, target: any) => void;
}

export function useDragAndDrop({ onDrop }: UseDragAndDropProps = {}) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggedItem) {
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [draggedItem]);

  const handleDragStart = (item: DragItem) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (item: DragItem, target: any) => {
    onDrop?.(item, target);
    setDraggedItem(null);
  };

  return {
    draggedItem,
    dragPosition,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    DragPreviewComponent: draggedItem ? (
      <DragPreview item={draggedItem} currentOffset={dragPosition} />
    ) : null,
  };
} 