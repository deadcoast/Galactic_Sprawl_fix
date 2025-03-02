/** @jsx React.createElement */
/** @jsxFrag React.Fragment */
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  shortcut?: string;
  children?: ContextMenuItem[];
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  x: number;
  y: number;
  onClose: () => void;
}

export function ContextMenu({ items, x, y, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = () => {
    if (!menuRef.current) {
      return { x, y };
    }

    const { width, height } = menuRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
      x: Math.min(x, viewportWidth - width),
      y: Math.min(y, viewportHeight - height),
    };
  };

  const position = adjustedPosition();

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[200px] rounded-lg border border-gray-700 bg-gray-900/95 shadow-xl backdrop-blur-sm"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      <div className="py-1">
        {items.map(item => (
          <div key={item.id} className="relative" onMouseEnter={() => setActiveSubmenu(item.id)}>
            <button
              onClick={() => {
                if (!item.disabled && !item.children) {
                  item.action();
                  onClose();
                }
              }}
              disabled={item.disabled}
              className={`group flex w-full items-center justify-between px-4 py-2 text-left ${
                item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.icon && <div className="h-4 w-4 text-gray-400">{item.icon}</div>}
                <span className="text-gray-200">{item.label}</span>
              </div>
              <div className="flex items-center space-x-3">
                {item.shortcut && <span className="text-xs text-gray-500">{item.shortcut}</span>}
                {item.children && (
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </div>
            </button>

            {/* Submenu */}
            {item.children && activeSubmenu === item.id && (
              <div className="absolute left-full top-0 ml-1">
                <ContextMenu
                  items={item.children}
                  x={0}
                  y={0}
                  onClose={() => setActiveSubmenu(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
}

interface UseContextMenuProps {
  items: ContextMenuItem[];
}

export function useContextMenu({ items }: UseContextMenuProps) {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  return {
    contextMenu,
    handleContextMenu,
    closeContextMenu,
    ContextMenuComponent: contextMenu ? (
      <ContextMenu items={items} x={contextMenu.x} y={contextMenu.y} onClose={closeContextMenu} />
    ) : null,
  };
}
