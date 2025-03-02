/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

export interface DragItem<T = Record<string, unknown>> {
  id: string;
  type: 'module' | 'resource' | 'ship';
  data: T;
}

interface DragPreviewProps<T = Record<string, unknown>> {
  item: DragItem<T>;
  currentOffset: { x: number; y: number };
}

function DragPreview<T = Record<string, unknown>>({ item, currentOffset }: DragPreviewProps<T>) {
  // Extract properties safely with type assertions
  const name =
    item.type === 'module' || item.type === 'ship'
      ? String((item.data as Record<string, unknown>).name || '')
      : '';

  const amount =
    item.type === 'resource' ? String((item.data as Record<string, unknown>).amount || '') : '';

  const resourceType =
    item.type === 'resource' ? String((item.data as Record<string, unknown>).type || '') : '';

  return (
    <div
      className="pointer-events-none fixed z-50 opacity-75"
      style={{
        left: currentOffset.x,
        top: currentOffset.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="rounded-lg border border-gray-700 bg-gray-900/90 px-4 py-2 text-white backdrop-blur-sm">
        {item.type === 'module' && <span>📦 {name}</span>}
        {item.type === 'resource' && (
          <span>
            💎 {amount} {resourceType}
          </span>
        )}
        {item.type === 'ship' && <span>🚀 {name}</span>}
      </div>
    </div>
  );
}

interface DropTargetProps<T = Record<string, unknown>> {
  accept: string[];
  onDrop: (item: DragItem<T>) => void;
  children: React.ReactNode;
  className?: string;
}

export function DropTarget<T = Record<string, unknown>>({
  accept,
  onDrop,
  children,
  className = '',
}: DropTargetProps<T>) {
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
        const item = JSON.parse(e.dataTransfer.getData('text')) as DragItem<T>;
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
      className={`${className} ${isOver ? 'ring-2 ring-cyan-500 ring-opacity-50' : ''}`}
    >
      {children}
    </div>
  );
}

interface DraggableProps<T = Record<string, unknown>> {
  item: DragItem<T>;
  children: React.ReactNode;
  className?: string;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function Draggable<T = Record<string, unknown>>({
  item,
  children,
  className = '',
  onDragStart,
  onDragEnd,
}: DraggableProps<T>) {
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

interface UseDragAndDropProps<T = Record<string, unknown>> {
  onDrop?: (item: DragItem<T>, target: HTMLElement) => void;
}

export function useDragAndDrop<T = Record<string, unknown>>({
  onDrop,
}: UseDragAndDropProps<T> = {}) {
  const [draggedItem, setDraggedItem] = useState<DragItem<T> | null>(null);
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

  const handleDragStart = (item: DragItem<T>) => {
    setDraggedItem(item);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (item: DragItem<T>, target: HTMLElement) => {
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
