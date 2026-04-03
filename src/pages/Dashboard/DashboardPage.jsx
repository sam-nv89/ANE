import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, RefreshCw } from 'lucide-react';

import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import { generatePlan } from '../../lib/planner/generator';
import recipes from '../../data/recipes.json';

import './DashboardPage.css';

const MEAL_LABELS = {
  breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус',
};
const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'];

/* ── Macro progress ring ── */
function MacroRing({ label, value, max, color }) {
  const R = 28;
  const CIRC = 2 * Math.PI * R;
  const ratio = Math.min(value / max, 1);
  const offset = CIRC * (1 - ratio);

  return (
    <div className="macro-ring">
      <svg width={70} height={70} className="macro-ring__svg" viewBox="0 0 70 70">
        <circle cx={35} cy={35} r={R} className="macro-ring__circle-bg" />
        <circle
          cx={35} cy={35} r={R}
          className="macro-ring__circle-fg"
          stroke={color}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="macro-ring__value">{value}</div>
      <div className="macro-ring__label">{label}</div>
    </div>
  );
}

/* ── Meal card ── */
function MealCard({ meal, mealType, dayIndex, navigate }) {
  if (!meal) {
    return (
      <div className={`meal-card meal-card--empty`}>
        <div className="meal-card__type">{MEAL_LABELS[mealType]}</div>
        <span style={{ fontSize: 18 }}>—</span>
      </div>
    );
  }

  return (
    <motion.button
      className="meal-card"
      onClick={() => navigate(`/app/meal/${meal.id}`)}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <div className="meal-card__type">{MEAL_LABELS[mealType]}</div>
      <span className="meal-card__emoji">{meal.imageEmoji}</span>
      <div className="meal-card__name">{meal.name}</div>
      <div className="meal-card__meta">
        <span className="meal-card__cal">{meal.calories} ккал</span>
        <span className="meal-card__time">⏱ {meal.cookTimeMin} мин</span>
      </div>
    </motion.button>
  );
}

/* ── Day column ── */
function DayColumn({ day, navigate }) {
  const today = new Date().getDay();
  // Convert JS getDay (0=Sun) to our Mon-based (0=Mon)
  const todayIndex = (today + 6) % 7;
  const isToday = day.dayIndex === todayIndex;

  // Get date for this day
  const date = new Date();
  date.setDate(date.getDate() + (day.dayIndex - todayIndex));
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  return (
    <div className="day-col">
      <div className={`day-col__header ${isToday ? 'day-col__header--today' : ''}`}>
        <div className="day-col__name gradient-text" style={!isToday ? { background: 'unset', color: 'var(--clr-text-primary)', WebkitBackgroundClip: 'unset' } : {}}>
          {day.dayLabel}
        </div>
        <div className="day-col__date">{dateStr}</div>
      </div>

      {MEAL_ORDER.map((mealType) => (
        <MealCard
          key={mealType}
          meal={day.meals[mealType]}
          mealType={mealType}
          dayIndex={day.dayIndex}
          navigate={navigate}
        />
      ))}
    </div>
  );
}

/* ── Today's nutrition summary ── */
function TodaySummary({ plan, nutrition }) {
  const today = new Date().getDay();
  const todayIndex = (today + 6) % 7;
  const todayPlan = plan?.[todayIndex];

  const totals = useMemo(() => {
    if (!todayPlan) return null;
    return Object.values(todayPlan.meals).reduce(
      (acc, m) => {
        if (!m) return acc;
        return {
          calories: acc.calories + m.calories,
          protein:  acc.protein  + m.protein,
          fat:      acc.fat      + m.fat,
          carbs:    acc.carbs    + m.carbs,
        };
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
  }, [todayPlan]);

  if (!totals || !nutrition) return null;

  return (
    <div className="day-summary">
      <div>
        <div className="day-summary__label">Сегодня</div>
        <div className="day-summary__title">
          {totals.calories} / {nutrition.targetCalories} ккал
        </div>
      </div>
      <div className="macro-rings">
        <MacroRing label="Белки"    value={totals.protein} max={nutrition.protein} color="#00d4ff" />
        <MacroRing label="Жиры"     value={totals.fat}     max={nutrition.fat}     color="#f59e0b" />
        <MacroRing label="Углеводы" value={totals.carbs}   max={nutrition.carbs}   color="#a78bfa" />
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, nutrition } = useUserStore();
  const { plan, setPlan } = usePlanStore();

  const handleRegenerate = () => {
    const newPlan = generatePlan(recipes, profile, nutrition);
    setPlan(newPlan);
  };

  if (!plan) {
    return (
      <div className="dashboard">
        <div className="plan-empty">
          <div className="plan-empty__emoji">🍽️</div>
          <div className="plan-empty__title">Рацион ещё не создан</div>
          <p className="plan-empty__sub">
            Завершите онбординг или нажмите кнопку ниже, чтобы сгенерировать ваш первый план питания.
          </p>
          <button className="btn-primary" onClick={handleRegenerate}>
            <Zap size={16} /> Сгенерировать рацион
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Рацион на неделю</h1>
          <p className="dashboard__subtitle">
            Персонализировано для {profile?.name} · {nutrition?.targetCalories} ккал/день
          </p>
        </div>
        <button className="btn-secondary" onClick={handleRegenerate} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={14} /> Пересчитать
        </button>
      </div>

      {/* Today's summary */}
      <TodaySummary plan={plan} nutrition={nutrition} />

      {/* Weekly grid */}
      <motion.div
        className="week-grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        {plan.map((day) => (
          <DayColumn key={day.dayIndex} day={day} navigate={navigate} />
        ))}
      </motion.div>
    </div>
  );
}
