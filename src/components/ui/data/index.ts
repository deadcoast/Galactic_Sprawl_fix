/**
 * @context: ui-system, component-bridge
 *
 * Data display components for presenting structured information.
 * Provides DataTable, StatusCard, Metric, and Timeline components.
 */

import React, { useState, useMemo } from "react";

// DataTable Component - Sortable, filterable data grid
export interface Column<T> {
  key: keyof T;
  header: string;
  width?: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  render?: (value: T[keyof T], row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T, index: number) => void;
  sortable?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  emptyMessage?: string;
  loading?: boolean;
  selectedRow?: number;
  onSort?: (column: keyof T, direction: "asc" | "desc") => void;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  onRowClick,
  sortable = false,
  striped = true,
  hoverable = true,
  compact = false,
  emptyMessage = "No data available",
  loading = false,
  selectedRow,
  onSort,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortable) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, sortable]);

  const handleSort = (column: Column<T>) => {
    if (!sortable || column.sortable === false) return;

    const newDirection =
      sortColumn === column.key && sortDirection === "asc" ? "desc" : "asc";
    setSortColumn(column.key);
    setSortDirection(newDirection);
    onSort?.(column.key, newDirection);
  };

  const padding = compact ? "8px 12px" : "12px 16px";

  return React.createElement(
    "div",
    {
      style: {
        width: "100%",
        overflow: "auto",
        borderRadius: "8px",
        background: "#1a1a2e",
      },
    },
    React.createElement(
      "table",
      {
        style: { width: "100%", borderCollapse: "collapse", minWidth: "600px" },
      },
      React.createElement(
        "thead",
        null,
        React.createElement(
          "tr",
          {
            style: { background: "#0d0d1a" },
          },
          columns.map((col) =>
            React.createElement(
              "th",
              {
                key: String(col.key),
                onClick: () => handleSort(col),
                style: {
                  padding,
                  textAlign: col.align || "left",
                  borderBottom: "2px solid #333",
                  color: "#888",
                  fontWeight: 600,
                  fontSize: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  cursor:
                    sortable && col.sortable !== false ? "pointer" : "default",
                  width: col.width,
                  userSelect: "none",
                },
              },
              React.createElement(
                "div",
                {
                  style: { display: "flex", alignItems: "center", gap: "4px" },
                },
                col.header,
                sortable &&
                  col.sortable !== false &&
                  sortColumn === col.key &&
                  React.createElement(
                    "span",
                    { style: { fontSize: "10px" } },
                    sortDirection === "asc" ? " ▲" : " ▼",
                  ),
              ),
            ),
          ),
        ),
      ),
      React.createElement(
        "tbody",
        null,
        loading
          ? React.createElement(
              "tr",
              null,
              React.createElement(
                "td",
                {
                  colSpan: columns.length,
                  style: {
                    padding: "40px",
                    textAlign: "center",
                    color: "#666",
                  },
                },
                "Loading...",
              ),
            )
          : sortedData.length === 0
            ? React.createElement(
                "tr",
                null,
                React.createElement(
                  "td",
                  {
                    colSpan: columns.length,
                    style: {
                      padding: "40px",
                      textAlign: "center",
                      color: "#666",
                    },
                  },
                  emptyMessage,
                ),
              )
            : sortedData.map((row, rowIndex) =>
                React.createElement(
                  "tr",
                  {
                    key: rowIndex,
                    onClick: onRowClick
                      ? () => onRowClick(row, rowIndex)
                      : undefined,
                    onMouseEnter: hoverable
                      ? () => setHoveredRow(rowIndex)
                      : undefined,
                    onMouseLeave: hoverable
                      ? () => setHoveredRow(null)
                      : undefined,
                    style: {
                      cursor: onRowClick ? "pointer" : "default",
                      background:
                        selectedRow === rowIndex
                          ? "rgba(74, 158, 255, 0.2)"
                          : hoveredRow === rowIndex
                            ? "rgba(255, 255, 255, 0.05)"
                            : striped && rowIndex % 2 === 1
                              ? "rgba(255, 255, 255, 0.02)"
                              : "transparent",
                      transition: "background 0.15s",
                    },
                  },
                  columns.map((col) =>
                    React.createElement(
                      "td",
                      {
                        key: String(col.key),
                        style: {
                          padding,
                          borderBottom: "1px solid #222",
                          color: "#fff",
                          fontSize: "14px",
                          textAlign: col.align || "left",
                        },
                      },
                      col.render
                        ? col.render(row[col.key], row, rowIndex)
                        : String(row[col.key] ?? ""),
                    ),
                  ),
                ),
              ),
      ),
    ),
    React.createElement(
      "tbody",
      null,
      data.map((row, rowIndex) =>
        React.createElement(
          "tr",
          {
            key: String((row as Record<string, unknown>).id ?? rowIndex),
            onClick: onRowClick ? () => onRowClick(row, rowIndex) : undefined,
            style: { cursor: onRowClick ? "pointer" : "default" },
          },
          columns.map((col, colIndex) =>
            React.createElement(
              "td",
              {
                key: String(col.key),
                style: {
                  padding: "12px",
                  borderBottom: "1px solid #222",
                  color: "#fff",
                },
              },
              col.render
                ? col.render(row[col.key], row, colIndex)
                : String(row[col.key] ?? ""),
            ),
          ),
        ),
      ),
    ),
  );
}

