import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const VEG_OPTIONS = [
  { value: 'tomato',   emoji: '🍅', label: 'Помидоры' },
  { value: 'cucumber', emoji: '🥒', label: 'Огурцы' },
  { value: 'zucchini', emoji: '💡', label: 'Кабачок' }, // У эмодзи кабачка нет стабильного кроссплатформенного аналога, кроме лупы или лампочки, используем просто нейтральный или зелень
  { value: 'broccoli', emoji: '🥦', label: 'Брокколи' },
  { value: 'carrot',   emoji: '🥕', label: 'Морковь' },
  { value: 'onion',    emoji: '🧅', label: 'Лук' },
  { value: 'potato',   emoji: '🥔', label: 'Картофель' },
  { value: 'spinach',  emoji: '🥬', label: 'Зелень' },
  { value: 'pumpkin',  emoji: '🎃', label: 'Тыква' },
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
      <h2 className="step__title">Море овощей</h2>
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
