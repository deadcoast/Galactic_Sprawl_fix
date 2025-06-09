import * as React from 'react';

interface BadgeProps {
  text: string;
  color?: string;
  backgroundColor?: string;
  className?: string;
  onClick?: () => void;
}

/**
 * Badge component for displaying labels and status indicators
 */
export const Badge: React.FC<BadgeProps> = ({
  text,
  color,
  backgroundColor,
  className = '',
  onClick,
}) => {
  const style: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.25em 0.6em',
    fontSize: '75%',
    fontWeight: 700,
    lineHeight: 1,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'baseline',
    borderRadius: '0.25rem',
    color: color ?? '#fff',
    backgroundColor: backgroundColor ?? color ?? '#6c757d',
    cursor: onClick ? 'pointer' : 'default',
  };

  return (
    <span className={`badge ${className}`} style={style} onClick={onClick}>
      {text}
    </span>
  );
};
