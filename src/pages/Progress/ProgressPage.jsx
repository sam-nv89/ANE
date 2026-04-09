import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Target } from 'lucide-react';

import { useProgressStore } from '../../store/useProgressStore';
import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';

import './ProgressPage.css';

/* ── Simple SVG line chart ── */
function WeightChart({ entries, targetWeight }) {
  const [hoveredEntry, setHoveredEntry] = useState(null);

  if (entries.length < 2) return null;

  const W = 600; const H = 160; const PAD = 20;
  const weights = entries.map((e) => e.weightKg);
  const minW = Math.min(...weights, targetWeight ?? Infinity) - 2;
  const maxW = Math.max(...weights) + 2;

  const toX = (i) => PAD + (i / (entries.length - 1)) * (W - PAD * 2);
  const toY = (w) => H - PAD - ((w - minW) / (maxW - minW)) * (H - PAD * 2);

  const pathD = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(e.weightKg).toFixed(1)}`).join(' ');

  const formatDate = (isoStr) => {
    const [y, m, d] = isoStr.split('-');
    return `${d}.${m}.${y}`;
  };

  return (
    <div className="weight-chart-container">
      <svg viewBox={`0 0 ${W} ${H}`} className="weight-chart__svg" aria-label="График веса">
        {/* Grid */}
        {[0.25, 0.5, 0.75].map((r) => (
          <line key={r} x1={PAD} y1={H * r} x2={W - PAD} y2={H * r} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
        ))}
        {/* Target weight line */}
        {targetWeight && (
          <line
            x1={PAD} y1={toY(targetWeight)} x2={W - PAD} y2={toY(targetWeight)}
            stroke="rgba(0,245,160,0.25)" strokeWidth={1.5} strokeDasharray="6,4"
          />
        )}
        {/* Area fill */}
        <path
          d={`${pathD} L${toX(entries.length - 1)},${H - PAD} L${toX(0)},${H - PAD} Z`}
          fill="url(#weight-grad)" opacity={0.2}
        />
        {/* Line */}
        <path d={pathD} fill="none" stroke="url(#weight-line-grad)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Points - Hoverable */}
        {entries.map((e, i) => (
          <g key={i} className="weight-point" onMouseMove={() => setHoveredEntry({ ...e, x: toX(i), y: toY(e.weightKg) })} onMouseLeave={() => setHoveredEntry(null)}>
            {/* Invisible larger hit area for touch/hover */}
            <circle cx={toX(i)} cy={toY(e.weightKg)} r={12} fill="transparent" style={{ cursor: 'pointer' }} />
            <motion.circle
              cx={toX(i)} cy={toY(e.weightKg)}
              r={hoveredEntry?.date === e.date ? 6 : 4}
              fill="var(--clr-accent-1)"
              animate={{ r: hoveredEntry?.date === e.date ? 6 : 4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            />
          </g>
        ))}

        <defs>
          <linearGradient id="weight-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--clr-accent-1)" />
            <stop offset="100%" stopColor="var(--clr-accent-1)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="weight-line-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--clr-accent-1)" />
            <stop offset="100%" stopColor="var(--clr-accent-2)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredEntry && (
          <motion.div
            className="weight-chart__tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              left: `${(hoveredEntry.x / W) * 100}%`,
              ...(hoveredEntry.y < 50 
                ? { top: `${(hoveredEntry.y / H) * 100 + 12}%` } 
                : { bottom: `${((H - hoveredEntry.y) / H) * 100 + 10}%` }
              )
            }}
          >
            <div className="tooltip-weight">{hoveredEntry.weightKg} кг</div>
            <div className="tooltip-date">{formatDate(hoveredEntry.date)}</div>
            {/* Arrow */}
            <div className={`tooltip-arrow ${hoveredEntry.y < 50 ? 'tooltip-arrow--top' : 'tooltip-arrow--bottom'}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Compliance bar ── */
function ComplianceBar({ rate }) {
  return (
    <div className="compliance-bar" aria-label={`Compliance ${rate}%`}>
      <div className="compliance-bar__fill" style={{ width: `${rate}%` }} />
    </div>
  );
}

