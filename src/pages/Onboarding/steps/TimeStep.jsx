import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const TIME_OPTIONS = [
  { value: 15,  emoji: '⚡', label: '15 мин',  sub: 'Только быстрые блюда' },
  { value: 30,  emoji: '🕐', label: '30 мин',  sub: 'Большинство рецептов' },
  { value: 60,  emoji: '🍳', label: '1 час',   sub: 'Полноценная готовка' },
  { value: 120, emoji: '👨‍🍳', label: '2 часа', sub: 'Сложные блюда' },
];

const FREQ_OPTIONS = [
  { value: 'daily',     emoji: '📅', label: 'Ежедневно',    sub: 'Свежее каждый день' },
  { value: 'alternate', emoji: '🔄', label: 'Через день',   sub: 'Готовлю на 2 дня' },
  { value: 'few',       emoji: '📆', label: '2–3 раза',     sub: 'Порции на 2–3 дня' },
  { value: 'batch',     emoji: '🥘', label: 'Batch-cook',  sub: 'Раз в неделю на всё' },
];

function Toggle({ value, onChange, title, desc }) {
  return (
    <button
      type="button"
      className="toggle-row"
      onClick={() => onChange(!value)}
      aria-pressed={value}
    >
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

export default function TimeStep({ form, update, onNext, onBack }) {
  return (
    <>
      <h2 className="step__title">Тайм-менеджмент</h2>
      <p className="step__subtitle">
        Time-Adaptive модуль подберёт рецепты точно под ваш реальный график — 
        без насилия над расписанием.
      </p>

      {/* Time window */}
      <div className="field">
        <div className="field__label">Временное окно на готовку</div>
        <div className="option-grid option-grid--2">
          {TIME_OPTIONS.map(({ value, emoji, label, sub }) => (
            <button
              key={value}
              className={`option-card ${form.cookTimeWindow === value ? 'option-card--selected' : ''}`}
              onClick={() => update({ cookTimeWindow: value })}
              type="button"
            >
              <span className="option-card__emoji">{emoji}</span>
              <div className="option-card__label">{label}</div>
              <div className="option-card__sub">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cook frequency */}
      <div className="field">
        <div className="field__label">Как часто готовите?</div>
        <div className="option-grid option-grid--2">
          {FREQ_OPTIONS.map(({ value, emoji, label, sub }) => (
            <button
              key={value}
              className={`option-card ${form.cookFrequency === value ? 'option-card--selected' : ''}`}
              onClick={() => update({ cookFrequency: value })}
              type="button"
            >
              <span className="option-card__emoji">{emoji}</span>
              <div className="option-card__label">{label}</div>
              <div className="option-card__sub">{sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Lazy toggle */}
      <div className="field">
        <Toggle
          value={form.preferLazy}
          onChange={(v) => update({ preferLazy: v })}
          title="Предпочитаю «ленивые» блюда"
          desc="Overnight oats, сборные миски, минимум активных действий"
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
