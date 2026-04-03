import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const GOALS = [
  { value: 'lose',     emoji: '📉', label: 'Похудение',      sub: 'Дефицит калорий' },
  { value: 'maintain', emoji: '⚖️', label: 'Поддержание',    sub: 'Баланс КБЖУ' },
  { value: 'gain',     emoji: '📈', label: 'Набор массы',    sub: 'Профицит калорий' },
];

const RATES = {
  lose:     [-0.5, -1, -1.5],
  maintain: [0],
  gain:     [0.25, 0.5, 0.75],
};

const RATE_LABELS = {
  '-1.5': '−1.5 кг/нед · Быстро',
  '-1':   '−1 кг/нед · Оптимально',
  '-0.5': '−0.5 кг/нед · Мягко',
  '0':    'Без изменений',
  '0.25': '+0.25 кг/нед · Чисто',
  '0.5':  '+0.5 кг/нед · Умеренно',
  '0.75': '+0.75 кг/нед · Активно',
};

export default function GoalStep({ form, update, onNext, onBack }) {
  const rates = RATES[form.goal] ?? [0];

  // Reset rate when goal changes
  const handleGoalChange = (goal) => {
    const defaultRate = RATES[goal][Math.floor(RATES[goal].length / 2)];
    update({ goal, goalRate: defaultRate });
  };

  return (
    <>
      <h2 className="step__title">Ваша цель</h2>
      <p className="step__subtitle">
        Определяет калорийный коридор и распределение макронутриентов.
      </p>

      {/* Goal selection */}
      <div className="field">
        <div className="field__label">Что хотите достичь?</div>
        <div className="option-grid option-grid--3">
          {GOALS.map(({ value, emoji, label, sub }) => (
            <button
              key={value}
              className={`option-card ${form.goal === value ? 'option-card--selected' : ''}`}
              onClick={() => handleGoalChange(value)}
              type="button"
            >
              <span className="option-card__emoji">{emoji}</span>
              <div className="option-card__label">{label}</div>
              <div className="option-card__sub">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Rate and Target Weight — only show if not maintain */}
      {form.goal !== 'maintain' && (
        <>
          <div className="field">
            <label className="field__label" htmlFor="onb-target-weight">Целевой вес (кг)</label>
            <input
              id="onb-target-weight"
              className="field__input"
              type="number"
              min={40} max={200} step={0.5}
              value={form.targetWeightKg || ''}
              onChange={(e) => update({ targetWeightKg: parseFloat(e.target.value) || null })}
              placeholder={`Например: ${form.goal === 'lose' ? Math.max(40, (form.weightKg || 65) - 5) : (form.weightKg || 65) + 5}`}
            />
          </div>

          <div className="field">
          <div className="field__label">Темп</div>
          <div className="option-grid option-grid--3">
            {rates.map((rate) => (
              <button
                key={rate}
                className={`option-card ${form.goalRate === rate ? 'option-card--selected' : ''}`}
                onClick={() => update({ goalRate: rate })}
                type="button"
              >
                <span className="option-card__emoji">
                  {Math.abs(rate) >= 1 ? '🔥' : rate > 0.4 ? '💪' : '🌱'}
                </span>
                <div className="option-card__label">
                  {RATE_LABELS[String(rate)]}
                </div>
              </button>
            ))}
          </div>
          <div className="field__hint" style={{ marginTop: 12 }}>
            ⚠️ Темп более 1 кг/нед может привести к потере мышечной массы.
            Рекомендуем −0.5 или −1 кг/нед.
            {form.targetWeightKg && Math.abs(form.targetWeightKg - form.weightKg) > 0 && form.goalRate && (
              <div style={{ marginTop: 8, color: 'var(--clr-accent-2)' }}>
                🗓 Примерное время до цели: ~{Math.ceil(Math.abs(form.targetWeightKg - form.weightKg) / Math.abs(form.goalRate))} нед.
              </div>
            )}
          </div>
        </div>
        </>
      )}

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
