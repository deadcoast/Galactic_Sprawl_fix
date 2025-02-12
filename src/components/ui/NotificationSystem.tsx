import { Salvage } from "@/types/combat/SalvageTypes";
import { AlertTriangle, Package, X } from "lucide-react";
import { useEffect, useState } from "react";

interface Notification {
  id: string;
  type: "salvage" | "warning" | "info";
  title: string;
  message: string;
  timestamp: number;
  data?: {
    salvage?: Salvage;
    shipId?: string;
  };
}

interface NotificationSystemProps {
  onNotificationClick?: (notification: Notification) => void;
  onNotificationDismiss?: (notificationId: string) => void;
}

export function NotificationSystem({
  onNotificationClick,
  onNotificationDismiss,
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Listen for salvage events
  useEffect(() => {
    const handleSalvageGenerated = (event: CustomEvent) => {
      const { items, sourceUnit } = event.detail;
      items.forEach((salvage: Salvage) => {
        addNotification({
          id: `salvage-${salvage.id}`,
          type: "salvage",
          title: "Salvage Available",
          message: `${salvage.name} discovered from destroyed ${sourceUnit.type}`,
          timestamp: Date.now(),
          data: { salvage, shipId: sourceUnit.id },
        });
      });
    };

    window.addEventListener(
      "salvageGenerated",
      handleSalvageGenerated as EventListener,
    );
    return () => {
      window.removeEventListener(
        "salvageGenerated",
        handleSalvageGenerated as EventListener,
      );
    };
  }, []);

  // Auto-dismiss notifications after 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setNotifications((prev) =>
        prev.filter((notification) => {
          const isExpired = now - notification.timestamp > 10000;
          if (isExpired) {
            onNotificationDismiss?.(notification.id);
          }
          return !isExpired;
        }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [onNotificationDismiss]);

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => [...prev, notification]);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    onNotificationDismiss?.(id);
  };

  return (
    <div className="fixed top-4 right-4 space-y-2 z-50">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`w-80 p-4 rounded-lg shadow-lg backdrop-blur-sm border transition-all ${
            notification.type === "salvage"
              ? "bg-indigo-900/80 border-indigo-500/50"
              : notification.type === "warning"
                ? "bg-red-900/80 border-red-500/50"
                : "bg-gray-900/80 border-gray-500/50"
          }`}
        >
          <div className="flex items-start justify-between">
            <div
              className="flex items-start space-x-3 cursor-pointer"
              onClick={() => onNotificationClick?.(notification)}
            >
              {notification.type === "salvage" ? (
                <Package className="w-5 h-5 text-indigo-400" />
              ) : notification.type === "warning" ? (
                <AlertTriangle className="w-5 h-5 text-red-400" />
              ) : null}
              <div>
                <div className="font-medium text-white">
                  {notification.title}
                </div>
                <div className="text-sm text-gray-300">
                  {notification.message}
                </div>
              </div>
            </div>
            <button
              onClick={() => dismissNotification(notification.id)}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
