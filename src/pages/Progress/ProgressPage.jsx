import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Plus, Target } from 'lucide-react';

import { useProgressStore } from '../../store/useProgressStore';
import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';

import './ProgressPage.css';

/* ── Simple SVG line chart ── */
function WeightChart({ entries, targetWeight }) {
  if (entries.length < 2) return null;

  const W = 600; const H = 160; const PAD = 20;
  const weights = entries.map((e) => e.weightKg);
  const minW = Math.min(...weights, targetWeight ?? Infinity) - 2;
  const maxW = Math.max(...weights) + 2;

  const toX = (i) => PAD + (i / (entries.length - 1)) * (W - PAD * 2);
  const toY = (w) => H - PAD - ((w - minW) / (maxW - minW)) * (H - PAD * 2);

  const pathD = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(e.weightKg).toFixed(1)}`).join(' ');

  return (
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
      {/* Points */}
      {entries.map((e, i) => (
        <circle key={i} cx={toX(i)} cy={toY(e.weightKg)} r={4} fill="var(--clr-accent-1)" />
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
  const { weightLog, logWeight, dailyCompliance } = useProgressStore();
  const { profile, nutrition } = useUserStore();
  const { plan, completed } = usePlanStore();

  const [weightInput, setWeightInput] = useState('');

  const handleLogWeight = () => {
    const val = parseFloat(weightInput);
    if (!isNaN(val) && val > 30 && val < 300) {
      logWeight(val);
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

  // Streak
  const streak = useMemo(() => {
    let s = 0;
    const sorted = Object.entries(dailyCompliance).sort(([a], [b]) => b.localeCompare(a));
    for (const [, v] of sorted) {
      if (v.planned > 0 && v.done / v.planned >= 0.5) s++;
      else break;
    }
    return s;
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
            placeholder={`Текущий вес (кг)`}
            value={weightInput}
            onChange={(e) => setWeightInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogWeight()}
            min={30} max={300} step={0.1}
            style={{ maxWidth: 200 }}
            aria-label="Ввод текущего веса"
          />
          <button className="btn-primary" onClick={handleLogWeight} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '10px 16px' }}>
            <Plus size={14} /> Записать
          </button>
        </div>

        {/* Chart */}
        {weightLog.length >= 2 ? (
          <div className="weight-chart">
            <WeightChart entries={weightLog} targetWeight={profile?.goal !== 'maintain' ? undefined : profile?.weightKg} />
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

        {/* Last entry */}
        {weightLog.length > 0 && (
          <div className="weight-last">
            <span className="weight-last__label">Последний замер</span>
            <span className="weight-last__value gradient-text">
              {weightLog[weightLog.length - 1].weightKg} кг
            </span>
            <span className="weight-last__date">{weightLog[weightLog.length - 1].date}</span>
            {nutrition && (
              <span className="weight-last__target">
                <Target size={12} /> Цель: {nutrition.targetCalories} ккал/день
              </span>
            )}
          </div>
        )}
      </div>

      {/* Compliance */}
      <div className="progress__card">
        <div className="progress__card-header">
          <span>📊</span>
          <span>Compliance — выполнение рациона</span>
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
