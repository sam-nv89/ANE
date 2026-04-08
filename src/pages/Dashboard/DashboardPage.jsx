import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, RefreshCw, Play, Zap, Calendar, ChevronLeft, ChevronRight, FileText, Layout, ChevronDown, Download } from 'lucide-react';

import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import { generatePlan, generateSingleMeal } from '../../lib/planner/generator';
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
  snack:     '11:00 – 11:30',
  lunch:     '13:00 – 14:00',
  snack2:    '15:30 – 16:00',
  snack3:    '17:00 – 17:30',
  dinner:    '19:00 – 20:00',
  snack4:    '21:00 – 21:30',
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
function MealCard({ meal, mealType, dayIndex, navigate, isLoading, onSwap, isCompleted, onToggle }) {
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
      className={`meal-card ${isCompleted ? 'meal-card--completed' : ''}`}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
    >
      <button 
        className="meal-card__done-btn"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(dayIndex, mealType);
        }}
        title={isCompleted ? "Сбросить отметку" : "Отметить как съеденное"}
      >
        <div className={`check-circle ${isCompleted ? 'check-circle--active' : ''}`}>
          {isCompleted && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>✓</motion.div>}
        </div>
      </button>

      <button 
        className="meal-card__main-btn"
        onClick={() => navigate(`/app/meal/${meal.id}`, { state: { multiplier: meal.multiplier, calories: meal.calories } })}
      >
        <div className="meal-card__type">{MEAL_LABELS[mealType]}</div>
        <span className="meal-card__emoji">{meal.imageEmoji}</span>
        <div className="meal-card__name">{meal.name}</div>
        <div className="meal-card__meta">
          <div className="meal-card__cal-row">
            <span className="meal-card__cal">{fmtNum(meal.calories)} ккал</span>
            {meal.targetCal && (
              <span className={`meal-card__precision ${Math.abs(meal.calories - meal.targetCal) <= 5 ? 'meal-card__precision--perfect' : ''}`}>
                {meal.calories - meal.targetCal === 0 ? '✓' : (meal.calories - meal.targetCal > 0 ? `+${fmtNum(meal.calories - meal.targetCal)}` : `${fmtNum(meal.calories - meal.targetCal)}`)}
              </span>
            )}
          </div>
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
function DayColumn({ day, navigate, isSelected, onSelect, order, isLoading, onSwap, completed, onToggle, onAddCustom, onRemoveCustom }) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [customName, setCustomName] = React.useState('');
  const [customCal, setCustomCal] = React.useState('');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!customName || !customCal) return;
    onAddCustom(day.dayIndex, { name: customName, calories: parseInt(customCal, 10) });
    setCustomName('');
    setCustomCal('');
    setIsAdding(false);
  };
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
          isCompleted={completed.includes(`${day.dayIndex}:${mealType}`)}
          onToggle={onToggle}
        />
      ))}

      {/* Custom Meals List */}
      {day.customMeals?.map(m => (
        <div key={m.id} className="meal-card meal-card--custom">
          <button className="meal-card__remove-btn" onClick={() => onRemoveCustom(day.dayIndex, m.id)}>×</button>
          <div className="meal-card__type">Свой продукт</div>
          <div className="meal-card__name">{m.name}</div>
          <div className="meal-card__meta">
            <span className="meal-card__cal">{fmtNum(m.calories)} ккал</span>
          </div>
        </div>
      ))}

      {/* Add Custom Meal Form */}
      {isAdding ? (
        <motion.form 
          className="custom-meal-form"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleAdd}
        >
          <input 
            autoFocus
            type="text" 
            placeholder="Название..." 
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            className="custom-meal-form__input"
          />
          <div className="custom-meal-form__row">
            <input 
              type="number" 
              placeholder="Ккал" 
              value={customCal}
              onChange={e => setCustomCal(e.target.value)}
              className="custom-meal-form__input custom-meal-form__input--small"
            />
            <button type="submit" className="custom-meal-form__btn custom-meal-form__btn--add">OK</button>
            <button type="button" onClick={() => setIsAdding(false)} className="custom-meal-form__btn">×</button>
          </div>
        </motion.form>
      ) : (
        <button 
          className="add-custom-btn"
          onClick={() => setIsAdding(true)}
        >
          + Свой продукт
        </button>
      )}
    </div>
  );
}

