import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Clock, Heart, FlaskConical } from 'lucide-react';
import './Engine.css';

/* ----------------------------------------------------------------
   Data — three engine modules
----------------------------------------------------------------- */
const MODULES = [
  {
    id: 'time-adaptive',
    icon: Clock,
    accentClass: 'engine__card--green',
    tag: 'Module 01',
    name: 'Time-Adaptive',
    headline: 'Алгоритм динамической фильтрации рецептов',
    description:
      'Система анализирует ваше временно́е окно — от 15 минут до 2 часов — и частоту приготовления. Рецепты подбираются не «красивые», а реально исполнимые в вашем расписании.',
    tech: ['Dynamic Filtering', 'Temporal Context', 'Batch-Cook Optimizer'],
    metric: { label: 'Мин. окно готовки', value: '15 мин' },
  },
  {
    id: 'psych-comfort',
    icon: Heart,
    accentClass: 'engine__card--cyan',
    tag: 'Module 02',
    name: 'Psychological Comfort',
    headline: 'Система «вкусового портрета» и индекс монотонности',
    description:
      'Алгоритм учитывает ваши вкусовые предпочтения и рассчитывает индекс монотонности. Допускает дублирование блюд там, где это оправданно — минимум готовки без ущерба для результата.',
    tech: ['Taste Profile Engine', 'Monotony Index', 'Habit Modeling'],
    metric: { label: 'Индекс удовлетв.', value: '9.2/10' },
  },
  {
    id: 'precision-bio',
    icon: FlaskConical,
    accentClass: 'engine__card--violet',
    tag: 'Module 03',
    name: 'Precision Bio',
    headline: 'Научно-обоснованный биометрический расчёт',
    description:
      'Жёсткий фильтр аллергенов и дефицитов. Антропометрические данные обрабатываются по верифицированным клиническим формулам (Mifflin-St Jeor, Harris-Benedict). Ни одного «приблизительного» значения.',
    tech: ['Allergen Hard-Filter', 'Clinical TDEE Models', 'Micronutrient Tracker'],
    metric: { label: 'Точность КБЖУ', value: '±2%' },
  },
];

/* ----------------------------------------------------------------
   Animation
----------------------------------------------------------------- */
const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* ----------------------------------------------------------------
   Component
----------------------------------------------------------------- */
export default function Engine() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="engine" className="engine" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="engine__header"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="section-label">Технологическое ядро</span>
          <h2 className="engine__title">
            Три модуля,{' '}
            <span className="gradient-text">один слаженный алгоритм</span>
          </h2>
          <p className="engine__subtitle">
            Каждый модуль решает конкретную проблему. Вместе они формируют
            рацион, который не просто работает на бумаге — он работает в
            реальной жизни.
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="engine__grid">
          {MODULES.map((mod, i) => (
            <EngineCard key={mod.id} mod={mod} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- EngineCard sub-component ---------- */
function EngineCard({ mod, index, inView }) {
  const Icon = mod.icon;

  return (
    <motion.article
      className={`engine__card card ${mod.accentClass}`}
      variants={cardVariants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      custom={index}
      aria-labelledby={`module-${mod.id}-name`}
    >
      {/* Card top */}
      <div className="engine__card-top">
        <div className="engine__icon-wrap">
          <Icon size={22} strokeWidth={1.75} />
        </div>
        <span className="engine__tag">{mod.tag}</span>
      </div>

      {/* Card module name */}
      <div className="engine__module-name" id={`module-${mod.id}-name`}>
        {mod.name}
      </div>

      {/* Card headline */}
      <h3 className="engine__card-headline">{mod.headline}</h3>

      {/* Description */}
      <p className="engine__card-desc">{mod.description}</p>

      {/* Tech tags */}
      <div className="engine__tech-tags">
        {mod.tech.map((t) => (
          <span key={t} className="engine__tech-tag">
            {t}
          </span>
        ))}
      </div>

      {/* Metric pill */}
      <div className="engine__metric">
        <span className="engine__metric-label">{mod.metric.label}</span>
        <span className="engine__metric-value gradient-text">
          {mod.metric.value}
        </span>
      </div>
    </motion.article>
  );
}
