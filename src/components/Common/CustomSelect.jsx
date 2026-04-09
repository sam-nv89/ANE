import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './CustomSelect.css';

/**
 * CustomSelect - Универсальный выпадающий список в стиле Рецептов.
 * 
 * @param {Array} options - [{ value, label, emoji }]
 * @param {any} value - Текущее значение
 * @param {Function} onChange - Коллбэк при выборе
 * @param {string} placeholder - Текст по умолчанию
 * @param {boolean} active - Подсветка активного состояния (как в фильтрах)
 */
export default function CustomSelect({ options, value, onChange, placeholder = 'Выберите...', active = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Закрытие при клике вне компонента
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="custom-select" ref={containerRef}>
      <button
        type="button"
        className={`custom-select__trigger ${isOpen ? 'custom-select__trigger--open' : ''} ${active ? 'custom-select__trigger--active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="custom-select__trigger-content">
           {selectedOption?.emoji && <span className="custom-select__emoji">{selectedOption.emoji}</span>}
           <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown size={14} className={`custom-select__arrow ${isOpen ? 'custom-select__arrow--open' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="custom-select__menu"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`custom-select__item ${value === opt.value ? 'custom-select__item--active' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.emoji && <span className="custom-select__emoji">{opt.emoji}</span>}
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
