import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import './CustomDatePicker.css';

const MONTHS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/**
 * CustomDatePicker - Премиальный выбор даты в стиле приложения.
 * 
 * @param {string} value - Текущая дата в формате YYYY-MM-DD
 * @param {Function} onChange - Коллбэк при выборе даты
 * @param {string} maxDate - Максимально допустимая дата (YYYY-MM-DD)
 */
export default function CustomDatePicker({ value, onChange, maxDate }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const [viewDate, setViewDate] = useState(() => new Date(value || new Date()));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setViewDate(new Date(value || new Date()));
  }




  // Закрытие при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const displayedMonth = viewDate.getMonth();
  const displayedYear = viewDate.getFullYear();

  // Генерация сетки дней
  const calendarDays = useMemo(() => {
    const firstDay = new Date(displayedYear, displayedMonth, 1);
    const lastDay = new Date(displayedYear, displayedMonth + 1, 0);
    
    // День недели первого числа (0 - воскресенье, 6 - суббота)
    // Переводим в формат Пн-Вс (0-6)
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) startDay = 6;

    const days = [];
    
    // Пустые ячейки в начале
    for (let i = 0; i < startDay; i++) {
      days.push({ type: 'empty', id: `empty-${i}` });
    }

    // Дни месяца
    for (let d = 1; d <= lastDay.getDate(); d++) {
      // Формируем YYYY-MM-DD вручную, чтобы избежать сдвига часовых поясов при .toISOString()
      const yearStr = String(displayedYear);
      const monthStr = String(displayedMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const isoStr = `${yearStr}-${monthStr}-${dayStr}`;
      const isFuture = maxDate && isoStr > maxDate;
      
      days.push({
        day: d,
        dateStr: isoStr,
        isToday: new Date().toLocaleDateString('en-CA') === isoStr,
        isSelected: value === isoStr,
        disabled: isFuture,
        type: 'day'
      });
    }

    return days;
  }, [displayedMonth, displayedYear, value, maxDate]);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(displayedYear, displayedMonth - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setViewDate(new Date(displayedYear, displayedMonth + 1, 1));
  };

  const handleSelect = (dateStr) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  // Форматирование даты для отображения в кнопке (ДД.ММ.ГГГГ)
  const formattedValue = useMemo(() => {
    if (!value) return 'Выберите дату';
    const [y, m, d] = value.split('-');
    return `${d}.${m}.${y}`;
  }, [value]);

  return (
    <div className="custom-datepicker" ref={containerRef}>
      <button
        type="button"
        className={`custom-datepicker__trigger ${isOpen ? 'custom-datepicker__trigger--open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{formattedValue}</span>
        <CalendarIcon size={16} className="custom-datepicker__icon" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="custom-datepicker__menu"
          >
            {/* Header */}
            <div className="calendar-header">
              <button className="calendar-nav-btn" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
              <div className="calendar-current-month">
                {MONTHS[displayedMonth]} {displayedYear}
              </div>
              <button className="calendar-nav-btn" onClick={handleNextMonth}><ChevronRight size={16} /></button>
            </div>

            {/* Weekdays */}
            <div className="calendar-grid-weekdays">
              {WEEKDAYS.map(wd => <div key={wd}>{wd}</div>)}
            </div>

            {/* Days Grid */}
            <div className="calendar-grid-days">
              {calendarDays.map((item) => (
                <div key={item.id || item.dateStr} className="calendar-day-cell">
                  {item.type === 'day' && (
                    <button
                      type="button"
                      disabled={item.disabled}
                      onClick={() => handleSelect(item.dateStr)}
                      className={`calendar-day-btn ${item.isSelected ? 'selected' : ''} ${item.isToday ? 'today' : ''} ${item.disabled ? 'disabled' : ''}`}
                    >
                      {item.day}
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="calendar-footer">
              <button 
                type="button"
                className="calendar-today-btn" 
                onClick={() => handleSelect(new Date().toISOString().slice(0, 10))}
              >
                Сегодня
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
