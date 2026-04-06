import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',  emoji: '🪑', label: 'Сидячий',      sub: 'Нет спорта, офис' },
  { value: 'light',      emoji: '🚶', label: 'Низкий',       sub: '1–3 раза в неделю' },
  { value: 'moderate',   emoji: '🏃', label: 'Средний',      sub: '3–5 раз в неделю' },
  { value: 'active',     emoji: '🏋️', label: 'Высокий',      sub: '6–7 раз в неделю' },
  { value: 'veryActive', emoji: '⚡',  label: 'Экстремальный', sub: 'Спорт 2 раза/день' },
];

export default function BiometricStep({ form, update, onNext, onBack }) {
  const canProceed = form.name.trim().length >= 2;

  return (
    <>
      <h2 className="step__title">Личные данные</h2>
      <p className="step__subtitle">
        Используются для точного расчёта TDEE по формуле Mifflin-St Jeor.
      </p>

      {/* Name */}
      <div className="field">
        <label className="field__label" htmlFor="onb-name">Ваше имя</label>
        <input
          id="onb-name"
          className="field__input"
          type="text"
          placeholder="Например, Анна"
          value={form.name}
          onChange={(e) => update({ name: e.target.value })}
          maxLength={40}
        />
      </div>

      {/* Age & Gender */}
      <div className="field__row">
        <div className="field">
          <label className="field__label" htmlFor="onb-age">Возраст</label>
          <input
            id="onb-age"
            className="field__input"
            type="number"
            min={14} max={100}
            value={form.age}
            onChange={(e) => update({ age: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="onb-gender">Пол</label>
          <select
            id="onb-gender"
            className="field__select"
            value={form.gender}
            onChange={(e) => update({ gender: e.target.value })}
          >
            <option value="female">Женский</option>
            <option value="male">Мужской</option>
          </select>
        </div>
      </div>

      {/* Height */}
      <div className="field">
        <label className="field__label">Рост</label>
        <div className="field__slider-value">
          {form.heightCm} <span className="field__slider-unit">см</span>
        </div>
        <input
          type="range" className="field__slider"
          min={140} max={210} step={1}
          value={form.heightCm}
          onChange={(e) => update({ heightCm: parseInt(e.target.value) })}
          aria-label="Рост"
        />
        <div className="field__hint">140 см — 210 см</div>
      </div>

      {/* Weight */}
      <div className="field">
        <label className="field__label">Вес</label>
        <div className="field__slider-value">
          {form.weightKg} <span className="field__slider-unit">кг</span>
        </div>
        <input
          type="range" className="field__slider"
          min={40} max={200} step={0.5}
          value={form.weightKg}
          onChange={(e) => update({ weightKg: parseFloat(e.target.value) })}
          aria-label="Вес"
        />
        <div className="field__hint">40 кг — 200 кг</div>
      </div>

      {/* Activity */}
      <div className="field">
        <div className="field__label">Уровень активности</div>
        <div className="option-grid option-grid--5">
          {ACTIVITY_OPTIONS.map(({ value, emoji, label, sub }) => (
            <button
              key={value}
              className={`option-card ${form.activityLevel === value ? 'option-card--selected' : ''}`}
              onClick={() => update({ activityLevel: value })}
              type="button"
            >
              <span className="option-card__emoji">{emoji}</span>
              <div className="option-card__label">{label}</div>
              <div className="option-card__sub">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="onboarding__nav">
        <button className="onboarding__back" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Назад
        </button>
        <button
          className="btn-primary"
          onClick={onNext}
          disabled={!canProceed}
          type="button"
        >
          Далее <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