// StatusCard Component - Displays status with contextual styling
export interface StatusCardProps {
  title: string;
  status: "online" | "offline" | "warning" | "error" | "pending" | "success";
  children?: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "compact" | "expanded";
}

export const StatusCard: React.FC<StatusCardProps> = ({
  title,
  status,
  children,
  description,
  icon,
  actions,
  onClick,
  variant = "default",
}) => {
  const [hovered, setHovered] = useState(false);

  const statusConfig = {
    online: { color: "#4CAF50", label: "Online", pulse: true },
    offline: { color: "#666", label: "Offline", pulse: false },
    warning: { color: "#FF9800", label: "Warning", pulse: true },
    error: { color: "#F44336", label: "Error", pulse: true },
    pending: { color: "#2196F3", label: "Pending", pulse: true },
    success: { color: "#4CAF50", label: "Success", pulse: false },
  };

  const config = statusConfig[status];

  const isCompact = variant === "compact";

  return React.createElement(
    "div",
    {
      onClick,
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
      style: {
        background: hovered && onClick ? "#1f1f3a" : "#1a1a2e",
        border: `1px solid ${hovered && onClick ? config.color : "#333"}`,
        borderRadius: "8px",
        padding: isCompact ? "12px" : "16px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: children || description ? "12px" : 0,
        },
      },
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "12px" } },
        icon &&
          React.createElement(
            "span",
            {
              style: { fontSize: "24px", opacity: 0.8 },
            },
            icon,
          ),
        React.createElement(
          "div",
          null,
          React.createElement(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "8px" } },
            React.createElement("span", {
              style: {
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: config.color,
                boxShadow: config.pulse ? `0 0 8px ${config.color}` : "none",
              },
            }),
            React.createElement(
              "h3",
              {
                style: {
                  margin: 0,
                  color: "#fff",
                  fontSize: isCompact ? "13px" : "15px",
                  fontWeight: 600,
                },
              },
              title,
            ),
          ),
          description &&
            React.createElement(
              "p",
              {
                style: {
                  margin: "4px 0 0 18px",
                  color: "#888",
                  fontSize: "12px",
                },
              },
              description,
            ),
        ),
      ),
      React.createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: "8px" } },
        React.createElement(
          "span",
          {
            style: {
              fontSize: "11px",
              color: config.color,
              background: `${config.color}20`,
              padding: "4px 8px",
              borderRadius: "4px",
              textTransform: "uppercase",
              fontWeight: 600,
            },
          },
          config.label,
        ),
        actions,
      ),
    ),
    children &&
      React.createElement(
        "div",
        {
          style: { paddingLeft: icon ? "36px" : 0 },
        },
        children,
      ),
  );
};

// Metric Component - Displays key performance indicators
export interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string | number;
  trendLabel?: string;
  icon?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outlined" | "filled";
  color?: string;
  format?: "number" | "currency" | "percent" | "bytes";
  precision?: number;
}

