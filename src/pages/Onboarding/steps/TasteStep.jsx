import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const TASTE_CATEGORIES = [
  { value: 'meat',        emoji: '🥩', label: 'Мясо' },
  { value: 'fish',        emoji: '🐟', label: 'Рыба' },
  { value: 'poultry',     emoji: '🍗', label: 'Птица' },
  { value: 'vegetarian',  emoji: '🥗', label: 'Вегетар.' },
  { value: 'seafood',     emoji: '🦐', label: 'Морепрод.' },
];

const DISLIKED_OPTIONS = [
  { id: 'onion',         label: 'Лук' },
  { id: 'garlic',        label: 'Чеснок' },
  { id: 'mushrooms',     label: 'Грибы' },
  { id: 'spinach',       label: 'Шпинат' },
  { id: 'broccoli',      label: 'Брокколи' },
  { id: 'cottage-cheese','label': 'Творог' },
  { id: 'tofu',          label: 'Тофу' },
  { id: 'oats',          label: 'Овсянка' },
  { id: 'avocado',       label: 'Авокадо' },
  { id: 'asparagus',     label: 'Спаржа' },
  { id: 'quinoa',        label: 'Киноа' },
  { id: 'chickpea',      label: 'Нут' },
  { id: 'red-lentil',    label: 'Чечевица' },
  { id: 'tuna-canned',   label: 'Тунец' },
  { id: 'shrimp',        label: 'Креветки' },
];

function Toggle({ value, onChange, title, desc }) {
  return (
    <button type="button" className="toggle-row" onClick={() => onChange(!value)} aria-pressed={value}>
      <div className="toggle-row__text">
        <div className="toggle-row__title">{title}</div>
        <div className="toggle-row__desc">{desc}</div>
      </div>
      <div className={`toggle ${value ? 'toggle--on' : ''}`}>
        <div className="toggle__knob" />
      </div>
    </button>
  );
}

export default function TasteStep({ form, update, onNext, onBack }) {
  const toggleCategory = (val) => {
    const current = form.tasteCategories;
    const next = current.includes(val)
      ? current.filter((c) => c !== val)
      : [...current, val];
    if (next.length > 0) update({ tasteCategories: next });
  };

  const toggleDisliked = (id) => {
    const current = form.dislikedIngredients;
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id];
    update({ dislikedIngredients: next });
  };

  return (
    <>
      <h2 className="step__title">Вкусовые предпочтения</h2>
      <p className="step__subtitle">
        Psychological Comfort модуль учитывает ваши привычки и не предлагает 
        блюда, которые вам не нравятся.
      </p>

      {/* Taste categories */}
      <div className="field">
        <div className="field__label">Что едите? (можно несколько)</div>
        <div className="option-grid option-grid--5">
          {TASTE_CATEGORIES.map(({ value, emoji, label }) => (
            <button
              key={value}
              className={`option-card ${form.tasteCategories.includes(value) ? 'option-card--selected' : ''}`}
              onClick={() => toggleCategory(value)}
              type="button"
            >
              <span className="option-card__emoji">{emoji}</span>
              <div className="option-card__label">{label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Disliked ingredients */}
      <div className="field">
        <div className="field__label">Нелюбимые ингредиенты</div>
        <p className="field__hint" style={{ marginBottom: 10 }}>
          Блюда с выбранными ингредиентами будут исключены из рациона
        </p>
        <div className="tag-grid">
          {DISLIKED_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              className={`tag ${form.dislikedIngredients.includes(id) ? 'tag--selected' : ''}`}
              onClick={() => toggleDisliked(id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Monotony toggle */}
      <div className="field">
        <Toggle
          value={form.allowRepeatMeals}
          onChange={(v) => update({ allowRepeatMeals: v })}
          title="Разрешить повторения блюд"
          desc="Одно блюдо может появиться до 3 раз за неделю (удобно для batch-cook)"
        />
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