/* ── Today's nutrition summary ── */
function TodaySummary({ plan, nutrition, selectedIndex, isLoading, completed }) {
  const selectedPlan = plan?.[selectedIndex];

  const totals = useMemo(() => {
    if (!selectedPlan || isLoading) return null;
    const entries = Object.entries(selectedPlan.meals);
    
    // Считаем два набора данных: плановые (всё) и фактические (отмеченные)
    const planSum = entries.reduce(
      (acc, [, m]) => {
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

    // Добавляем customMeals к факту
    const factSum = entries.reduce(
      (acc, [type, m]) => {
        if (!m || !completed.includes(`${selectedIndex}:${type}`)) return acc;
        return {
          calories: acc.calories + m.calories,
          protein:  acc.protein  + m.protein,
          fat:      acc.fat      + m.fat,
          carbs:    acc.carbs    + m.carbs,
        };
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    if (selectedPlan.customMeals && selectedPlan.customMeals.length > 0) {
      selectedPlan.customMeals.forEach(m => {
        factSum.calories += m.calories || 0;
        factSum.protein  += m.protein  || 0;
        factSum.fat      += m.fat      || 0;
        factSum.carbs    += m.carbs    || 0;
      });
    }

    return { plan: planSum, fact: factSum };
  }, [selectedPlan, isLoading, completed, selectedIndex]);

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

  const progress = Math.min((totals.fact.calories / nutrition.targetCalories) * 100, 100);

  return (
    <div className="day-summary">
      <div className="day-summary__info">
        <div className="day-summary__label-row">
          <span className="day-summary__day-name">{fullDate}</span>
          <span className="day-summary__status">Выполнено: {Math.round((totals.fact.calories / nutrition.targetCalories) * 100)}%</span>
        </div>
        <div className="day-summary__row">
          <div className="day-summary__group">
            <span className="day-summary__sublabel">Съедено</span>
            <span className="day-summary__val day-summary__val--current">{fmtNum(totals.fact.calories)}</span>
          </div>
          <div className="day-summary__divider">/</div>
          <div className="day-summary__group">
            <span className="day-summary__sublabel">Цель дня</span>
            <span className="day-summary__val day-summary__val--target">{fmtNum(nutrition.targetCalories)} <small>ккал</small></span>
          </div>
        </div>
        <div className="day-summary__progress-bg">
          <motion.div 
            className="day-summary__progress-fg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            key={`progress-${selectedIndex}`}
          />
        </div>
        <div className="day-summary__plan-info">
          План на день: {fmtNum(totals.plan.calories)} ккал
        </div>
      </div>
      <div className="macro-rings">
        <MacroRing key={`p-${selectedIndex}`} label="Белки"    value={totals.fact.protein} max={nutrition.protein} color="#00d4ff" />
        <MacroRing key={`f-${selectedIndex}`} label="Жиры"     value={totals.fact.fat}     max={nutrition.fat}     color="#f59e0b" />
        <MacroRing key={`c-${selectedIndex}`} label="Углеводы" value={totals.fact.carbs}   max={nutrition.carbs}   color="#a78bfa" />
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { profile, nutrition } = useUserStore();
  const { plan, setPlan, isLoading, setLoading, replaceMeal, completed, toggleCompleted, addCustomMeal, removeCustomMeal } = usePlanStore();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const dashboardRef = React.useRef(null);

  const handleSwapMeal = (dayIndex, mealType) => {
    const dayMeals = plan[dayIndex].meals;
    const currentMealId = dayMeals[mealType]?.id;
    const newMeal = generateSingleMeal(recipes, mealType, dayMeals, nutrition, currentMealId);
    if (newMeal) {
      replaceMeal(dayIndex, mealType, newMeal);
    }
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

      if (day.customMeals && day.customMeals.length > 0) {
        dayText += `ДОПОЛНИТЕЛЬНО:\n`;
        day.customMeals.forEach(m => {
          dailyTotal += m.calories;
          dayText += `- ${m.name} (${fmtNum(m.calories)} ккал)\n`;
        });
      }
      
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
                  className="download-dropdown__menu"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
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

      <TodaySummary plan={displayPlan} nutrition={nutrition} selectedIndex={selectedDayIndex} isLoading={isLoading} completed={completed} />

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
            completed={completed}
            onToggle={toggleCompleted}
            onAddCustom={addCustomMeal}
            onRemoveCustom={removeCustomMeal}
          />
        ))}
      </motion.div>

      {/* Hidden PDF Template */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
        <div id="pdf-export-template" className="pdf-export-template">
          <div className="pdf-export-template__branding">
            <div className="pdf-export-template__accent-bar" />
            <h1 className="pdf-export-template__main-title">ЕЖЕНЕДЕЛЬНЫЙ ПЛАН ПИТАНИЯ</h1>
          </div>

          <div className="pdf-export-template__info-panel">
            <div className="pdf-export-template__info-group">
              <span className="pdf-export-template__info-label">ПОЛЬЗОВАТЕЛЬ</span>
              <span className="pdf-export-template__info-value">{profile?.name || 'Участник'}</span>
            </div>
            <div className="pdf-export-template__info-group">
              <span className="pdf-export-template__info-label">ПЕРИОД</span>
              <span className="pdf-export-template__info-value">{getPeriodString()}</span>
            </div>
            <div className="pdf-export-template__info-group">
              <span className="pdf-export-template__info-label">ЦЕЛЕВАЯ НОРМА (ДЕНЬ)</span>
              <span className="pdf-export-template__info-value">{fmtNum(nutrition?.targetCalories)} ккал/день</span>
            </div>
            <div className="pdf-export-template__info-group">
              <span className="pdf-export-template__info-label">ЦЕЛЕВАЯ НОРМА (НЕДЕЛЯ)</span>
              <span className="pdf-export-template__info-value">{fmtNum(nutrition?.targetCalories * 7)} ккал/нед</span>
            </div>
          </div>

          <div className="pdf-export-template__grid">
            <div className="pdf-export-template__col">
              {displayPlan.slice(0, 4).map((day, dIdx) => {
                const totalCals = Object.values(day.meals).reduce((acc, m) => acc + (m?.calories || 0), 0) + 
                                  (day.customMeals ? day.customMeals.reduce((acc, m) => acc + (m?.calories || 0), 0) : 0);
                const date = new Date();
                const tOff = (new Date().getDay() + 6) % 7;
                date.setDate(date.getDate() - tOff + dIdx);
                const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

                return (
                  <div key={day.dayIndex} className="pdf-day-card">
                    <div className="pdf-day-card__header">
                      <div className="pdf-day-card__title">
                        <span className="pdf-day-card__label">{day.dayLabel}</span>
                        <span className="pdf-day-card__date">{dateStr}</span>
                      </div>
                      <div className="pdf-day-card__total">{fmtNum(totalCals)} ккал</div>
                    </div>
                    <div className="pdf-day-card__meals">
                      {displayOrder.map(type => {
                        const m = day.meals[type];
                        if (!m) return null;
                        return (
                          <div key={type} className="pdf-meal-item">
                            <div className="pdf-meal-item__meta">
                              <span className="pdf-meal-item__time">{MEAL_TIMES[type]?.split(' – ')[0]}</span>
                              <span className="pdf-meal-item__type">{MEAL_LABELS[type]}</span>
                            </div>
                            <div className="pdf-meal-item__content">
                              <span className="pdf-meal-item__name">{m.name}</span>
                              <span className="pdf-meal-item__cals">{fmtNum(m.calories)} ккал</span>
                            </div>
                          </div>
                        );
                      })}
                      {day.customMeals?.map(m => (
                        <div key={m.id} className="pdf-meal-item">
                          <div className="pdf-meal-item__meta"><span className="pdf-meal-item__time">—</span><span className="pdf-meal-item__type">ДОП.</span></div>
                          <div className="pdf-meal-item__content">
                            <span className="pdf-meal-item__name">{m.name}</span>
                            <span className="pdf-meal-item__cals">{fmtNum(m.calories)} ккал</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="pdf-export-template__col">
              {displayPlan.slice(4).map((day, dIdx) => {
                const dayActualIdx = dIdx + 4;
                const totalCals = Object.values(day.meals).reduce((acc, m) => acc + (m?.calories || 0), 0) + 
                                  (day.customMeals ? day.customMeals.reduce((acc, m) => acc + (m?.calories || 0), 0) : 0);
                const date = new Date();
                const tOff = (new Date().getDay() + 6) % 7;
                date.setDate(date.getDate() - tOff + dayActualIdx);
                const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });

                return (
                  <div key={day.dayIndex} className="pdf-day-card">
                    <div className="pdf-day-card__header">
                      <div className="pdf-day-card__title">
                        <span className="pdf-day-card__label">{day.dayLabel}</span>
                        <span className="pdf-day-card__date">{dateStr}</span>
                      </div>
                      <div className="pdf-day-card__total">{fmtNum(totalCals)} ккал</div>
                    </div>
                    <div className="pdf-day-card__meals">
                      {displayOrder.map(type => {
                        const m = day.meals[type];
                        if (!m) return null;
                        return (
                          <div key={type} className="pdf-meal-item">
                            <div className="pdf-meal-item__meta">
                              <span className="pdf-meal-item__time">{MEAL_TIMES[type]?.split(' – ')[0]}</span>
                              <span className="pdf-meal-item__type">{MEAL_LABELS[type]}</span>
                            </div>
                            <div className="pdf-meal-item__content">
                              <span className="pdf-meal-item__name">{m.name}</span>
                              <span className="pdf-meal-item__cals">{fmtNum(m.calories)} ккал</span>
                            </div>
                          </div>
                        );
                      })}
                      {day.customMeals?.map(m => (
                        <div key={m.id} className="pdf-meal-item">
                          <div className="pdf-meal-item__meta"><span className="pdf-meal-item__time">—</span><span className="pdf-meal-item__type">ДОП.</span></div>
                          <div className="pdf-meal-item__content">
                            <span className="pdf-meal-item__name">{m.name}</span>
                            <span className="pdf-meal-item__cals">{fmtNum(m.calories)} ккал</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
