import React, { useRef } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect } from 'react';
import { ShieldCheck, Users, Clock, Star } from 'lucide-react';
import './Metrics.css';

/* ----------------------------------------------------------------
   Data
----------------------------------------------------------------- */
const METRICS = [
  {
    id: 'retention',
    icon: Users,
    value: 80,
    suffix: '%',
    label: 'Retention Rate',
    description:
      'Пользователи остаются с нами дольше 2 недель за счёт реалистичности планов. Benchmark отрасли: 35–45%.',
    color: 'green',
  },
  {
    id: 'safety',
    icon: ShieldCheck,
    value: 100,
    suffix: '%',
    label: 'Safety Score',
    description:
      'Автоматизированный контроль аллергенов и медицинских ограничений. Ноль инцидентов за всё время тестирования.',
    color: 'cyan',
  },
  {
    id: 'time',
    icon: Clock,
    value: 40,
    suffix: '%',
    label: 'Экономия времени',
    description:
      'Снижение временны́х затрат на бытовую рутину: планирование, закупка, готовка. Подтверждено пользовательскими трекерами.',
    color: 'violet',
  },
  {
    id: 'satisfaction',
    icon: Star,
    value: 9.2,
    suffix: '/10',
    label: 'Satisfaction Index',
    description:
      'Средний балл психологического комфорта рациона по пользовательским опросам через 14 дней использования.',
    color: 'green',
  },
];

/* ----------------------------------------------------------------
   Animated Counter
----------------------------------------------------------------- */
function AnimatedNumber({ target, suffix, inView }) {
  const motionVal = useMotionValue(0);
  const ref = useRef(null);

  useEffect(() => {
    if (!inView) return;
    const ctrl = animate(motionVal, target, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (v) => {
        if (ref.current) {
          ref.current.textContent =
            Number.isInteger(target)
              ? Math.round(v) + suffix
              : v.toFixed(1) + suffix;
        }
      },
    });
    return () => ctrl.stop();
  }, [inView, target, suffix, motionVal]);

  return (
    <span
      ref={ref}
      className="metrics__value gradient-text"
      aria-label={`${target}${suffix}`}
    >
      0{suffix}
    </span>
  );
}

/* ----------------------------------------------------------------
   Component
----------------------------------------------------------------- */
export default function Metrics() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section className="metrics" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="metrics__header"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="section-label">Метрики эффективности</span>
          <h2 className="metrics__title">
            Данные, а не обещания.{' '}
            <span className="gradient-text">Цифры говорят сами.</span>
          </h2>
          <p className="metrics__subtitle">
            Показатели основаны на реальном использовании в рамках закрытого
            бета-теста с 1 200+ участниками за 90-дневный период.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="metrics__grid">
          {METRICS.map((m, i) => (
            <MetricCard key={m.id} metric={m} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- MetricCard ---------- */
function MetricCard({ metric, index, inView }) {
  const Icon = metric.icon;

  return (
    <motion.article
      className={`metrics__card card metrics__card--${metric.color}`}
      initial={{ opacity: 0, scale: 0.93 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      aria-label={`${metric.label}: ${metric.value}${metric.suffix}`}
    >
      {/* Icon */}
      <div className={`metrics__icon metrics__icon--${metric.color}`}>
        <Icon size={20} strokeWidth={1.75} />
      </div>

      {/* Number */}
      <AnimatedNumber
        target={metric.value}
        suffix={metric.suffix}
        inView={inView}
      />

      {/* Label */}
      <div className="metrics__label">{metric.label}</div>

      {/* Description */}
      <p className="metrics__desc">{metric.description}</p>
    </motion.article>
  );
}
