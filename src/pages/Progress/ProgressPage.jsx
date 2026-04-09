import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Target, Info } from 'lucide-react';

import { useProgressStore } from '../../store/useProgressStore';
import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import CustomDatePicker from '../../components/Common/CustomDatePicker';

import './ProgressPage.css';

/* ── Simple SVG line chart ── */
function WeightChart({ entries, targetWeight }) {
  const [hoveredEntry, setHoveredEntry] = useState(null);

  if (entries.length < 2) return null;

  const W = 600; 
  const H = 160;
  const PAD_L = 45; 
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 25;

  const weights = entries.map((e) => e.weightKg);
  const minW = Math.min(...weights, targetWeight ?? Infinity) - 5;
  const maxW = Math.max(...weights) + 5;

  const toX = (i) => PAD_L + (i / (entries.length - 1)) * (W - PAD_L - PAD_R);
  const toY = (w) => H - PAD_B - ((w - minW) / (maxW - minW)) * (H - PAD_T - PAD_B);

  // Generate Y-axis ticks (every 10kg)
  const ticks = [];
  const startTick = Math.ceil(minW / 10) * 10;
  for (let t = startTick; t <= maxW; t += 10) {
    ticks.push(t);
  }

  const pathD = entries.map((e, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(e.weightKg).toFixed(1)}`).join(' ');

  const formatDate = (isoStr) => {
    const [y, m, d] = isoStr.split('-');
    return `${d}.${m}.${y}`;
  };

  return (
    <div className="weight-chart-container">
      <svg viewBox={`0 0 ${W} ${H}`} className="weight-chart__svg" aria-label="График веса">
        {/* Y-Axis Labels & Grid */}
        {ticks.map((t) => (
          <g key={t}>
            <line 
              x1={PAD_L} y1={toY(t)} x2={W - PAD_R} y2={toY(t)} 
              stroke="rgba(255,255,255,0.05)" strokeWidth={1} 
            />
            <text 
              x={PAD_L - 10} y={toY(t) + 4} 
              textAnchor="end" 
              fill="var(--clr-text-muted)" 
              style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-heading)' }}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Target weight line */}
        {targetWeight && (
          <line
            x1={PAD_L} y1={toY(targetWeight)} x2={W - PAD_R} y2={toY(targetWeight)}
            stroke="rgba(0,245,160,0.3)" strokeWidth={1.5} strokeDasharray="6,4"
          />
        )}
        {/* Area fill */}
        <path
          d={`${pathD} L${toX(entries.length - 1)},${H - PAD_B} L${toX(0)},${H - PAD_B} Z`}
          fill="url(#weight-grad)" opacity={0.2}
        />
        {/* Line */}
        <path d={pathD} fill="none" stroke="url(#weight-line-grad)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        
        {/* Points - Hoverable */}
        {entries.map((e, i) => (
          <g key={i} className="weight-point" onMouseMove={() => setHoveredEntry({ ...e, x: toX(i), y: toY(e.weightKg) })} onMouseLeave={() => setHoveredEntry(null)}>
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
            <div className={`tooltip-arrow ${hoveredEntry.y < 50 ? 'tooltip-arrow--top' : 'tooltip-arrow--bottom'}`} />
          </motion.div>
        )}
      </AnimatePresence>
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
  const { weightLog, logWeight, dailyCompliance, syncCompliance } = useProgressStore();
  const { profile } = useUserStore();
  const { plan, completed, generatedAt } = usePlanStore();

  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));

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
