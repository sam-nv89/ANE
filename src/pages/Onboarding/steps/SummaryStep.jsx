import React from 'react';
import { motion } from 'framer-motion';
import { Zap, ArrowLeft } from 'lucide-react';

const GOAL_META = {
  lose:     { label: 'Похудение',   color: '#00f5a0' },
  maintain: { label: 'Поддержание', color: '#00d4ff' },
  gain:     { label: 'Набор массы', color: '#7c3aed' },
};

const ACTIVITY_LABELS = {
  sedentary:  'Сидячий', light: 'Лёгкий', moderate: 'Умеренный',
  active: 'Активный', veryActive: 'Очень активный',
};

const FREQ_LABELS = {
  daily: 'Ежедневно', alternate: 'Через день', few: '2–3 раза/нед', batch: 'Batch-cook',
};

export default function SummaryStep({ form, nutrition, onFinish, onBack }) {
  if (!nutrition) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--clr-text-muted)' }}>
        Расчёт...
      </div>
    );
  }

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const goalMeta = GOAL_META[form.goal];
  const tags = [
    `${form.age} лет`, `${form.heightCm} см`, `${form.weightKg} кг`,
    ...(form.targetWeightKg && form.goal !== 'maintain' ? [`Цель: ${form.targetWeightKg} кг`] : []),
    ACTIVITY_LABELS[form.activityLevel],
    goalMeta.label,
    FREQ_LABELS[form.cookFrequency],
    `${form.cookTimeWindows?.join(', ') || 30} мин/блюдо`,
    ...(form.includeSugary ? ['С десертами'] : []),
    ...(form.allergens.length > 0 ? [`${form.allergens.length} аллерген(а)`] : []),
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--clr-accent-1), var(--clr-accent-2))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#050810', flexShrink: 0,
        }}>
          <Zap size={18} />
        </div>
        <h2 className="step__title" style={{ marginBottom: 0 }}>
          Готово, {form.name}!
        </h2>
      </div>
      <p className="step__subtitle">
        Ваш персональный КБЖУ рассчитан по формуле Mifflin-St Jeor. Всё готово к генерации первого рациона.
      </p>

      {/* КБЖУ boxes */}
      <div className="summary-grid">
        {/* Main — calories */}
        <motion.div
          className="summary-box summary-box--main"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="summary-box__value">
            {formatNumber(nutrition.targetCalories)}
          </div>
          <div className="summary-box__label">Целевые калории / день</div>
        </motion.div>


        {/* Protein */}
        <motion.div className="summary-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="summary-box__value" style={{ color: 'var(--clr-accent-2)' }}>
            {formatNumber(nutrition.protein)}
          </div>
          <div className="summary-box__label">Белки, г</div>
        </motion.div>

        {/* Fat */}
        <motion.div className="summary-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="summary-box__value" style={{ color: '#f59e0b' }}>
            {formatNumber(nutrition.fat)}
          </div>
          <div className="summary-box__label">Жиры, г</div>
        </motion.div>

        {/* Carbs */}
        <motion.div className="summary-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="summary-box__value" style={{ color: '#a78bfa' }}>
            {formatNumber(nutrition.carbs)}
          </div>
          <div className="summary-box__label">Углеводы, г</div>
        </motion.div>

        {/* TDEE */}
        <motion.div className="summary-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="summary-box__value" style={{ color: 'var(--clr-text-secondary)', fontSize: 22 }}>
            {formatNumber(nutrition.tdee)}
          </div>
          <div className="summary-box__label">TDEE (поддержание)</div>
        </motion.div>
      </div>


      {/* Profile tags */}
      <div className="summary-profile">
        {tags.map((tag) => (
          <span key={tag} className="summary-tag">{tag}</span>
        ))}
      </div>

      <div className="onboarding__nav">
        <button className="onboarding__back" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Назад
        </button>
        <motion.button
          className="btn-primary"
          onClick={onFinish}
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ gap: 8, fontSize: 15, padding: '13px 28px' }}
        >
          <Zap size={16} />
          Сгенерировать рацион
        </motion.button>
      </div>
    </>
  );
}
