import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, RefreshCw } from 'lucide-react';

import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import { generatePlan, generateSingleMeal } from '../../lib/planner/generator';
import recipes from '../../data/recipes.json';

import Skeleton from '../../components/Common/Skeleton';
import './DashboardPage.css';

const MEAL_LABELS = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус 1',
  snack2: 'Перекус 2',
  snack3: 'Перекус 3',
  snack4: 'Перекус 4',
};

const MEAL_TIMES = {
  breakfast: '08:00 – 09:00',
  snack:     '11:00 – 11:30',
  lunch:     '13:00 – 14:00',
  snack2:    '15:30 – 16:00',
  snack3:    '17:00 – 17:30',
  dinner:    '19:00 – 20:00',
  snack4:    '21:00 – 21:30',
};

const DEFAULT_ORDER = ['breakfast', 'snack', 'lunch', 'snack2', 'snack3', 'dinner', 'snack4'];
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

/* ── Time column ── */
function TimeColumn({ order }) {
  return (
    <div className="time-col">
      <div className="time-col__header" />
      {order.map((mealType) => (
        <div key={mealType} className="time-col__cell">
          <div className="time-col__time">
            {(MEAL_TIMES[mealType] || '—').split(' – ')[0]}<br/>
            <span style={{ opacity: 0.5 }}>{(MEAL_TIMES[mealType] || '').split(' – ')[1]}</span>
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
function MealCard({ meal, mealType, dayIndex, navigate, isLoading, onSwap }) {
  if (isLoading) {
    return (
      <div className="meal-card meal-card--skeleton">
        <Skeleton width="60px" height="12px" style={{ marginBottom: 8, opacity: 0.5 }} />
        <Skeleton circle width="32px" height="32px" style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height="14px" style={{ marginBottom: 8 }} />
        <Skeleton width="70%" height="10px" />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className={`meal-card meal-card--empty`}>
        <div className="meal-card__type">{MEAL_LABELS[mealType]}</div>
        <span style={{ fontSize: 18 }}>—</span>
      </div>
    );
  }

  return (
    <motion.div
      className="meal-card"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <button 
        className="meal-card__main-btn"
        onClick={() => navigate(`/app/meal/${meal.id}`, { state: { multiplier: meal.multiplier, calories: meal.calories } })}
      >
        <div className="meal-card__type">{MEAL_LABELS[mealType]}</div>
        <span className="meal-card__emoji">{meal.imageEmoji}</span>
        <div className="meal-card__name">{meal.name}</div>
        <div className="meal-card__meta">
          <span className="meal-card__cal">{meal.calories} ккал</span>
          <span className="meal-card__time">⏱ {meal.cookTimeMin} мин</span>
        </div>
      </button>

      <button 
        className="meal-card__swap-btn" 
        onClick={(e) => {
          e.stopPropagation();
          onSwap(dayIndex, mealType);
        }}
        title="Заменить это блюдо"
      >
        <RefreshCw size={14} />
      </button>
    </motion.div>
  );
}

/* ── Day column ── */
function DayColumn({ day, navigate, isSelected, onSelect, order, isLoading, onSwap }) {
  const today = new Date().getDay();
  const todayIndex = (today + 6) % 7;
  const isActualToday = day.dayIndex === todayIndex;

  const date = new Date();
  date.setDate(date.getDate() + (day.dayIndex - todayIndex));
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/\s*г\.?\s*$/i, '');

  return (
    <div className="day-col">
      <button 
        className={`day-col__header ${isActualToday ? 'day-col__header--today' : ''} ${isSelected ? 'day-col__header--selected' : ''}`}
        onClick={() => onSelect(day.dayIndex)}
        disabled={isLoading}
      >
        <div className={`day-col__name ${isActualToday ? 'gradient-text' : ''}`}>
          {day.dayLabel}
        </div>
        {isLoading ? (
          <Skeleton width="40px" height="10px" style={{ margin: '4px auto' }} />
        ) : (
          <div className="day-col__date">{dateStr}</div>
        )}
      </button>

      {order.map((mealType) => (
        <MealCard
          key={mealType}
          meal={day.meals[mealType]}
          mealType={mealType}
          dayIndex={day.dayIndex}
          navigate={navigate}
          isLoading={isLoading}
          onSwap={onSwap}
        />
      ))}
    </div>
  );
}

/* ── Today's nutrition summary ── */
function TodaySummary({ plan, nutrition, selectedIndex, isLoading }) {
  const selectedPlan = plan?.[selectedIndex];

  const totals = useMemo(() => {
    if (!selectedPlan || isLoading) return null;
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
  }, [selectedPlan, isLoading]);

  const fullDate = useMemo(() => {
    if (!selectedPlan) return '';
    const today = new Date().getDay();
    const todayIndex = (today + 6) % 7;
    const date = new Date();
    date.setDate(date.getDate() + (selectedIndex - todayIndex));
    const dateStr = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    return dateStr.replace(/\s*г\.?\s*$/i, '');
  }, [selectedIndex, selectedPlan]);

  if (isLoading) {
    return (
      <div className="day-summary">
        <div className="day-summary__info" style={{ width: '100%' }}>
          <Skeleton width="180px" height="24px" style={{ marginBottom: 12 }} />
          <Skeleton width="120px" height="36px" style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height="8px" style={{ marginBottom: 0 }} />
        </div>
        <div className="macro-rings">
          {[1, 2, 3].map(i => (
            <div key={i} className="macro-ring">
              <Skeleton circle width="60px" height="60px" style={{ marginBottom: 8 }} />
              <Skeleton width="40px" height="12px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

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
  const { plan, setPlan, isLoading, setLoading, replaceMeal } = usePlanStore();

  const handleSwapMeal = (dayIndex, mealType) => {
    const dayMeals = plan[dayIndex].meals;
    const currentMealId = dayMeals[mealType]?.id;
    const selectedSoFar = Object.values(dayMeals).filter(Boolean).map((m) => ({ id: m.id }));

    const newMeal = generateSingleMeal(recipes, profile, nutrition, mealType, selectedSoFar, currentMealId);
    if (newMeal) {
      replaceMeal(dayIndex, mealType, newMeal);
    }
  };

  const today = new Date().getDay();
  const todayIdx = (today + 6) % 7;
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(todayIdx);

  const mealOrder = useMemo(() => {
    if (!plan || plan.length === 0) return [];
    const keys = Object.keys(plan[0].meals);
    return DEFAULT_ORDER.filter(k => keys.includes(k));
  }, [plan]);

  const handleRegenerate = () => {
    setLoading(true);
    setTimeout(() => {
      const newPlan = generatePlan(recipes, profile, nutrition);
      setPlan(newPlan);
    }, 1200);
  };

  if (!plan && !isLoading) {
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

  const displayOrder = mealOrder.length > 0 ? mealOrder : DEFAULT_ORDER.slice(0, 4);
  const displayPlan = plan || Array.from({ length: 7 }, (_, i) => ({ dayIndex: i, dayLabel: DAY_LABELS[i], meals: {} }));

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
      <TodaySummary plan={displayPlan} nutrition={nutrition} selectedIndex={selectedDayIndex} isLoading={isLoading} />

      {/* Weekly grid */}
      <motion.div
        className="week-grid"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ '--meal-count': displayOrder.length }}
      >
        <TimeColumn order={displayOrder} />
        {displayPlan.map((day) => (
          <DayColumn 
            key={day.dayIndex} 
            day={day} 
            navigate={navigate} 
            isSelected={selectedDayIndex === day.dayIndex}
            onSelect={setSelectedDayIndex}
            order={displayOrder}
            isLoading={isLoading}
            onSwap={handleSwapMeal}
          />
        ))}
      </motion.div>
    </div>
  );
}
