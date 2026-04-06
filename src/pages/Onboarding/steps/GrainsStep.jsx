import React, { useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const GRAINS_OPTIONS = [
  { value: 'pea',       emoji: '🟢', label: 'Горох' },
  { value: 'buckwheat', emoji: '🤎', label: 'Гречневая крупа' },
  { value: 'quinoa',    emoji: '🌿', label: 'Киноа/Амарант' },
  { value: 'corn',      emoji: '🌽', label: 'Кукурузная' },
  { value: 'pasta',     emoji: '🍝', label: 'Макароны/Паста' },
  { value: 'wheat',     emoji: '🌾', label: 'Манка/Булгур/Кускус' },
  { value: 'chickpea',  emoji: '🟤', label: 'Нут' },
  { value: 'oats',      emoji: '🥣', label: 'Овсянка/Геркулес' },
  { value: 'barley',    emoji: '🌾', label: 'Перловка/Ячневая' },
  { value: 'millet',    emoji: '🟡', label: 'Пшенная крупа' },
  { value: 'rice',      emoji: '🍚', label: 'Рис (белый, бурый)' },
  { value: 'beans',     emoji: '🫘', label: 'Фасоль' },
  { value: 'bread',     emoji: '🍞', label: 'Хлеб/Лаваш' },
  { value: 'lentil',    emoji: '🧆', label: 'Чечевица' },
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

export default function GrainsStep({ form, update, onNext, onBack }) {
  const [tagInput, setTagInput] = useState('');

  const toggleItem = (val) => {
    const current = form.likedGrains || [];
    const next = current.includes(val)
      ? current.filter((c) => c !== val)
      : [...current, val];
    update({ likedGrains: next });
  };

  const isAllSelected = GRAINS_OPTIONS.every(opt => (form.likedGrains || []).includes(opt.value));

  const toggleAll = () => {
    if (isAllSelected) {
      update({ likedGrains: [] });
    } else {
      update({ likedGrains: GRAINS_OPTIONS.map(opt => opt.value) });
    }
  };

  const addDislikedFreeText = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      const currentFreeText = form.dislikedFreeText || [];
      if (val && !currentFreeText.includes(val)) {
        update({ dislikedFreeText: [...currentFreeText, val] });
      }
      setTagInput('');
    }
  };

  const removeDislikedFreeText = (val) => {
    update({ dislikedFreeText: (form.dislikedFreeText || []).filter(t => t !== val) });
  };

  return (
    <>
      <div className="step__header">
        <h2 className="step__title">Макароны и крупы</h2>
        <button 
          type="button" 
          className={`step__select-all ${isAllSelected ? 'step__select-all--active' : ''}`}
          onClick={toggleAll}
        >
          {isAllSelected ? 'Снять всё' : 'Выбрать всё'}
        </button>
      </div>
      <p className="step__subtitle">
        Последний этап вкусовых предпочтений. Отметьте то, что любите есть в качестве гарнира.
      </p>

      <div className="field" style={{ marginTop: 24 }}>
        <div className="option-grid option-grid--4">
          {GRAINS_OPTIONS.map(({ value, emoji, label }) => {
            const isSelected = (form.likedGrains || []).includes(value);
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

      <div className="field" style={{ marginTop: 32 }}>
        <div className="field__label">Дополнительные исключения</div>
        <p className="field__hint" style={{ marginBottom: 10 }}>
          Есть что-то ещё, что вы терпеть не можете? (например: укроп, чеснок). Введите и нажмите Enter.
        </p>
        <input
          type="text"
          className="field__input"
          placeholder="Например: лук, мёд"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={addDislikedFreeText}
        />
        {(form.dislikedFreeText || []).length > 0 && (
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

      {/* Sweets section */}
      <div className="field" style={{ marginTop: 32 }}>
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

      {/* Monotony toggle */}
      <div className="field" style={{ marginTop: 16 }}>
        <Toggle
          value={form.allowRepeatMeals}
          onChange={(v) => update({ allowRepeatMeals: v })}
          title="Разрешить повторения блюд"
          desc="Одно блюдо может появиться до 3 раз за неделю (удобно для batch-cook)"
        />
      </div>

      <div className="onboarding__nav" style={{ marginTop: 32 }}>
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
