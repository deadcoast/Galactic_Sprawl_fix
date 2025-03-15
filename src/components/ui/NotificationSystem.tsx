import * as React from "react";
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

const notificationIcons: Record<NotificationType, typeof AlertCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const notificationColors: Record<NotificationType, { bg: string; border: string; text: string }> = {
  success: {
    bg: 'bg-green-900/20',
    border: 'border-green-500/30',
    text: 'text-green-400',
  },
  error: {
    bg: 'bg-red-900/20',
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-900/20',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
  },
};

const positionClasses = {
  'top-right': 'top-0 right-0',
  'top-left': 'top-0 left-0',
  'bottom-right': 'bottom-0 right-0',
  'bottom-left': 'bottom-0 left-0',
};

export class NotificationManager {
  private static instance: NotificationManager;
  private listeners: Set<(notifications: Notification[]) => void>;
  private notifications: Notification[];
  private maxNotifications: number;

  private constructor() {
    this.listeners = new Set();
    this.notifications = [];
    this.maxNotifications = 5;
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  public show(notification: Omit<Notification, 'id'>): string {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const newNotification = { ...notification, id };

    this.notifications.push(newNotification);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.shift();
    }

    this.notifyListeners();

    if (notification.duration && notification.duration > 0) {
      setTimeout(() => this.dismiss(id), notification.duration);
    }

    return id;
  }

  public dismiss(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  public clear(): void {
    this.notifications = [];
    this.notifyListeners();
  }

  public subscribe(listener: (notifications: Notification[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.notifications);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  public setMaxNotifications(max: number): void {
    this.maxNotifications = max;
    if (this.notifications.length > max) {
      this.notifications = this.notifications.slice(-max);
      this.notifyListeners();
    }
  }
}

export const notificationManager = NotificationManager.getInstance();

export function NotificationSystem({
  position = 'top-right',
  maxNotifications = 5,
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    notificationManager.setMaxNotifications(maxNotifications);
    return notificationManager.subscribe(setNotifications);
  }, [maxNotifications]);

  return (
    <div
      className={`pointer-events-none fixed z-50 m-4 space-y-2 ${positionClasses[position]}`}
      style={{ maxWidth: '32rem' }}
    >
      <AnimatePresence>
        {notifications.map(notification => {
          const Icon = notificationIcons[notification.type];
          const colors = notificationColors[notification.type];

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: position.startsWith('top') ? -20 : 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`pointer-events-auto w-full p-4 ${colors.bg} border backdrop-blur-sm ${colors.border} rounded-lg shadow-lg`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`h-5 w-5 ${colors.text} mt-0.5 flex-shrink-0`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-200">{notification.title}</div>
                  <div className="mt-1 text-sm text-gray-400">{notification.message}</div>
                  {notification.action && (
                    <button
                      onClick={notification.action.onClick}
                      className={`mt-2 rounded-md px-3 py-1 text-sm ${colors.text} hover:bg-gray-800/50`}
                    >
                      {notification.action.label}
                    </button>
                  )}
                </div>
                <button
                  onClick={() => notificationManager.dismiss(notification.id)}
                  className="h-5 w-5 flex-shrink-0 text-gray-400 hover:text-gray-300"
                >
                  <X className="h-full w-full" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
