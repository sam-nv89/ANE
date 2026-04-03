import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const TASTE_CATEGORIES = [
  { value: 'meat',        emoji: '🥩', label: 'Мясо' },
  { value: 'poultry',     emoji: '🍗', label: 'Птица' },
  { value: 'fish',        emoji: '🐟', label: 'Рыба' },
  { value: 'seafood',     emoji: '🦐', label: 'Морепрод.' },
  { value: 'dairy',       emoji: '🥛', label: 'Молочное' },
  { value: 'cheese',      emoji: '🧀', label: 'Сыры' },
  { value: 'eggs',        emoji: '🥚', label: 'Яйца' },
  { value: 'grains',      emoji: '🌾', label: 'Крупы' },
  { value: 'pasta',       emoji: '🍝', label: 'Макароны' },
  { value: 'bread',       emoji: '🍞', label: 'Выпечка' },
  { value: 'vegetables',  emoji: '🥦', label: 'Овощи' },
  { value: 'fruits',      emoji: '🍎', label: 'Фрукты' },
  { value: 'vegetarian',  emoji: '🌱', label: 'Вегетар.' }
];

const SUGARY_FREQ = [
  { value: 'few',   label: '1–2 раза/нед' },
  { value: 'often', label: '3–4 раза/нед' },
  { value: 'daily', label: 'Каждый день' },
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
  const [tagInput, setTagInput] = React.useState('');

  const toggleCategory = (val) => {
    const current = form.tasteCategories;
    const next = current.includes(val)
      ? current.filter((c) => c !== val)
      : [...current, val];
    if (next.length > 0) update({ tasteCategories: next });
  };

  const addDislikedFreeText = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !form.dislikedFreeText.includes(val)) {
        update({ dislikedFreeText: [...form.dislikedFreeText, val] });
      }
      setTagInput('');
    }
  };

  const removeDislikedFreeText = (val) => {
    update({ dislikedFreeText: form.dislikedFreeText.filter(t => t !== val) });
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
        <div className="option-grid option-grid--4">
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

      {/* Sweets section */}
      <div className="field">
        <Toggle
          value={form.includeSugary}
          onChange={(v) => update({ includeSugary: v })}
          title="Включать сладкое / десерты"
          desc="Добавляем сладости в рацион в рамках целевых калорий"
        />
        {form.includeSugary && (
          <div className="option-grid option-grid--3" style={{ marginTop: 12 }}>
            {SUGARY_FREQ.map((f) => (
              <button
                key={f.value}
                type="button"
                className={`tag ${form.sugaryFrequency === f.value ? 'tag--selected' : ''}`}
                onClick={() => update({ sugaryFrequency: f.value })}
                style={{ textAlign: 'center', justifyContent: 'center' }}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Disliked ingredients free text */}
      <div className="field">
        <div className="field__label">Нелюбимые продукты</div>
        <p className="field__hint" style={{ marginBottom: 10 }}>
          Введите продукт и нажмите Enter
        </p>
        <input
          type="text"
          className="field__input"
          placeholder="Например: лук, укроп, творог"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addDislikedFreeText}
        />
        {form.dislikedFreeText.length > 0 && (
          <div className="tag-grid" style={{ marginTop: 12 }}>
            {form.dislikedFreeText.map((val) => (
              <span key={val} className="tag tag--selected" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {val}
                <button 
                  type="button" 
                  onClick={() => removeDislikedFreeText(val)}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
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
