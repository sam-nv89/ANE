import React, { useMemo, useTransition } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, RefreshCw, Play, Zap, Calendar, ChevronLeft, ChevronRight, FileText, Layout, ChevronDown, Download, ExternalLink, X, Search, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { pageFade, slideUp, staggerContainer, staggerItem, modalBackdrop, modalContent, dropdownDown, dropdownUp, highlightAttention, cardHover, tapScale, pulse } from '../../lib/animations';

import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import { generatePlan, generateSingleMeal, getFilteredPoolForMeal } from '../../lib/planner/generator';
import { getCyclePhase, getPhaseModifiers } from '../../lib/nutrition/cycleSync';
import recipes from '../../data/recipes.json';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  snack: '11:00 – 11:30',
  lunch: '13:00 – 14:00',
  snack2: '15:30 – 16:00',
  snack3: '17:00 – 17:30',
  dinner: '19:00 – 20:00',
  snack4: '21:00 – 21:30',
};

const DEFAULT_ORDER = ['breakfast', 'snack', 'lunch', 'snack2', 'snack3', 'dinner', 'snack4'];
const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const fmtNum = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

/* ── Time column ── */
function TimeColumn({ order }) {
  return (
    <div className="time-col">
      <div className="time-col__header" />
      {order.map((mealType) => (
        <div key={mealType} className="time-col__cell">
          <div className="time-col__time">
            {(MEAL_TIMES[mealType] || '—').split(' – ')[0]}<br />
            <span style={{ opacity: 0.5 }}>{(MEAL_TIMES[mealType] || '').split(' – ')[1]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Macro progress ring ── */
function MacroRing({ label, value, max, color }) {
  const R = 33;
  const CIRC = 2 * Math.PI * R;
  const ratio = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = CIRC * (1 - ratio);

  return (
    <div className="macro-ring">
      <div className="macro-ring__container">
        <svg width={80} height={80} className="macro-ring__svg" viewBox="0 0 80 80">
          <circle cx={40} cy={40} r={R} className="macro-ring__circle-bg" />
          <circle
            cx={40} cy={40} r={R}
            className="macro-ring__circle-fg"
            stroke={color}
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="macro-ring__value">
          <span className="macro-ring__val-num">{fmtNum(Math.round(max))}</span>
        </div>
      </div>
      <div className="macro-ring__info">
        <div className="macro-ring__label">{label}</div>
        <div className="macro-ring__current">
          <span className="macro-ring__curr-num">{fmtNum(Math.round(value))}</span>
          <span className="macro-ring__separator">/</span>
          <span>{fmtNum(Math.round(max))}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Meal card ── */
function MealCard({ meal, mealType, dayIndex, navigate, isLoading, onSwap, isCompleted, onToggle, isHighlighted }) {
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
      className={`meal-card ${isCompleted ? 'meal-card--completed' : ''} ${isHighlighted ? 'meal-card--highlighted' : ''}`}
      onClick={() => onToggle(dayIndex, mealType)}
      {...cardHover}
      {...tapScale}
      {...(isHighlighted ? highlightAttention : {})}
      style={{ cursor: 'pointer' }}
      id={`meal-${dayIndex}-${mealType}`}
    >
      <div className="meal-card__top-row">
        <div className="meal-card__done-indicator">
          <div className={`check-circle ${isCompleted ? 'check-circle--active' : ''}`}>
            {isCompleted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.div>}
          </div>
        </div>

        <div className="meal-card__type-info">
          <div className="meal-card__type">{MEAL_LABELS[mealType]}</div>
          <span className="meal-card__time">⏱ {meal.cookTimeMin} мин</span>
        </div>
      </div>

      <div className="meal-card__content">
        <span className="meal-card__emoji">{meal.imageEmoji}</span>
        <div className="meal-card__name">
          {meal.name}
          <button
            className="meal-card__link-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/app/meal/${meal.id}`, { state: { multiplier: meal.multiplier, calories: meal.calories } });
            }}
            title="Открыть рецепт"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      <div className="meal-card__footer-row">
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

        <div className="meal-card__cal-row">
          <span className="meal-card__cal">{fmtNum(meal.calories)} ккал</span>
          {meal.targetCal && (
            <span className={`meal-card__precision ${Math.abs(meal.calories - meal.targetCal) <= 5 ? 'meal-card__precision--perfect' : ''}`}>
              {meal.calories - meal.targetCal === 0 ? '✓' : (meal.calories - meal.targetCal > 0 ? `+${fmtNum(meal.calories - meal.targetCal)}` : `${fmtNum(meal.calories - meal.targetCal)}`)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Day column ── */
function DayColumn({ day, navigate, isSelected, onSelect, order, isLoading, onSwap, completed, onToggle, targetCalories, highlightCoords }) {
  const today = new Date().getDay();
  const todayIndex = (today + 6) % 7;
  const isActualToday = day.dayIndex === todayIndex;

  const date = new Date();
  date.setDate(date.getDate() + (day.dayIndex - todayIndex));
  const dateStr = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/\s*г\.?\s*$/i, '');

  const factCalories = Object.keys(day.meals)
    .filter(type => day.meals[type] && completed.includes(`${day.dayIndex}:${type}`))
    .reduce((acc, type) => acc + (day.meals[type]?.calories || 0), 0) +
    (day.customMeals?.filter(m => completed.includes(`${day.dayIndex}:${m.id}`))
      .reduce((acc, m) => acc + (m.calories || 0), 0) || 0);

  const compliance = targetCalories > 0 ? (factCalories / targetCalories) * 100 : 0;
  const progressPercent = Math.min(compliance, 100);

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

        {!isLoading && targetCalories > 0 && (
          <div className="day-col__progress-wrap">
            <div className="day-col__progress-bar">
              <motion.div
                className="day-col__progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="day-col__compliance-text">{Math.round(progressPercent)}%</span>
          </div>
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
          isCompleted={completed.includes(`${day.dayIndex}:${mealType}`)}
          onToggle={onToggle}
          isHighlighted={highlightCoords?.day === day.dayIndex && highlightCoords?.type === mealType}
        />
      ))}



    </div>
  );
}

/* ── Today's nutrition summary ── */
function TodaySummary({ plan, nutrition, selectedIndex, isLoading, completed, period = 'day' }) {
  const totals = useMemo(() => {
    if (!plan || isLoading) return null;

    if (period === 'day') {
      const day = plan[selectedIndex];
      const entries = Object.entries(day.meals);

      const planSum = entries.reduce(
        (acc, [, m]) => {
          if (!m) return acc;
          return {
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
            fat: acc.fat + m.fat,
            carbs: acc.carbs + m.carbs,
            mealsCount: acc.mealsCount + 1,
          };
        },
        { calories: 0, protein: 0, fat: 0, carbs: 0, mealsCount: 0 }
      );

      const factSum = entries.reduce(
        (acc, [type, m]) => {
          if (!m || !completed.includes(`${selectedIndex}:${type}`)) return acc;
          return {
            calories: acc.calories + m.calories,
            protein: acc.protein + m.protein,
            fat: acc.fat + m.fat,
            carbs: acc.carbs + m.carbs,
            mealsCount: acc.mealsCount + 1,
          };
        },
        { calories: 0, protein: 0, fat: 0, carbs: 0, mealsCount: 0 }
      );



      return { plan: planSum, fact: factSum, target: nutrition };
    } else {
      // WEEKLY CALCULATION
      let totalPlan = { calories: 0, protein: 0, fat: 0, carbs: 0, mealsCount: 0 };
      let totalFact = { calories: 0, protein: 0, fat: 0, carbs: 0, mealsCount: 0 };

      plan.forEach((day, dIdx) => {
        Object.entries(day.meals).forEach(([type, m]) => {
          if (!m) return;
          totalPlan.calories += m.calories;
          totalPlan.protein += m.protein;
          totalPlan.fat += m.fat;
          totalPlan.carbs += m.carbs;
          totalPlan.mealsCount += 1;

          if (completed.includes(`${dIdx}:${type}`)) {
            totalFact.calories += m.calories;
            totalFact.protein += m.protein;
            totalFact.fat += m.fat;
            totalFact.carbs += m.carbs;
            totalFact.mealsCount += 1;
          }
        });
      });

      return {
        plan: totalPlan,
        fact: totalFact,
        target: {
          targetCalories: nutrition.targetCalories * 7,
          protein: nutrition.protein * 7,
          fat: nutrition.fat * 7,
          carbs: nutrition.carbs * 7
        }
      };
    }
  }, [plan, isLoading, completed, selectedIndex, period, nutrition]);

  const periodLabel = useMemo(() => {
    if (!plan) return '';

    // Helper to get week number
    const getWeekNo = (d) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };

    // Helper to format date
    const fmtDT = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

    if (period === 'day') {
      const today = new Date().getDay();
      const todayIndex = (today + 6) % 7;
      const date = new Date();
      date.setDate(date.getDate() + (selectedIndex - todayIndex));
      const label = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      return label.charAt(0).toUpperCase() + label.slice(1);
    } else {
      const today = new Date().getDay();
      const todayIndex = (today + 6) % 7;
      const start = new Date();
      start.setDate(start.getDate() - todayIndex);
      const end = new Date();
      end.setDate(end.getDate() + (6 - todayIndex));

      const weekNum = getWeekNo(start);
      return `Неделя ${weekNum}: с ${fmtDT(start)} по ${fmtDT(end)}`;
    }
  }, [selectedIndex, plan, period]);

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

  const progress = Math.min((totals.fact.calories / totals.target.targetCalories) * 100, 100);

  return (
    <div className="day-summary">
      {/*
        day-summary__info — блок для десктопа (дата + статы + прогресс).
        На мобиле скрывается через CSS (display:none !important),
        вместо него рендерится day-summary__mobile-table.
      */}
      <div className="day-summary__info">
        {/* Заголовок: только дата */}
        <div className="day-summary__header-row">
          <span className="day-summary__day-name">{periodLabel}</span>
        </div>

        {/* Три стат-колонки */}
        <div className="day-summary__row">
          <div className="day-summary__group">
            <span className="day-summary__sublabel">{period === 'day' ? 'Съедено, ккал.' : 'Итого за неделю, ккал.'}</span>
            <span className="day-summary__val day-summary__val--current">{fmtNum(totals.fact.calories)}</span>
          </div>
          <div className="day-summary__group">
            <span className="day-summary__sublabel">{period === 'day' ? 'Цель дня, ккал.' : 'Цель на неделю, ккал.'}</span>
            <span className="day-summary__val day-summary__val--target">{fmtNum(totals.target.targetCalories)}</span>
          </div>
          <div className="day-summary__group">
            <span className="day-summary__sublabel">Выполнение</span>
            <span className="day-summary__val day-summary__val--compliance">
              {Math.round((totals.fact.calories / totals.target.targetCalories) * 100)}%
            </span>
          </div>
        </div>

        {/* Прогресс-бар */}
        <div className="day-summary__progress-bg">
          <motion.div
            className="day-summary__progress-fg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            key={`progress-${selectedIndex}-${period}`}
          />
        </div>
      </div>

      {/* Кольца макронутриентов — десктоп (hidden on mobile) */}
      <div className="macro-rings">
        <MacroRing key={`p-${selectedIndex}-${period}`} label="Белки"    value={totals.fact.protein} max={totals.target.protein} color="#00d4ff" />
        <MacroRing key={`f-${selectedIndex}-${period}`} label="Жиры"     value={totals.fact.fat}     max={totals.target.fat}     color="#f59e0b" />
        <MacroRing key={`c-${selectedIndex}-${period}`} label="Углеводы" value={totals.fact.carbs}   max={totals.target.carbs}   color="#a78bfa" />
      </div>

      {/*
        Мобильная 6-ячеечная таблица (hidden on desktop).
        3 стат-ячейки (строка 1) + 3 ячейки с кольцами (строка 2).
      */}
      <div className="day-summary__mobile-table">
        <div className="dsmt-cell dsmt-cell--stat">
          <span className="day-summary__sublabel">{period === 'day' ? 'Съедено' : 'Итого'}</span>
          <span className="day-summary__val day-summary__val--current">{fmtNum(totals.fact.calories)}</span>
        </div>
        <div className="dsmt-cell dsmt-cell--stat">
          <span className="day-summary__sublabel">{period === 'day' ? 'Цель дня' : 'Цель нед.'}</span>
          <span className="day-summary__val day-summary__val--target">{fmtNum(totals.target.targetCalories)}</span>
        </div>
        <div className="dsmt-cell dsmt-cell--stat">
          <span className="day-summary__sublabel">Выполнение</span>
          <span className="day-summary__val day-summary__val--compliance">
            {Math.round((totals.fact.calories / totals.target.targetCalories) * 100)}%
          </span>
        </div>
        <div className="dsmt-cell dsmt-cell--ring">
          <MacroRing key={`mp-${selectedIndex}-${period}`} label="Белки"    value={totals.fact.protein} max={totals.target.protein} color="#00d4ff" />
        </div>
        <div className="dsmt-cell dsmt-cell--ring">
          <MacroRing key={`mf-${selectedIndex}-${period}`} label="Жиры"     value={totals.fact.fat}     max={totals.target.fat}     color="#f59e0b" />
        </div>
        <div className="dsmt-cell dsmt-cell--ring">
          <MacroRing key={`mc-${selectedIndex}-${period}`} label="Углеводы" value={totals.fact.carbs}   max={totals.target.carbs}   color="#a78bfa" />
        </div>
      </div>
    </div>
  );
}

/* ── Cycle Widget ── */
function CycleWidget({ profile }) {
  if (profile?.gender !== 'female' || !profile?.cycleTracking?.enabled || !profile?.cycleTracking?.lastPeriodDate) return null;

  const phaseData = getCyclePhase(profile.cycleTracking.lastPeriodDate, profile.cycleTracking.cycleLength, new Date());
  if (!phaseData) return null;

  const modifiers = getPhaseModifiers(phaseData.phase);

  const phaseNames = {
    menstrual: 'Менструальная',
    follicular: 'Фолликулярная',
    ovulatory: 'Овуляторная',
    luteal: 'Лютеиновая'
  };

  return (
    <div className="cycle-widget" style={{ marginTop: 24, marginBottom: 8, padding: '12px 16px', background: 'rgba(255, 105, 180, 0.1)', border: '1px solid rgba(255, 105, 180, 0.3)', borderRadius: 16, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ background: 'rgba(255, 105, 180, 0.2)', padding: 8, borderRadius: '50%', color: '#ff69b4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Calendar size={20} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#ff69b4', marginBottom: 2 }}>
          {phaseNames[phaseData.phase]} фаза (День {phaseData.day})
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {modifiers.info}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightParam = searchParams.get('highlight');
  const [highlightCoords, setHighlightCoords] = React.useState(null);

  const profile = useUserStore(s => s.profile);
  const nutrition = useUserStore(s => s.nutrition);
  
  const { setPlan, replaceMeal, toggleCompleted } = usePlanStore(
    useShallow(s => ({ setPlan: s.setPlan, replaceMeal: s.replaceMeal, toggleCompleted: s.toggleCompleted }))
  );
  
  const plan = usePlanStore(s => s.plan);
  const completed = usePlanStore(s => s.completed);

  const [isPending, startTransition] = useTransition();
  const [summaryPeriod, setSummaryPeriod] = React.useState('day');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const dashboardRef = React.useRef(null);

  // --- Новые состояния для выбора замены ---
  const [activeSwapSlot, setActiveSwapSlot] = React.useState(null); // { dayIndex, mealType }
  const [showSwapChoice, setShowSwapChoice] = React.useState(false);
  const [showPicker, setShowPicker] = React.useState(false);
  const [pickerPool, setPickerPool] = React.useState([]);
  const [sortBy, setSortBy] = React.useState('name'); // 'name', 'calories'
  const [sortOrder, setSortOrder] = React.useState('asc'); // 'asc', 'desc'
  const [activeDropdown, setActiveDropdown] = React.useState(null); // 'sort' or null

  const today = new Date().getDay();
  const todayIdx = (today + 6) % 7;
  const [selectedDayIndex, setSelectedDayIndex] = React.useState(todayIdx);

  // Обработка подсветки добавленного блюда
  React.useEffect(() => {
    if (highlightParam) {
      const [d, t] = highlightParam.split(':');
      if (d !== undefined && t !== undefined) {
        setHighlightCoords({ day: parseInt(d, 10), type: t });

        // Плавный скролл к новому блюду
        setTimeout(() => {
          const el = document.getElementById(`meal-${d}-${t}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);

        // Удаляем параметр из URL сразу, чтобы не мозолил глаза, но сохраняем состояние в стейте
        const timer = setTimeout(() => {
          setHighlightCoords(null);
          setSearchParams({}, { replace: true });
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightParam, setSearchParams]);

  const handleSwapMeal = (dayIndex, mealType) => {
    setActiveSwapSlot({ dayIndex, mealType });
    setShowSwapChoice(true);
  };

  const handleAutoSwap = () => {
    if (!activeSwapSlot || !plan) return;
    const { dayIndex, mealType } = activeSwapSlot;

    const currentMealId = plan[dayIndex].meals[mealType]?.id;
    const selectedSoFar = plan.flatMap(day => day.meals[mealType] ? [day.meals[mealType]] : []);

    const newMeal = generateSingleMeal(recipes, profile, nutrition, mealType, selectedSoFar, currentMealId);
    if (newMeal) {
      replaceMeal(dayIndex, mealType, newMeal);
    }
    setShowSwapChoice(false);
    setActiveSwapSlot(null);
  };

  const handleOpenPicker = () => {
    if (!activeSwapSlot) return;
    const { mealType } = activeSwapSlot;
    const pool = getFilteredPoolForMeal(recipes, profile, nutrition, mealType);
    setPickerPool(pool);
    setShowSwapChoice(false);
    setShowPicker(true);
  };

  const handleBackToChoice = () => {
    setShowPicker(false);
    setShowSwapChoice(true);
  };

  // Мемоизированная сортировка пула
  const sortedPool = React.useMemo(() => {
    if (!pickerPool) return [];
    return [...pickerPool].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'calories') {
        comparison = a.calories - b.calories;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [pickerPool, sortBy, sortOrder]);

  const handleSortToggle = (type) => {
    if (sortBy === type) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
    setActiveDropdown(null);
  };

  const handleSelectFromPicker = (newMeal) => {
    if (!activeSwapSlot) return;
    const { dayIndex, mealType } = activeSwapSlot;
    replaceMeal(dayIndex, mealType, newMeal);
    setShowPicker(false);
    setActiveSwapSlot(null);
  };

  const getPeriodString = () => {
    const today = new Date().getDay();
    const todayIndex = (today + 6) % 7;
    const start = new Date();
    start.setDate(start.getDate() - todayIndex);
    const end = new Date();
    end.setDate(end.getDate() + (6 - todayIndex));

    const fmt = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${fmt(start)}-${fmt(end)}`;
  };

  const handleDownloadMenu = () => {
    const period = getPeriodString();
    const text = plan.map((day, idx) => {
      let dailyTotal = 0;

      const today = new Date().getDay();
      const todayIdx = (today + 6) % 7;
      const date = new Date();
      date.setDate(date.getDate() - todayIdx + idx);
      const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

      let dayText = `=== ${day.dayLabel.toUpperCase()} - ${dateStr} ===\n`;

      Object.entries(day.meals).forEach(([type, m]) => {
        if (m) {
          dailyTotal += m.calories;
          const timeRange = MEAL_TIMES[type] ? ` (${MEAL_TIMES[type]})` : '';
          dayText += `${MEAL_LABELS[type] || type.toUpperCase()}${timeRange}: ${m.name} (${fmtNum(m.calories)} ккал)\n`;
        }
      });



      dayText += `--------------------------------\n`;
      dayText += `ИТОГО ЗА ДЕНЬ: ${fmtNum(dailyTotal)} ккал\n`;
      return dayText + '\n';
    }).join('\n');

    const blob = new Blob([`МОЙ РАЦИОН НА НЕДЕЛЮ (${period})\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-menu_${period}.txt`;
    a.click();
  };

  const handleExportPDF = async () => {
    if (!plan) return;
    setIsExporting(true);
    const period = getPeriodString();

    try {
      const element = document.getElementById('pdf-export-template');
      if (!element) throw new Error('Export template not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1000,
        onclone: (clonedDoc) => {
          clonedDoc.body.setAttribute('data-print-mode', 'true');
          const dash = clonedDoc.querySelector('.pdf-export-template');
          if (dash) dash.style.display = 'block';
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      const width = imgProps.width * ratio;
      const height = imgProps.height * ratio;
      const x = (pdfWidth - width) / 2;

      pdf.addImage(imgData, 'PNG', x, 5, width, height);
      pdf.save(`weekly-menu_${period}.pdf`);
    } catch (err) {
      console.error('PDF Export Error:', err);
      alert('Ошибка при создании PDF.');
    } finally {
      setIsExporting(false);
    }
  };


  const mealOrder = useMemo(() => {
    if (!plan || plan.length === 0) return [];
    const keys = Object.keys(plan[0].meals);
    return DEFAULT_ORDER.filter(k => keys.includes(k));
  }, [plan]);

  const handleRegenerate = () => {
    startTransition(async () => {
      // Yield to paint isPending
      await new Promise(r => setTimeout(r, 0));
      const newPlan = generatePlan(recipes, profile, nutrition);
      setPlan(newPlan);
    });
  };

  if (!plan && !isPending) {
    return (
      <div className="dashboard" ref={dashboardRef}>
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
    <div className="dashboard" ref={dashboardRef}>
      <div className="dashboard__header">
        <div>
          <h1 className="dashboard__title">Рацион на неделю</h1>
          <p className="dashboard__subtitle">
            Персонализировано для {profile?.name} · {nutrition?.targetCalories} ккал/день
          </p>
        </div>
        <div className="dashboard__actions" style={{ display: 'flex', gap: 12 }}>
          <div className="download-dropdown">
            <button
              className={`btn-secondary ${isMenuOpen ? 'btn-secondary--active' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={!plan || isExporting}
              style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}
            >
              <Download size={14} /> Скачать <ChevronDown size={12} style={{ transition: '0.2s', transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  className="download-dropdown__menu download-dropdown__menu--right"
                  {...dropdownDown}
                >
                  <button className="download-dropdown__item" onClick={() => { handleExportPDF(); setIsMenuOpen(false); }}>
                    <div className="download-dropdown__item-icon" style={{ color: '#ff4d4d' }}><FileText size={16} /></div>
                    <div className="download-dropdown__item-content">
                      <div className="download-dropdown__item-label">Рацион в PDF</div>
                    </div>
                  </button>
                  <button className="download-dropdown__item" onClick={() => { handleDownloadMenu(); setIsMenuOpen(false); }}>
                    <div className="download-dropdown__item-icon" style={{ color: '#4dabf7' }}><FileText size={16} /></div>
                    <div className="download-dropdown__item-content">
                      <div className="download-dropdown__item-label">Рацион в TXT</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <CycleWidget profile={profile} />

      {/* Summary Period Tabs */}
      <div className="period-selector">
        <button
          className={`period-btn ${summaryPeriod === 'day' ? 'period-btn--active' : ''}`}
          onClick={() => setSummaryPeriod('day')}
        >
          {summaryPeriod === 'day' && <motion.div layoutId="period-pill" className="period-btn__bg" />}
          <span className="period-btn__text">День</span>
        </button>
        <button
          className={`period-btn ${summaryPeriod === 'week' ? 'period-btn--active' : ''}`}
          onClick={() => setSummaryPeriod('week')}
        >
          {summaryPeriod === 'week' && <motion.div layoutId="period-pill" className="period-btn__bg" />}
          <span className="period-btn__text">Неделя</span>
        </button>
      </div>

      <TodaySummary
        plan={displayPlan}
        nutrition={nutrition}
        selectedIndex={selectedDayIndex}
        isLoading={isPending}
        completed={completed}
        period={summaryPeriod}
      />

      <motion.div
        className="week-grid"
        {...slideUp}
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
            isLoading={isPending}
            onSwap={handleSwapMeal}
            completed={completed}
            onToggle={toggleCompleted}
            targetCalories={nutrition?.targetCalories}
            highlightCoords={highlightCoords}
          />
        ))}
      </motion.div>

      {/* Hidden PDF Template */}
      {/* ... (existing pdf template) ... */}

      {/* ── Choice Modal ── */}
      <AnimatePresence>
        {showSwapChoice && (
          <motion.div
            className="swap-dialog-overlay"
            {...modalBackdrop}
            onClick={() => setShowSwapChoice(false)}
          >
            <motion.div
              className="swap-dialog"
              {...modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="swap-dialog__header">
                <button className="swap-dialog__close" onClick={() => setShowSwapChoice(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="swap-dialog__body">
                <h3 className="swap-dialog__title">Замена блюда</h3>
                <p className="swap-dialog__sub">Как вы хотите заменить этот прием пищи?</p>

                <div className="swap-options">
                  <button className="swap-option swap-option--auto" onClick={handleAutoSwap}>
                    <div className="swap-option__icon"><Zap size={24} /></div>
                    <span className="swap-option__label">Автоматически</span>
                  </button>
                  <button className="swap-option swap-option--manual" onClick={handleOpenPicker}>
                    <div className="swap-option__icon"><Layout size={24} /></div>
                    <span className="swap-option__label">Выбрать из списка</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Recipe Picker Modal ── */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            className="picker-overlay"
            {...modalBackdrop}
          >
            <motion.div
              className="picker"
              {...modalContent}
            >
              <div className="picker__header">
                <div className="picker__header-left">
                  <button className="picker__back" onClick={handleBackToChoice} title="Назад">
                    <ArrowLeft size={20} />
                  </button>
                  <h3 className="picker__title">Выберите новое блюдо</h3>
                </div>

                <div className="picker__header-right">
                  <div className="dropdown">
                      <button 
                        className={`dropdown__trigger ${sortBy !== 'name' || sortOrder !== 'asc' ? 'dropdown__trigger--active' : ''}`}
                        onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                      >
                        <div className="dropdown__trigger-content">
                          <span>{sortBy === 'name' ? 'По алфавиту' : 'По калориям'}</span>
                          <span className="sort-indicator">
                            {sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          </span>
                        </div>
                        <ChevronDown size={14} className={`dropdown__arrow ${activeDropdown === 'sort' ? 'dropdown__arrow--open' : ''}`} />
                      </button>
                      
                      <AnimatePresence>
                        {activeDropdown === 'sort' && (
                          <motion.div 
                            {...dropdownDown}
                            className="dropdown__menu"
                          >
                            <button 
                              className={`dropdown__item ${sortBy === 'name' ? 'dropdown__item--active' : ''}`}
                              onClick={() => handleSortToggle('name')}
                            >
                              <span>По алфавиту</span>
                              {sortBy === 'name' && (
                                <span className="item-sort-arrow">
                                  {sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                </span>
                              )}
                            </button>
                            <button 
                              className={`dropdown__item ${sortBy === 'calories' ? 'dropdown__item--active' : ''}`}
                              onClick={() => handleSortToggle('calories')}
                            >
                              <span>По калориям</span>
                              {sortBy === 'calories' && (
                                <span className="item-sort-arrow">
                                  {sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                                </span>
                              )}
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                  </div>

                  <button className="picker__close" onClick={() => setShowPicker(false)}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="picker__content">
                <div className="picker-grid">
                  {sortedPool.length > 0 ? (
                    sortedPool.map((recipe) => (
                      <motion.div
                        key={recipe.id}
                        className="picker-card"
                        {...cardHover}
                        {...tapScale}
                        onClick={() => handleSelectFromPicker(recipe)}
                      >
                        <div className="picker-card__icon">{recipe.imageEmoji}</div>
                        <div className="picker-card__name">{recipe.name}</div>
                        <div className="picker-card__macros">
                          <span>Б: {recipe.protein}г</span>
                          <span>Ж: {recipe.fat}г</span>
                          <span>У: {recipe.carbs}г</span>
                        </div>
                        <div className="picker-card__cal">{recipe.calories} ккал</div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="picker-empty">
                      Подходящих рецептов не найдено. Попробуйте изменить настройки профиля.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
