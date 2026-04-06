import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const VEG_OPTIONS = [
  // Овощи
  { value: 'tomato',      emoji: '🍅', label: 'Помидоры' },
  { value: 'cucumber',    emoji: '🥒', label: 'Огурцы' },
  { value: 'zucchini',    emoji: '💡', label: 'Кабачок' }, 
  { value: 'broccoli',    emoji: '🥦', label: 'Брокколи/Цветная' },
  { value: 'carrot',      emoji: '🥕', label: 'Морковь' },
  { value: 'onion',       emoji: '🧅', label: 'Лук' },
  { value: 'potato',      emoji: '🥔', label: 'Картофель/Батат' },
  { value: 'spinach',     emoji: '🥬', label: 'Зелень/Шпинат' },
  { value: 'pumpkin',     emoji: '🎃', label: 'Тыква' },
  { value: 'cabbage',     emoji: '🥬', label: 'Капуста' },
  { value: 'bell-pepper', emoji: '🫑', label: 'Сладкий перец' },
  { value: 'eggplant',    emoji: '🍆', label: 'Баклажан' },
  { value: 'garlic',      emoji: '🧄', label: 'Чеснок' },
  { value: 'mushrooms',   emoji: '🍄', label: 'Грибы' },
  // Фрукты и Ягоды
  { value: 'apple',       emoji: '🍎', label: 'Яблоки' },
  { value: 'banana',      emoji: '🍌', label: 'Бананы' },
  { value: 'citrus',      emoji: '🍊', label: 'Цитрусовые' },
  { value: 'berries',     emoji: '🍓', label: 'Ягоды' },
  { value: 'peach',       emoji: '🍑', label: 'Персики/Абрикосы' },
];

export default function VegStep({ form, update, onNext, onBack }) {
  const toggleItem = (val) => {
    const current = form.likedVeg || [];
    const next = current.includes(val)
      ? current.filter((c) => c !== val)
      : [...current, val];
    update({ likedVeg: next });
  };

  return (
    <>
      <h2 className="step__title">Овощи, фрукты и грибы</h2>
      <p className="step__subtitle">
        Выбирайте любимые! Если отметить только помидоры и огурцы — меню будет состоять в основном из них.
      </p>

      <div className="field" style={{ marginTop: 24 }}>
        <div className="option-grid option-grid--4">
          {VEG_OPTIONS.map(({ value, emoji, label }) => {
            const isSelected = (form.likedVeg || []).includes(value);
            return (
              <button
                key={value}
                className={`option-card ${isSelected ? 'option-card--selected' : ''}`}
                onClick={() => toggleItem(value)}
                type="button"
              >
                <span className="option-card__emoji">{emoji}</span>
                <div className="option-card__label">{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="onboarding__nav">
        <button className="onboarding__back" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Назад
        </button>
        <button className="btn-primary" onClick={onNext} type="button">
          Далее <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
