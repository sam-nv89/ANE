import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const MEAT_OPTIONS = [
  { value: 'beef',    emoji: '🥩', label: 'Говядина' },
  { value: 'pork',    emoji: '🥓', label: 'Свинина' },
  { value: 'lamb',    emoji: '🍖', label: 'Баранина' },
  { value: 'chicken', emoji: '🍗', label: 'Курица' },
  { value: 'turkey',  emoji: '🦃', label: 'Индейка' },
  { value: 'fish',    emoji: '🐟', label: 'Рыба' },
  { value: 'seafood', emoji: '🦐', label: 'Морепродукты' },
];

export default function MeatStep({ form, update, onNext, onBack }) {
  const toggleItem = (val) => {
    const current = form.likedProteins || [];
    const next = current.includes(val)
      ? current.filter((c) => c !== val)
      : [...current, val];
    // Можно отключить всё, если человек вегетарианец
    update({ likedProteins: next });
  };

  return (
    <>
      <h2 className="step__title">Мясо, птица, рыба</h2>
      <p className="step__subtitle">
        Укажите ваши любимые источники белка. Из выбранных продуктов будет составлено меню.
        Если вы не любите свинину, просто снимите галочку, и она не попадется вам в рационе.
      </p>

      <div className="field" style={{ marginTop: 24 }}>
        <div className="option-grid option-grid--4">
          {MEAT_OPTIONS.map(({ value, emoji, label }) => {
            const isSelected = (form.likedProteins || []).includes(value);
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
