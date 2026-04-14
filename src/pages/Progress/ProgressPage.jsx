import React, { useState, useMemo, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Target, Info, Zap } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  BarChart,
  Bar,
  Legend
} from 'recharts';

import { useProgressStore } from '../../store/useProgressStore';
import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import CustomDatePicker from '../../components/Common/CustomDatePicker';

import './ProgressPage.css';

/* ── Custom Tooltip for Recharts ── */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const formatDate = (isoStr) => {
      const [y, m, d] = isoStr.split('-');
      return `${d}.${m}.${y}`;
    };

    return (
      <div className="weight-chart__tooltip-recharts">
        <div className="tooltip-weight">{data.weightKg} кг</div>
        <div className="tooltip-date">{formatDate(data.date)}</div>
      </div>
    );
  }
  return null;
};

/* ── Modern Recharts Area Chart ── */
function WeightChart({ entries, targetWeight }) {
  if (entries.length < 2) return null;

  // Calculate domain with padding
  const weights = entries.map((e) => e.weightKg);
  const minW = Math.min(...weights, targetWeight ?? Infinity) - 2;
  const maxW = Math.max(...weights) + 2;

  return (
    <div className="weight-chart-container" style={{ width: '100%', height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={entries}
          margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="weightAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--clr-accent-1)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--clr-accent-1)" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="weightLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--clr-accent-1)" />
              <stop offset="100%" stopColor="var(--clr-accent-2)" />
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(255,255,255,0.05)" 
          />
          
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => {
              const [y, m, d] = val.split('-');
              return `${d}.${m}.${y.slice(-2)}`;
            }}
            tick={{ fill: 'var(--clr-text-muted)', fontSize: 11, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            minTickGap={40}
            dy={12}
            padding={{ left: 30, right: 30 }}
          />
          
          <YAxis 
            domain={[Math.floor(minW), Math.ceil(maxW)]}
            orientation="left"
            tick={{ fill: 'var(--clr-text-muted)', fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            tickCount={5}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
          />

          {targetWeight && (
            <ReferenceLine 
              y={targetWeight} 
              stroke="rgba(0,245,160,0.4)" 
              strokeDasharray="6 4"
              label={{ 
                position: 'right', 
                value: 'Цель', 
                fill: 'var(--clr-accent-1)', 
                fontSize: 10,
                fontWeight: 700,
                opacity: 0.6
              }} 
            />
          )}

          <Area
            type="monotone"
            dataKey="weightKg"
            stroke="url(#weightLineGrad)"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#weightAreaGrad)"
            animationDuration={1500}
            activeDot={{ 
              r: 6, 
              fill: 'var(--clr-accent-1)', 
              stroke: 'white', 
              strokeWidth: 2,
              boxShadow: '0 0 15px var(--clr-accent-1)'
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ── PFC Analytics Chart ── */
function PFCChart({ data, nutrition }) {
  if (data.length === 0) return null;

  return (
    <div className="pfc-chart-container" style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: -20, bottom: 0 }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            vertical={false} 
            stroke="rgba(255,255,255,0.05)" 
          />
          <XAxis 
            dataKey="date" 
            tickFormatter={(val) => {
              const [y, m, d] = val.split('-');
              return `${d}.${m}`;
            }}
            tick={{ fill: 'var(--clr-text-muted)', fontSize: 10, fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis 
            tick={{ fill: 'var(--clr-text-muted)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
            contentStyle={{ 
              backgroundColor: 'rgba(20, 25, 40, 0.95)', 
              borderRadius: '12px', 
              border: '1px solid var(--clr-border)',
              fontSize: '12px'
            }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: 15, fontSize: 11 }}
          />
          <Bar name="Белки" dataKey="p" stackId="a" fill="#00d4ff" radius={[0, 0, 0, 0]} />
          <Bar name="Жиры" dataKey="f" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
          <Bar name="Углеводы" dataKey="c" stackId="a" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          
          {nutrition?.targetCalories && (
            <ReferenceLine 
              y={nutrition.protein + nutrition.fat + nutrition.carbs} 
              stroke="rgba(255,255,255,0.2)" 
              strokeDasharray="3 3"
              label={{ position: 'top', value: 'Цель', fill: 'var(--clr-text-muted)', fontSize: 10 }}
            />
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComplianceBar({ rate }) {
  return (
    <div className="compliance-bar" aria-label={`Compliance ${rate}%`}>
      <div className="compliance-bar__fill" style={{ width: `${rate}%` }} />
    </div>
  );
}

export default function ProgressPage() {
  const { weightLog, logWeight, dailyCompliance, syncCompliance } = useProgressStore(
    useShallow(s => ({
      weightLog: s.weightLog,
      logWeight: s.logWeight,
      dailyCompliance: s.dailyCompliance,
      syncCompliance: s.syncCompliance
    }))
  );
  
  const profile = useUserStore(s => s.profile);
  const nutrition = useUserStore(s => s.nutrition);
  
  const { plan, completed, generatedAt } = usePlanStore(
    useShallow(s => ({
      plan: s.plan,
      completed: s.completed,
      generatedAt: s.generatedAt
    }))
  );

  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));

  // Weight Chart Filter Range
  const [filterStart, setFilterStart] = useState(() => {
    if (weightLog.length > 0) return weightLog[0].date;
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [filterEnd, setFilterEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const filteredWeightLog = useMemo(() => {
    return weightLog.filter(e => e.date >= filterStart && e.date <= filterEnd)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [weightLog, filterStart, filterEnd]);

  // PFC Analytics Calculation
  const dailyPFC = useMemo(() => {
    if (!plan || !generatedAt) return [];
    const baseDate = new Date(generatedAt);
    const result = [];
    
    // Iterate 7 days of the plan
    for (let i = 0; i < 7; i++) {
       const d = new Date(baseDate);
       d.setDate(baseDate.getDate() + i);
       const dateStr = d.toISOString().slice(0, 10);
       
       if (dateStr >= filterStart && dateStr <= filterEnd) {
         const day = plan[i];
         let p = 0, f = 0, c = 0;
         
         // Sum completed meals
         Object.entries(day.meals).forEach(([type, m]) => {
           if (m && completed.includes(`${i}:${type}`)) {
             p += m.protein || 0;
             f += m.fat || 0;
             c += m.carbs || 0;
           }
         });
         
         // Sum completed custom meals
         if (day.customMeals) {
           day.customMeals.forEach(m => {
             if (completed.includes(`${i}:${m.id}`)) {
               p += m.protein || 0;
               f += m.fat || 0;
               c += m.carbs || 0;
             }
           });
         }
         
         if (p + f + c > 0) {
           result.push({ date: dateStr, p, f, c });
         }
       }
    }
    return result;
  }, [plan, completed, generatedAt, filterStart, filterEnd]);

  useEffect(() => {
    if (!plan || !generatedAt) return;
    const baseDate = new Date(generatedAt);
    const updates = {};
    plan.forEach((day, idx) => {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + idx);
      const dateStr = d.toISOString().slice(0, 10);
      const planned = Object.values(day.meals || {}).filter(Boolean).length;
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

  const streak = useMemo(() => {
    const successes = Object.entries(dailyCompliance)
      .filter(([, v]) => v.planned > 0 && v.done / v.planned >= 0.5)
      .sort(([a], [b]) => b.localeCompare(a));
    if (successes.length === 0) return 0;
    let count = 0;
    let checkDate = new Date(successes[0][0]);
    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      const entry = dailyCompliance[dateStr];
      if (entry && entry.planned > 0 && entry.done / entry.planned >= 0.5) {
        count++;
      } else {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return count;
  }, [dailyCompliance]);

  return (
    <div className="progress">
      <h1 className="progress__title">Прогресс</h1>
      <p className="progress__subtitle">Данные о весе и выполнении рациона</p>

      <div className="progress__card">
        <div className="progress__card-header">
          <TrendingUp size={18} color="var(--clr-accent-1)" />
          <span>Динамика веса</span>
        </div>


        <div className="weight-input-group">
          <div className="weight-input-field">
            <input
              type="number"
              className="weight-input-field__input"
              placeholder="Вес (кг)"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogWeight()}
              min={30} max={300} step={0.1}
              aria-label="Ввод текущего веса"
            />
          </div>
          <div className="weight-input-date">
            <CustomDatePicker
              value={dateInput}
              onChange={setDateInput}
              maxDate={new Date().toISOString().slice(0, 10)}
            />
          </div>
          <button className="weight-input-btn" onClick={handleLogWeight}>
            <Plus size={18} /> <span>Записать</span>
          </button>
        </div>


        {filteredWeightLog.length >= 2 ? (
          <div className="weight-chart">
            <div className="weight-chart__header">
              <div className="weight-range-picker">
                <CustomDatePicker 
                  value={filterStart} 
                  onChange={setFilterStart} 
                  maxDate={filterEnd}
                />
                <span className="range-sep">—</span>
                <CustomDatePicker 
                  value={filterEnd} 
                  onChange={setFilterEnd} 
                  maxDate={new Date().toISOString().slice(0, 10)}
                />
              </div>
            </div>
            <WeightChart entries={filteredWeightLog} targetWeight={profile?.targetWeightKg} />
          </div>
        ) : (

          <div className="progress__empty-chart">
            Добавьте хотя бы 2 замера для отображения графика
          </div>
        )}

        <div className="progress__card-divider" />

        <div className="pfc-analytics">
          <div className="pfc-analytics__header">
            <Zap size={18} color="#00d4ff" />
            <span>Баланс БЖУ</span>
          </div>
          
          {dailyPFC.length > 0 ? (
            <PFCChart data={dailyPFC} nutrition={nutrition} />
          ) : (
            <div className="progress__empty-chart">
              Нет данных о выполненных приемах пищи за этот период
            </div>
          )}
        </div>

        {weightLog.length > 0 && profile && (

          <div className="goal-summary">
            {profile.targetWeightKg ? (
              <div className="goal-summary__progress-card">
                <div className="goal-summary__header">
                  <div className="goal-summary__header-title">
                    <Target size={14} /> <span>Путь к цели</span>
                  </div>
                </div>
                
                {(() => {
                  const current = weightLog[weightLog.length - 1].weightKg;
                  const target = profile.targetWeightKg;
                  const initial = weightLog[0].weightKg;
                  const diff = Math.abs(current - target);
                  
                  const totalDiff = Math.abs(initial - target);
                  const currentDiff = Math.abs(initial - current);
                  const progress = totalDiff > 0 ? Math.min(Math.round((currentDiff / totalDiff) * 100), 100) : 0;
                  
                  const weeksLeft = profile.goalRate && Math.abs(profile.goalRate) > 0 
                    ? Math.ceil(Math.abs(diff) / Math.abs(profile.goalRate)) 
                    : null;

                  return (
                    <div className="goal-stats">
                      <div className="goal-stats__main">
                        <div className="goal-stats__label">
                          {current === target ? 'Поздравляем! 🎉' : (current > target ? 'Осталось сбросить' : 'Осталось набрать')}
                        </div>
                        <div className="goal-stats__val">
                          {current === target ? (
                            <span className="goal-stats__number">Цель достигнута!</span>
                          ) : (
                            <>
                              <span className="goal-stats__number">{diff.toFixed(1)}</span>
                              <span className="goal-stats__unit"> кг</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="goal-stats__visual">
                        <div className="goal-stats__bar-container">
                          <div className="goal-stats__bar">
                            <motion.div 
                              className="goal-stats__fill" 
                              initial={{ width: 0 }} 
                              animate={{ width: `${progress}%` }} 
                              transition={{ duration: 1.2, ease: "circOut" }}
                            />
                            {progress > 0 && progress < 100 && (
                              <motion.div 
                                className="goal-stats__pulse"
                                style={{ left: `${progress}%` }}
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="goal-stats__markers">
                          <div className="marker-item">
                            <span className="marker-label">Старт</span>
                            <span className="marker-val">{initial}</span>
                          </div>
                          <div className="marker-item marker-item--center">
                            <span className="marker-pct">{progress}%</span>
                          </div>
                          <div className="marker-item marker-item--end">
                            <span className="marker-label">Цель</span>
                            <span className="marker-val">{target}</span>
                          </div>
                        </div>
                      </div>

                      {weeksLeft && diff > 0.1 && (
                        <div className="goal-stats__forecast">
                          <span className="forecast-icon">🗓</span>
                          <span>Прогноз: <strong>~{weeksLeft} нед.</strong> при текущем темпе</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="goal-summary__progress-card goal-summary__progress-card--empty">
                <div className="goal-summary__header">
                  <div className="goal-summary__header-title">
                    <Target size={14} /> <span>Путь к цели</span>
                  </div>
                </div>
                <div className="goal-empty-state">
                  <div className="goal-empty-state__icon">🎯</div>
                  <p>Цель не установлена</p>
                  <button className="btn-secondary btn-small" onClick={() => window.location.href = '/app/profile'}>
                    Установить цель
                  </button>
                </div>
              </div>
            )}

            <div className="goal-summary__bmi-card">
              {(() => {
                const weight = weightLog[weightLog.length - 1].weightKg;
                const height = profile.heightCm;
                const bmiNum = parseFloat((weight / Math.pow(height / 100, 2)).toFixed(1));
                
                let bmiStatus = { label: 'Норма', color: '#10b981' }; 
                if (bmiNum < 18.5) bmiStatus = { label: 'Дефицит веса', color: '#3b82f6' };
                else if (bmiNum >= 25 && bmiNum < 30) bmiStatus = { label: 'Избыточный вес', color: '#f59e0b' }; 
                else if (bmiNum >= 30) bmiStatus = { label: 'Ожирение', color: '#ef4444' }; 

                const minScale = 15;
                const maxScale = 35;
                const pos = Math.min(Math.max(((bmiNum - minScale) / (maxScale - minScale)) * 100, 0), 100);

                return (
                  <>
                    <div className="goal-summary__header">
                      <div className="goal-summary__header-title">
                        <span>⚖️ ИМТ</span>
                        <div className="bmi-info-trigger">
                          <Info size={14} />
                          <div className="bmi-info-tooltip">
                            <strong>Расчет ИМТ:</strong><br/>
                            Вес (кг) / Рост² (м²). <br/>
                            Позволяет оценить соответствие массы тела и роста.
                          </div>
                        </div>
                      </div>
                      <div className="bmi-badge" style={{ backgroundColor: `${bmiStatus.color}15`, color: bmiStatus.color }}>
                        {bmiStatus.label}
                      </div>
                    </div>
                    
                    <div className="bmi-card-content">
                      <div className="bmi-val">
                        <span className="bmi-val__num">{bmiNum}</span>
                      </div>

                      <div className="bmi-gauge">
                        <div className="bmi-gauge__track">
                          <div className="bmi-gauge__segment bmi-gauge__segment--under" />
                          <div className="bmi-gauge__segment bmi-gauge__segment--normal" />
                          <div className="bmi-gauge__segment bmi-gauge__segment--over" />
                          <div className="bmi-gauge__segment bmi-gauge__segment--obese" />
                          <motion.div 
                            className="bmi-gauge__marker"
                            initial={{ left: 0 }}
                            animate={{ left: `${pos}%` }}
                            transition={{ type: 'spring', stiffness: 50, damping: 15, delay: 0.5 }}
                          >
                            <div className="marker-dot" style={{ backgroundColor: bmiStatus.color }} />
                            <div className="marker-arrow" style={{ borderBottomColor: bmiStatus.color }} />
                          </motion.div>
                        </div>
                        <div className="bmi-gauge__labels">
                          <span>18.5</span>
                          <span>25</span>
                          <span>30</span>
                        </div>
                      </div>
                      <p className="bmi-note">На основе вашего роста: <strong>{height} см</strong></p>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

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
