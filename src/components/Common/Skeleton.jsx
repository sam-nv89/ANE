import React from 'react';
import './Skeleton.css';

/**
 * Skeleton — Универсальный компонент-заглушка.
 * 
 * @param {string} width  - '100%', '200px' и т.д.
 * @param {string} height - '20px', '100%' и т.д.
 * @param {string} circle - Если true, закругляет до круга.
 * @param {string} variant - 'default' | 'glass'
 * @param {string} className - Дополнительные кастомные классы.
 */
export default function Skeleton({ 
  width = '100%', 
  height = '20px', 
  circle = false, 
  variant = 'default',
  style = {},
  className = '' 
}) {
  const combinedStyles = {
    width,
    height,
    ...style
  };

  const classes = [
    'skeleton',
    circle ? 'skeleton-circle' : '',
    variant === 'glass' ? 'skeleton-glass' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={classes} 
      style={combinedStyles}
      aria-hidden="true" 
    />
  );
}
