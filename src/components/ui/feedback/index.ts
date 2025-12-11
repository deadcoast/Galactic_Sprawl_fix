/**
 * @context: ui-system, component-bridge
 *
 * Feedback components for user notifications and loading states.
 * Provides Alert, Spinner, Progress, Skeleton, and Toast components.
 */

import React, { useEffect, useState, useCallback } from "react";

// CSS Keyframes injected into document head for animations
const injectStyles = (() => {
  let injected = false;
  return () => {
    if (injected || typeof document === "undefined") return;
    injected = true;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes slideIn {
        0% { transform: translateX(100%); opacity: 0; }
        100% { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        0% { transform: translateX(0); opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }
      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  };
})();

// Alert Component - Displays contextual feedback messages
export interface AlertProps {
  children: React.ReactNode;
  severity?: "info" | "warning" | "error" | "success";
  title?: string;
  onClose?: () => void;
  icon?: boolean;
  variant?: "filled" | "outlined" | "standard";
}

export const Alert: React.FC<AlertProps> = ({
  children,
  severity = "info",
  title,
  onClose,
  icon = true,
  variant = "standard",
}) => {
  injectStyles();

  const colors = {
    info: { main: "#2196F3", bg: "rgba(33, 150, 243, 0.1)", icon: "ℹ️" },
    warning: { main: "#FF9800", bg: "rgba(255, 152, 0, 0.1)", icon: "⚠️" },
    error: { main: "#F44336", bg: "rgba(244, 67, 54, 0.1)", icon: "❌" },
    success: { main: "#4CAF50", bg: "rgba(76, 175, 80, 0.1)", icon: "✓" },
  };

  const color = colors[severity];
  const baseStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "12px 16px",
    borderRadius: "4px",
    marginBottom: "8px",
    animation: "fadeIn 0.2s ease-out",
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    filled: { background: color.main, color: "#fff" },
    outlined: {
      background: "transparent",
      border: `1px solid ${color.main}`,
      color: color.main,
    },
    standard: {
      background: color.bg,
      borderLeft: `4px solid ${color.main}`,
      color: "#fff",
    },
  };

  return React.createElement(
    "div",
    {
      style: { ...baseStyle, ...variantStyles[variant] },
      role: "alert",
      "aria-live": severity === "error" ? "assertive" : "polite",
    },
    icon &&
      React.createElement(
        "span",
        {
          style: { fontSize: "16px", flexShrink: 0 },
          "aria-hidden": true,
        },
        color.icon,
      ),
    React.createElement(
      "div",
      { style: { flex: 1 } },
      title &&
        React.createElement(
          "div",
          {
            style: { fontWeight: "bold", marginBottom: "4px" },
          },
          title,
        ),
      React.createElement("div", { style: { fontSize: "14px" } }, children),
    ),
    onClose &&
      React.createElement(
        "button",
        {
          onClick: onClose,
          style: {
            background: "transparent",
            border: "none",
            color: "inherit",
            cursor: "pointer",
            padding: "4px",
            fontSize: "18px",
            lineHeight: 1,
            opacity: 0.7,
          },
          "aria-label": "Close alert",
        },
        "×",
      ),
  );
};

// Spinner Component - Loading indicator with multiple variants
export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  thickness?: number;
  label?: string;
  variant?: "border" | "dots" | "pulse";
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "#4a9eff",
  thickness,
  label,
  variant = "border",
}) => {
  injectStyles();

  const sizes = { xs: 12, sm: 16, md: 24, lg: 32, xl: 48 };
  const sizeValue = sizes[size];
  const borderWidth = thickness || Math.max(2, Math.floor(sizeValue / 8));

  if (variant === "dots") {
    return React.createElement(
      "div",
      {
        style: { display: "flex", gap: "4px", alignItems: "center" },
        role: "status",
        "aria-label": label || "Loading",
      },
      [0, 1, 2].map((i) =>
        React.createElement("div", {
          key: i,
          style: {
            width: sizeValue / 3,
            height: sizeValue / 3,
            background: color,
            borderRadius: "50%",
            animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite`,
            opacity: 0.6,
          },
        }),
      ),
      label &&
        React.createElement(
          "span",
          {
            style: { marginLeft: "8px", color: "#888", fontSize: "12px" },
          },
          label,
        ),
    );
  }

  if (variant === "pulse") {
    return React.createElement("div", {
      style: {
        width: sizeValue,
        height: sizeValue,
        background: color,
        borderRadius: "50%",
        animation: "pulse 1.4s ease-in-out infinite",
        opacity: 0.6,
      },
      role: "status",
      "aria-label": label || "Loading",
    });
  }

  // Default border spinner
  return React.createElement(
    "div",
    {
      style: { display: "inline-flex", alignItems: "center", gap: "8px" },
      role: "status",
    },
    React.createElement("div", {
      style: {
        width: sizeValue,
        height: sizeValue,
        border: `${borderWidth}px solid rgba(74, 158, 255, 0.2)`,
        borderTop: `${borderWidth}px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      },
      "aria-hidden": true,
    }),
    label &&
      React.createElement(
        "span",
        {
          style: { color: "#888", fontSize: "14px" },
        },
        label,
      ),
    React.createElement(
      "span",
      {
        style: {
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
        },
      },
      label || "Loading",
    ),
  );
};

// Progress Component - Shows completion progress with various styles
export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  color?: string;
  variant?: "determinate" | "indeterminate" | "buffer";
  bufferValue?: number;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  color = "#4a9eff",
  variant = "determinate",
  bufferValue,
}) => {
  injectStyles();

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const bufferPercentage = bufferValue
    ? Math.min(100, Math.max(0, (bufferValue / max) * 100))
    : 0;
  const heights = { sm: 4, md: 8, lg: 12 };
  const height = heights[size];

  // Indeterminate style with animation
  if (variant === "indeterminate") {
    return React.createElement(
      "div",
      { style: { width: "100%" } },
      label &&
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "4px",
            },
          },
          React.createElement(
            "span",
            { style: { fontSize: "12px", color: "#888" } },
            label,
          ),
        ),
      React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: `${height}px`,
            background: "#333",
            borderRadius: `${height / 2}px`,
            overflow: "hidden",
            position: "relative",
          },
          role: "progressbar",
          "aria-label": label || "Loading",
        },
        React.createElement("div", {
          style: {
            position: "absolute",
            width: "30%",
            height: "100%",
            background: color,
            animation: "shimmer 1.5s ease-in-out infinite",
            borderRadius: `${height / 2}px`,
          },
        }),
      ),
    );
  }

  return React.createElement(
    "div",
    { style: { width: "100%" } },
    (label || showValue) &&
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "4px",
          },
        },
        label &&
          React.createElement(
            "span",
            { style: { fontSize: "12px", color: "#888" } },
            label,
          ),
        showValue &&
          React.createElement(
            "span",
            {
              style: { fontSize: "12px", color: "#fff", fontWeight: "bold" },
            },
            `${Math.round(percentage)}%`,
          ),
      ),
    React.createElement(
      "div",
      {
        style: {
          width: "100%",
          height: `${height}px`,
          background: "#333",
          borderRadius: `${height / 2}px`,
          overflow: "hidden",
          position: "relative",
        },
      },
      // Buffer bar (for buffer variant)
      variant === "buffer" &&
        bufferValue &&
        React.createElement("div", {
          style: {
            position: "absolute",
            width: `${bufferPercentage}%`,
            height: "100%",
            background: `${color}40`,
            transition: "width 0.3s ease-out",
          },
        }),
      // Main progress bar
      React.createElement("div", {
        style: {
          width: `${percentage}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          transition: "width 0.3s ease-out",
          borderRadius: `${height / 2}px`,
          position: "relative",
        },
        role: "progressbar",
        "aria-valuenow": value,
        "aria-valuemin": 0,
        "aria-valuemax": max,
        "aria-label": label,
      }),
    ),
  );
};

// Skeleton Component - Placeholder loading state for content
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  animation?: "wave" | "pulse" | "none";
  count?: number;
  gap?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = "20px",
  variant = "rectangular",
  animation = "wave",
  count = 1,
  gap = 8,
}) => {
  injectStyles();

  const borderRadii: Record<string, string> = {
    circular: "50%",
    text: "4px",
    rectangular: "0",
    rounded: "8px",
  };

  const animations: Record<string, string> = {
    wave: "shimmer 1.5s ease-in-out infinite",
    pulse: "pulse 1.5s ease-in-out infinite",
    none: "none",
  };

  const singleSkeleton = (key?: number) =>
    React.createElement("div", {
      key,
      style: {
        width,
        height,
        background:
          animation === "wave"
            ? "linear-gradient(90deg, #1a1a2e 25%, #2a2a4e 50%, #1a1a2e 75%)"
            : "#1a1a2e",
        backgroundSize: "200% 100%",
        borderRadius: borderRadii[variant],
        animation: animations[animation],
        opacity: animation === "pulse" ? 0.7 : 1,
      },
      "aria-hidden": true,
    });

  if (count === 1) {
    return singleSkeleton();
  }

  return React.createElement(
    "div",
    {
      style: { display: "flex", flexDirection: "column", gap: `${gap}px` },
      "aria-hidden": true,
    },
    Array.from({ length: count }, (_, i) => singleSkeleton(i)),
  );
};

// Toast Component - Temporary notification message with auto-dismiss
export interface ToastProps {
  message: string;
  duration?: number;
  onClose?: () => void;
  severity?: "info" | "success" | "warning" | "error";
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({
  message,
  duration = 5000,
  onClose,
  severity = "info",
  position = "bottom-right",
  action,
}) => {
  injectStyles();

  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  const handleClose = useCallback(() => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 200);
  }, [onClose]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  if (!visible) return null;

  const colors = {
    info: { bg: "#1976D2", icon: "ℹ️" },
    success: { bg: "#388E3C", icon: "✓" },
    warning: { bg: "#F57C00", icon: "⚠️" },
    error: { bg: "#D32F2F", icon: "❌" },
  };

  const positions: Record<string, React.CSSProperties> = {
    "top-right": { top: "20px", right: "20px" },
    "top-left": { top: "20px", left: "20px" },
    "bottom-right": { bottom: "20px", right: "20px" },
    "bottom-left": { bottom: "20px", left: "20px" },
    "top-center": { top: "20px", left: "50%", transform: "translateX(-50%)" },
    "bottom-center": {
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
    },
  };

  const color = colors[severity];

  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        ...positions[position],
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        background: color.bg,
        color: "#fff",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        animation: exiting
          ? "slideOut 0.2s ease-out forwards"
          : "slideIn 0.3s ease-out",
        zIndex: 9999,
        maxWidth: "400px",
      },
      role: "alert",
      "aria-live": severity === "error" ? "assertive" : "polite",
    },
    React.createElement(
      "span",
      {
        style: { fontSize: "16px" },
        "aria-hidden": true,
      },
      color.icon,
    ),
    React.createElement(
      "span",
      { style: { flex: 1, fontSize: "14px" } },
      message,
    ),
    action &&
      React.createElement(
        "button",
        {
          onClick: () => {
            action.onClick();
            handleClose();
          },
          style: {
            background: "rgba(255,255,255,0.2)",
            border: "none",
            color: "#fff",
            padding: "4px 12px",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "bold",
          },
        },
        action.label,
      ),
    React.createElement(
      "button",
      {
        onClick: handleClose,
        style: {
          background: "transparent",
          border: "none",
          color: "#fff",
          cursor: "pointer",
          padding: "4px",
          fontSize: "18px",
          lineHeight: 1,
          opacity: 0.7,
        },
        "aria-label": "Close notification",
      },
      "×",
    ),
  );
};

// Toast Container for managing multiple toasts
export interface ToastContainerProps {
  position?: ToastProps["position"];
}

// Simple toast manager hook for creating toasts
export interface ToastOptions extends Omit<ToastProps, "message"> {
  id?: string;
}

const toastListeners: Set<(toast: ToastProps & { id: string }) => void> =
  new Set();

export const toast = {
  show: (message: string, options: ToastOptions = {}) => {
    const id = options.id || `toast-${Date.now()}`;
    const toastData = { ...options, message, id };
    toastListeners.forEach((listener) => listener(toastData));
    return id;
  },
  success: (message: string, options?: Omit<ToastOptions, "severity">) =>
    toast.show(message, { ...options, severity: "success" }),
  error: (message: string, options?: Omit<ToastOptions, "severity">) =>
    toast.show(message, { ...options, severity: "error" }),
  warning: (message: string, options?: Omit<ToastOptions, "severity">) =>
    toast.show(message, { ...options, severity: "warning" }),
  info: (message: string, options?: Omit<ToastOptions, "severity">) =>
    toast.show(message, { ...options, severity: "info" }),
};
