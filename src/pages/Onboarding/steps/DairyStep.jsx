import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const DAIRY_OPTIONS = [
  { value: 'cheese',         emoji: '🧀', label: 'Сыр' },
  { value: 'cottage-cheese', emoji: '🥣', label: 'Творог' },
  { value: 'yogurt',         emoji: '🍦', label: 'Йогурт' },
  { value: 'kefir',          emoji: '🥛', label: 'Кефир' },
  { value: 'milk',           emoji: '🥛', label: 'Молоко' },
  { value: 'eggs',           emoji: '🥚', label: 'Яйца' },
];

export default function DairyStep({ form, update, onNext, onBack }) {
  const toggleItem = (val) => {
    const current = form.likedDairy || [];
    const next = current.includes(val)
      ? current.filter((c) => c !== val)
      : [...current, val];
    update({ likedDairy: next });
  };

  return (
    <>
      <h2 className="step__title">Молочные продукты и яйца</h2>
      <p className="step__subtitle">
        Оставьте отмеченными те молочные продукты, которые вы с удовольствием съедите на завтрак или перекус.
      </p>

      <div className="field" style={{ marginTop: 24 }}>
        <div className="option-grid option-grid--4">
          {DAIRY_OPTIONS.map(({ value, emoji, label }) => {
            const isSelected = (form.likedDairy || []).includes(value);
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