export default function ProgressPage() {
  const { weightLog, logWeight, dailyCompliance, syncCompliance } = useProgressStore();
  const { profile, nutrition } = useUserStore();
  const { plan, completed, generatedAt } = usePlanStore();

  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));

  // Auto-sync compliance data whenever plan or completion status changes
  useEffect(() => {
    if (!plan || !generatedAt) return;

    const baseDate = new Date(generatedAt);
    const updates = {};

    plan.forEach((day, idx) => {
      // Calculate calendar date for this plan day
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + idx);
      const dateStr = d.toISOString().slice(0, 10);

      const planned = Object.values(day.meals || {}).filter(Boolean).length;
      // Filter completed keys for this dayIndex
      const done = completed.filter((k) => k.startsWith(`${idx}:`)).length;

      if (planned > 0) {
        updates[dateStr] = { planned, done };
      }
    });

    if (Object.keys(updates).length > 0) {
      syncCompliance(updates);
    }
  }, [plan, completed, generatedAt, syncCompliance]);

  const handleLogWeight = () => {
    const val = parseFloat(weightInput);
    if (!isNaN(val) && val > 30 && val < 300) {
      logWeight(val, dateInput);
      setWeightInput('');
    }
  };

  // Compliance for last 7 days
  const complianceData = useMemo(() => {
    const days = Object.entries(dailyCompliance)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7);
    return days;
  }, [dailyCompliance]);

  const avgCompliance = useMemo(() => {
    if (complianceData.length === 0) return 0;
    const rates = complianceData.map(([, v]) => (v.planned > 0 ? (v.done / v.planned) * 100 : 0));
    return Math.round(rates.reduce((a, b) => a + b, 0) / rates.length);
  }, [complianceData]);

  // Streak calculation: working backwards from the latest marked success
  const streak = useMemo(() => {
    // Get entries with at least 50% compliance, sorted latest first
    const successes = Object.entries(dailyCompliance)
      .filter(([, v]) => v.planned > 0 && v.done / v.planned >= 0.5)
      .sort(([a], [b]) => b.localeCompare(a));

    if (successes.length === 0) return 0;

    let count = 0;
    // Start checking from the most recent successful date
    let checkDate = new Date(successes[0][0]);

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      const entry = dailyCompliance[dateStr];

      if (entry && entry.planned > 0 && entry.done / entry.planned >= 0.5) {
        count++;
      } else {
        // Gap in dates or low compliance breaks the chain
        break;
      }

      // Move to previous day
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return count;
  }, [dailyCompliance]);

  return (
    <div className="progress">
      <h1 className="progress__title">Прогресс</h1>
      <p className="progress__subtitle">Данные о веса и выполнении рациона</p>

      {/* Weight logging */}
      <div className="progress__card">
        <div className="progress__card-header">
          <TrendingUp size={18} color="var(--clr-accent-1)" />
          <span>Динамика веса</span>
        </div>

        {/* Log input */}
        <div className="weight-input">
          <input
            type="number"
            className="field__input"
            placeholder={`Вес (кг)`}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogWeight()}
            min={30} max={300} step={0.1}
            style={{ maxWidth: 110 }}
            aria-label="Ввод текущего веса"
          />
          <input
            type="date"
            className="field__input"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            style={{ maxWidth: 160 }}
            aria-label="Выбор даты замера"
          />
          <button className="btn-primary" onClick={handleLogWeight} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '10px 16px' }}>
            <Plus size={14} /> Записать
          </button>
        </div>

        {/* Chart */}
        {weightLog.length >= 2 ? (
          <div className="weight-chart">
            <WeightChart entries={weightLog} targetWeight={profile?.targetWeightKg} />
            <div className="weight-chart__dates">
              <span>{weightLog[0]?.date}</span>
              <span>{weightLog[weightLog.length - 1]?.date}</span>
            </div>
          </div>
        ) : (
          <div className="progress__empty-chart">
            Добавьте хотя бы 2 замера для отображения графика
          </div>
        )}

        {/* Goal Progress Summary */}
        {weightLog.length > 0 && profile && (
          <div className="goal-summary">
            {profile.targetWeightKg && (
              <div className="goal-summary__progress-card">
                <div className="goal-summary__header">
                  <Target size={16} color="var(--clr-accent-2)" />
                  <span>Путь к цели ({profile.targetWeightKg} кг)</span>
                </div>
                
                {(() => {
                  const current = weightLog[weightLog.length - 1].weightKg;
                  const target = profile.targetWeightKg;
                  const initial = weightLog[0].weightKg;
                  const diff = Math.abs(current - target);
                  
                  // Progress % from start to target
                  const totalDiff = Math.abs(initial - target);
                  const currentDiff = Math.abs(initial - current);
                  const progress = totalDiff > 0 ? Math.min(Math.round((currentDiff / totalDiff) * 100), 100) : 0;
                  
                  const weeksLeft = profile.goalRate && Math.abs(profile.goalRate) > 0 
                    ? Math.ceil(diff / Math.abs(profile.goalRate)) 
                    : null;

                  return (
                    <div className="goal-stats">
                      <div className="goal-stats__main">
                        <div className="goal-stats__val">
                          {diff > 0 ? `${diff.toFixed(1)} кг` : 'Цель достигнута! 🎉'}
                        </div>
                        <div className="goal-stats__label">{diff > 0 ? 'Осталось до цели' : 'Поздравляем!'}</div>
                      </div>
                      
                      <div className="goal-stats__visual">
                        <div className="goal-stats__bar">
                          <motion.div 
                            className="goal-stats__fill" 
                            initial={{ width: 0 }} 
                            animate={{ width: `${progress}%` }} 
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </div>
                        <div className="goal-stats__markers">
                          <span>Старт: {initial}</span>
                          <span>{progress}%</span>
                          <span>Цель: {target}</span>
                        </div>
                      </div>

                      {weeksLeft && diff > 0 && (
                        <div className="goal-stats__forecast">
                          🗓 Прогноз: <strong>~{weeksLeft} нед.</strong> при текущем темпе
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* BMI Section */}
            <div className="goal-summary__bmi-card">
              {(() => {
                const weight = weightLog[weightLog.length - 1].weightKg;
                const height = profile.heightCm;
                const bmiNum = (weight / Math.pow(height / 100, 2)).toFixed(1);
                
                let bmiStatus = { label: 'Норма', color: 'var(--clr-accent-1)' };
                if (bmiNum < 18.5) bmiStatus = { label: 'Дефицит веса', color: '#60a5fa' };
                else if (bmiNum >= 25 && bmiNum < 30) bmiStatus = { label: 'Избыточный вес', color: '#f59e0b' };
                else if (bmiNum >= 30) bmiStatus = { label: 'Ожирение', color: '#ef4444' };

                return (
                  <>
                    <div className="bmi-val">
                      <span className="bmi-val__num" style={{ color: bmiStatus.color }}>{bmiNum}</span>
                      <span className="bmi-val__label">ИМТ</span>
                    </div>
                    <div className="bmi-status" style={{ backgroundColor: `${bmiStatus.color}15`, color: bmiStatus.color }}>
                      {bmiStatus.label}
                    </div>
                    <p className="bmi-note">Индекс массы тела на основе вашего роста ({height} см)</p>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Compliance */}
      <div className="progress__card">
        <div className="progress__card-header">
          <span>📊</span>
          <span>Выполнение рациона</span>
        </div>

        <div className="compliance-stats">
          <motion.div className="stat-box" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="stat-box__value gradient-text">{avgCompliance}%</div>
            <div className="stat-box__label">Средний %</div>
          </motion.div>
          <motion.div className="stat-box" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="stat-box__value gradient-text">{streak}</div>
            <div className="stat-box__label">Дней подряд 🔥</div>
          </motion.div>
          <motion.div className="stat-box" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="stat-box__value gradient-text">{completed.length}</div>
            <div className="stat-box__label">Приёмов отмечено</div>
          </motion.div>
        </div>

        {complianceData.length > 0 ? (
          <div className="compliance-list">
            {complianceData.map(([date, { planned, done }]) => {
              const rate = planned > 0 ? Math.round((done / planned) * 100) : 0;
              return (
                <div key={date} className="compliance-row">
                  <span className="compliance-row__date">{date}</span>
                  <ComplianceBar rate={rate} />
                  <span className="compliance-row__pct">{rate}%</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="progress__empty-chart">
            Данные о выполнении появятся после первого дня с рационом
          </div>
        )}
      </div>
    </div>
  );
}