// Format utilities for metrics
const formatValue = (
  value: string | number,
  format?: MetricProps["format"],
  precision = 2,
): string => {
  if (typeof value === "string") return value;

  // Clamp precision to [0, 20] for Intl.NumberFormat
  const safePrecision = Math.min(20, Math.max(0, precision));

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: safePrecision,
        maximumFractionDigits: safePrecision,
      }).format(value);
    case "percent":
      return `${(value * 100).toFixed(precision)}%`;
    case "bytes": {
      const units = ["B", "KB", "MB", "GB", "TB"];
      let unitIndex = 0;
      let size = value;
      while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
      }
      return `${size.toFixed(precision)} ${units[unitIndex]}`;
    }
    case "number":
    default:
      return typeof value === "number"
        ? new Intl.NumberFormat("en-US").format(value)
        : String(value);
  }
};

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  unit,
  trend,
  trendValue,
  trendLabel,
  icon,
  size = "md",
  variant = "default",
  color = "#4a9eff",
  format,
  precision,
}) => {
  const sizes = {
    sm: { value: "20px", label: "11px", padding: "12px" },
    md: { value: "28px", label: "12px", padding: "16px" },
    lg: { value: "36px", label: "14px", padding: "20px" },
  };

  const sizeConfig = sizes[size];
  const trendColors = { up: "#4CAF50", down: "#F44336", stable: "#888" };
  const trendIcons = { up: "↑", down: "↓", stable: "→" };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: { background: "#1a1a2e", border: "none" },
    outlined: { background: "transparent", border: "1px solid #333" },
    filled: { background: `${color}15`, border: `1px solid ${color}30` },
  };

  const formattedValue = formatValue(value, format, precision);

  return React.createElement(
    "div",
    {
      style: {
        ...variantStyles[variant],
        padding: sizeConfig.padding,
        borderRadius: "8px",
      },
    },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
        },
      },
      icon &&
        React.createElement(
          "span",
          {
            style: { fontSize: "16px", color: "#666" },
          },
          icon,
        ),
      React.createElement(
        "span",
        {
          style: {
            color: "#888",
            fontSize: sizeConfig.label,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          },
        },
        label,
      ),
    ),
    React.createElement(
      "div",
      {
        style: { display: "flex", alignItems: "baseline", gap: "6px" },
      },
      React.createElement(
        "span",
        {
          style: {
            color: "#fff",
            fontSize: sizeConfig.value,
            fontWeight: 700,
            fontFeatureSettings: '"tnum"',
          },
        },
        formattedValue,
      ),
      unit &&
        React.createElement(
          "span",
          {
            style: { color: "#666", fontSize: "14px" },
          },
          unit,
        ),
    ),
    trend &&
      React.createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            marginTop: "8px",
            color: trendColors[trend],
            fontSize: "12px",
          },
        },
        React.createElement(
          "span",
          {
            style: { fontWeight: 600 },
          },
          `${trendIcons[trend]} ${trendValue ?? ""}`,
        ),
        trendLabel &&
          React.createElement(
            "span",
            {
              style: { color: "#666" },
            },
            trendLabel,
          ),
      ),
  );
};

// Timeline Component - Displays chronological events
export interface TimelineItem {
  id?: string;
  timestamp: Date | string | number;
  title: string;
  description?: string;
  status?: "completed" | "active" | "pending" | "error";
  icon?: React.ReactNode;
  metadata?: Record<string, string | number>;
  onClick?: () => void;
}

export interface TimelineProps {
  items: TimelineItem[];
  variant?: "default" | "compact" | "detailed";
  showConnector?: boolean;
  reverse?: boolean;
  animate?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  items,
  variant = "default",
  showConnector = true,
  reverse = false,
  animate = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const statusConfig = {
    completed: { color: "#4CAF50", icon: "✓" },
    active: { color: "#4a9eff", icon: "●" },
    pending: { color: "#666", icon: "○" },
    error: { color: "#F44336", icon: "✕" },
  };

