import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const ALLERGENS = [
  { id: 'gluten',      label: 'Глютен',       emoji: '🌾' },
  { id: 'dairy',       label: 'Лактоза',      emoji: '🥛' },
  { id: 'eggs',        label: 'Яйца',         emoji: '🥚' },
  { id: 'nuts',        label: 'Орехи',        emoji: '🥜' },
  { id: 'fish',        label: 'Рыба',         emoji: '🐟' },
  { id: 'shellfish',   label: 'Морепрод.',    emoji: '🦐' },
  { id: 'soy',         label: 'Соя',          emoji: '🫘' },
  { id: 'sesame',      label: 'Кунжут',       emoji: '🌰' },
];

const MEDICAL = [
  { id: 'diabetes2',  label: 'Диабет 2 типа' },
  { id: 'hypertension', label: 'Гипертония' },
  { id: 'low-salt',   label: 'Без соли' },
  { id: 'low-fat',    label: 'Низкожировое' },
  { id: 'ibs',        label: 'СРК / Чувств. ЖКТ' },
];

const DIETARY = [
  { id: 'vegetarian', label: '🥗 Вегетарианство' },
  { id: 'vegan',      label: '🌱 Веганство' },
  { id: 'keto',       label: '🥓 Кето' },
  { id: 'fasting',    label: '⏰ Интерв. голодание' },
  { id: 'halal',      label: '☪️ Халяль' },
  { id: 'kosher',     label: '✡️ Кошер' },
];

const FREQUENCIES = [3, 5, 7];

const MEAL_PREFS = [
  { id: 'no-breakfast',    label: 'Без завтрака' },
  { id: 'heavy-breakfast', label: 'Плотный завтрак' },
  { id: 'light-dinner',    label: 'Облегченный ужин' },
  { id: 'no-dinner',       label: 'Без ужина' },
];

export default function AllergenStep({ form, update, onNext, onBack }) {
  const toggle = (field, id) => {
    const current = form[field] || [];
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    update({ [field]: next });
  };

  return (
    <>
      <h2 className="step__title">Ограничения и режим</h2>
      <p className="step__subtitle">
        Precision Bio модуль учитывает любые ограничения и ваши личные предпочтения по режиму дня.
      </p>

      {/* Allergens */}
      <div className="field">
        <div className="field__label">Аллегрены и запрещённые продукты</div>
        <div className="option-grid option-grid--2">
          {ALLERGENS.map(({ id, label, emoji }) => (
            <button
              key={id}
              type="button"
              className={`option-card ${form.allergens.includes(id) ? 'option-card--selected' : ''}`}
              onClick={() => toggle('allergens', id)}
              style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px' }}
            >
              <span style={{ fontSize: 22 }}>{emoji}</span>
              <div>
                <div className="option-card__label">{label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional exclusions */}
      <div className="field">
        <label className="field__label">Дополнительные исключения</label>
        <textarea
          className="field__input"
          style={{ minHeight: 80, paddingTop: 12, resize: 'vertical' }}
          placeholder="Например: кинза, сельдерей, оливки..."
          value={form.excludedIngredientsFreeText || ''}
          onChange={(e) => update({ excludedIngredientsFreeText: e.target.value })}
        />
        <div className="field__hint">Перечислите продукты, которые вы НЕ хотите видеть в меню</div>
      </div>

      <div className="field">
        <div className="field__label">Количество приёмов пищи</div>
        <div className="tag-grid">
          {FREQUENCIES.map((freq) => (
            <button
              key={freq}
              className={`tag ${form.mealFrequency === freq ? 'tag--selected' : ''}`}
              onClick={() => update({ mealFrequency: freq })}
              type="button"
            >
              {freq === 3 ? '3 приёма' : `${freq} приёмов`}
            </button>
          ))}
        </div>
      </div>

      {/* Meal Specifics */}
      <div className="field">
        <div className="field__label">Особенности приёмов</div>
        <div className="tag-grid">
          {MEAL_PREFS.map(({ id, label }) => (
            <button
              key={id}
              className={`tag ${form.mealSpecifics.includes(id) ? 'tag--selected' : ''}`}
              onClick={() => toggle('mealSpecifics', id)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Medical restrictions */}
      <div className="field">
        <div className="field__label">Медицинские ограничения</div>
        <div className="tag-grid">
          {MEDICAL.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`tag ${form.medicalRestrictions.includes(id) ? 'tag--selected' : ''}`}
              onClick={() => toggle('medicalRestrictions', id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Dietary styles */}
      <div className="field">
        <div className="field__label">Диетический стиль</div>
        <div className="tag-grid">
          {DIETARY.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`tag ${form.dietaryStyles.includes(id) ? 'tag--selected' : ''}`}
              onClick={() => toggle('dietaryStyles', id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding__nav">
        <button className="onboarding__back" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Назад
        </button>
        <button className="btn-primary" onClick={onNext} type="button">
          Рассчитать КБЖУ <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
