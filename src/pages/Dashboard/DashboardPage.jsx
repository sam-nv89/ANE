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
const MEAL_ORDER = ['breakfast', 'lunch', 'snack', 'dinner'];
const MEAL_TIMES = {
  breakfast: '08:00 – 09:00',
  lunch: '13:00 – 14:00',
  dinner: '18:00 – 19:30',
  snack: '16:00 – 16:30',
};

/* ── Time column ── */
function TimeColumn() {
  return (
    <div className="time-col">
      <div className="time-col__header" />
      {MEAL_ORDER.map((mealType) => (
        <div key={mealType} className="time-col__cell">
          <div className="time-col__time">
            {MEAL_TIMES[mealType].split(' – ')[0]}<br/>
            <span style={{ opacity: 0.5 }}>{MEAL_TIMES[mealType].split(' – ')[1]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

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
function DayColumn({ day, navigate, isSelected, onSelect }) {
  const today = new Date().getDay();
  // Convert JS getDay (0=Sun) to our Mon-based (0=Mon)
  const todayIndex = (today + 6) % 7;
  const isActualToday = day.dayIndex === todayIndex;

  // Get date for this day
  const date = new Date();
  date.setDate(date.getDate() + (day.dayIndex - todayIndex));
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

  return (
    <div className="day-col">
      <button 
        className={`day-col__header ${isActualToday ? 'day-col__header--today' : ''} ${isSelected ? 'day-col__header--selected' : ''}`}
        onClick={() => onSelect(day.dayIndex)}
      >
        <div className={`day-col__name ${isActualToday ? 'gradient-text' : ''}`}>
          {day.dayLabel}
        </div>
        <div className="day-col__date">{dateStr}</div>
      </button>

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
function TodaySummary({ plan, nutrition, selectedIndex }) {
  const selectedPlan = plan?.[selectedIndex];

  const totals = useMemo(() => {
    if (!selectedPlan) return null;
    return Object.values(selectedPlan.meals).reduce(
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
  }, [selectedPlan]);

  const fullDate = useMemo(() => {
    if (!selectedPlan) return '';
    const today = new Date().getDay();
    const todayIndex = (today + 6) % 7;
    const date = new Date();
    date.setDate(date.getDate() + (selectedIndex - todayIndex));
    return date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [selectedIndex, selectedPlan]);

  if (!totals || !nutrition) return null;

  const progress = Math.min((totals.calories / nutrition.targetCalories) * 100, 100);

  return (
    <div className="day-summary">
      <div className="day-summary__info">
        <div className="day-summary__label-row">
          <span className="day-summary__day-name">{fullDate}</span>
          <span className="day-summary__status">Расчет рациона</span>
        </div>
        <div className="day-summary__row">
          <div className="day-summary__group">
            <span className="day-summary__sublabel">По плану</span>
            <span className="day-summary__val day-summary__val--current">{totals.calories}</span>
          </div>
          <div className="day-summary__divider">/</div>
          <div className="day-summary__group">
            <span className="day-summary__sublabel">Цель на день</span>
            <span className="day-summary__val day-summary__val--target">{nutrition.targetCalories} <small>ккал</small></span>
          </div>
        </div>
        <div className="day-summary__progress-bg">
          <motion.div 
            className="day-summary__progress-fg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            key={selectedIndex}
          />
        </div>
      </div>
      <div className="macro-rings">
        <MacroRing key={`p-${selectedIndex}`} label="Белки"    value={totals.protein} max={nutrition.protein} color="#00d4ff" />
        <MacroRing key={`f-${selectedIndex}`} label="Жиры"     value={totals.fat}     max={nutrition.fat}     color="#f59e0b" />
        <MacroRing key={`c-${selectedIndex}`} label="Углеводы" value={totals.carbs}   max={nutrition.carbs}   color="#a78bfa" />
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, nutrition } = useUserStore();
  const { plan, setPlan } = usePlanStore();

  const today = new Date().getDay();
  const todayIdx = (today + 6) % 7;
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(todayIdx);

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
      <TodaySummary plan={plan} nutrition={nutrition} selectedIndex={selectedDayIndex} />

      {/* Weekly grid */}
      <motion.div
        className="week-grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <TimeColumn />
        {plan.map((day) => (
          <DayColumn 
            key={day.dayIndex} 
            day={day} 
            navigate={navigate} 
            isSelected={selectedDayIndex === day.dayIndex}
            onSelect={setSelectedDayIndex}
          />
        ))}
      </motion.div>
    </div>
  );
}