  const formatTimestamp = (ts: TimelineItem["timestamp"]): string => {
    if (typeof ts === "string") return ts;
    if (typeof ts === "number") return new Date(ts).toLocaleString();
    return ts.toLocaleString();
  };

  const sortedItems = reverse ? [...items].reverse() : items;
  const isCompact = variant === "compact";
  const isDetailed = variant === "detailed";

  return React.createElement(
    "div",
    {
      style: { display: "flex", flexDirection: "column" },
    },
    sortedItems.map((item, index) => {
      const config = statusConfig[item.status || "pending"];
      const isHovered = hoveredIndex === index;
      const isLast = index === sortedItems.length - 1;

      return React.createElement(
        "div",
        {
          key: item.id || index,
          onClick: item.onClick,
          onMouseEnter: () => setHoveredIndex(index),
          onMouseLeave: () => setHoveredIndex(null),
          style: {
            display: "flex",
            gap: isCompact ? "12px" : "16px",
            position: "relative",
            cursor: item.onClick ? "pointer" : "default",
            opacity: animate ? 1 : undefined,
            transform: animate ? "translateX(0)" : undefined,
            transition: "all 0.2s ease-out",
          },
        },
        // Timeline dot and connector
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minWidth: "24px",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                width: isCompact ? "10px" : "14px",
                height: isCompact ? "10px" : "14px",
                borderRadius: "50%",
                background: config.color,
                border: `2px solid ${isHovered ? "#fff" : "#1a1a2e"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                color: "#fff",
                transition: "all 0.2s",
                boxShadow:
                  item.status === "active" ? `0 0 8px ${config.color}` : "none",
              },
            },
            !isCompact && (item.icon ?? config.icon),
          ),
          showConnector &&
            !isLast &&
            React.createElement("div", {
              style: {
                width: "2px",
                flexGrow: 1,
                background: `linear-gradient(to bottom, ${config.color}, #333)`,
                minHeight: isCompact ? "20px" : "32px",
              },
            }),
        ),
        // Content
        React.createElement(
          "div",
          {
            style: {
              flex: 1,
              paddingBottom: isCompact ? "16px" : "24px",
              background:
                isHovered && item.onClick
                  ? "rgba(255, 255, 255, 0.03)"
                  : "transparent",
              borderRadius: "4px",
              padding: isHovered && item.onClick ? "8px" : "0",
              marginLeft: isHovered && item.onClick ? "-8px" : "0",
              transition: "all 0.2s",
            },
          },
          React.createElement(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "4px",
              },
            },
            React.createElement(
              "span",
              {
                style: { color: "#888", fontSize: isCompact ? "11px" : "12px" },
              },
              formatTimestamp(item.timestamp),
            ),
            item.status &&
              React.createElement(
                "span",
                {
                  style: {
                    fontSize: "10px",
                    color: config.color,
                    background: `${config.color}20`,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    textTransform: "uppercase",
                  },
                },
                item.status,
              ),
          ),
          React.createElement(
            "div",
            {
              style: {
                color: "#fff",
                fontWeight: 600,
                fontSize: isCompact ? "13px" : "15px",
                marginBottom: item.description ? "4px" : 0,
              },
            },
            item.title,
          ),
          item.description &&
            React.createElement(
              "div",
              {
                style: {
                  color: "#888",
                  fontSize: isCompact ? "12px" : "14px",
                  lineHeight: 1.5,
                },
              },
              item.description,
            ),
          isDetailed &&
            item.metadata &&
            React.createElement(
              "div",
              {
                style: {
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginTop: "8px",
                  padding: "8px",
                  background: "rgba(255, 255, 255, 0.02)",
                  borderRadius: "4px",
                },
              },
              Object.entries(item.metadata).map(([key, val]) =>
                React.createElement(
                  "div",
                  {
                    key,
                    style: { display: "flex", gap: "4px", fontSize: "12px" },
                  },
                  React.createElement(
                    "span",
                    { style: { color: "#666" } },
                    `${key}:`,
                  ),
                  React.createElement(
                    "span",
                    { style: { color: "#fff" } },
                    String(val),
                  ),
                ),
              ),
            ),
        ),
      );
    }),
  );
};
