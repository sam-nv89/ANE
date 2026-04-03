import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Clock, Smile, TrendingUp, ChevronDown } from 'lucide-react';
import './ProblemSolution.css';

/* ----------------------------------------------------------------
   Data
----------------------------------------------------------------- */
const PAIRS = [
  {
    id: 'time',
    icon: Clock,
    problem: {
      label: 'Нет времени на готовку',
      description:
        'Среднестатистический человек тратит от 1 до 2 часов в день на планирование еды и походы в магазин. Это 14+ часов в месяц «украденного» времени.',
    },
    solution: {
      label: 'Планирование за 5 минут в неделю',
      description:
        'Алгоритм генерирует недельный рацион с оптимизированным списком покупок (Zero Waste) за одну итерацию. Batch-cook стратегия автоматически группирует блюда по времени приготовления.',
      stat: 'Экономия: 40% времени на рутину',
    },
  },
  {
    id: 'taste',
    icon: Smile,
    problem: {
      label: 'Срывы из-за невкусной еды',
      description:
        '70% провалов диет — следствие вкусового дискомфорта. Стандартные планы питания игнорируют пищевые привычки, что ведёт к психологическому сопротивлению.',
    },
    solution: {
      label: 'Рацион под ваши реальные привычки',
      description:
        'Исключение нелюбимых продуктов из базы, учёт «ленивых» форматов (overnight oats, простые завтраки, студенческий рацион). Монотонность дозируется по индексу комфорта, а не устраняется принудительно.',
      stat: 'Compliance Rate: 80% на горизонте 2+ недель',
    },
  },
  {
    id: 'progress',
    icon: TrendingUp,
    problem: {
      label: 'Отсутствие видимого прогресса',
      description:
        'Без математической модели сложно понять, почему вес не меняется. Subjective «ощущения» не работают — нужны данные.',
    },
    solution: {
      label: 'Точная математическая модель трансформации',
      description:
        'Система строит прогнозную кривую на основе антропометрики и термодинамики метаболизма. Аналитика в реальном времени показывает отклонение от плана и автоматически пересчитывает рацион.',
      stat: 'Точность расчёта КБЖУ: ±2%',
    },
  },
];

/* ----------------------------------------------------------------
   Component
----------------------------------------------------------------- */
export default function ProblemSolution() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [openId, setOpenId] = useState(null);

  return (
    <section className="ps" ref={ref}>
      <div className="container">
        {/* Header */}
        <motion.div
          className="ps__header"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="section-label">Решаемые проблемы</span>
          <h2 className="ps__title">
            Реальные барьеры.{' '}
            <span className="gradient-text">Инженерные решения.</span>
          </h2>
          <p className="ps__subtitle">
            Каждый блок основан на анализе паттернов неудач пользователей.
            Не мотивационные слоганы — конкретные алгоритмические ответы на
            конкретные боли.
          </p>
        </motion.div>

        {/* Pairs */}
        <div className="ps__list">
          {PAIRS.map((pair, i) => (
            <ProblemPair
              key={pair.id}
              pair={pair}
              index={i}
              inView={inView}
              isOpen={openId === pair.id}
              onToggle={() => setOpenId(openId === pair.id ? null : pair.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- ProblemPair ---------- */
function ProblemPair({ pair, index, inView, isOpen, onToggle }) {
  const Icon = pair.icon;

  return (
    <motion.div
      className={`ps__pair ${isOpen ? 'ps__pair--open' : ''}`}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Toggle header */}
      <button
        className="ps__toggle"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`ps-body-${pair.id}`}
        id={`ps-toggle-${pair.id}`}
      >
        <div className="ps__toggle-left">
          <div className="ps__icon-wrap">
            <Icon size={20} strokeWidth={1.75} />
          </div>
          <div className="ps__labels">
            <div className="ps__problem-label">
              <span className="ps__pill ps__pill--problem">Проблема</span>
              {pair.problem.label}
            </div>
            <div className="ps__solution-label">
              <span className="ps__pill ps__pill--solution">Решение</span>
              {pair.solution.label}
            </div>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`ps__chevron ${isOpen ? 'ps__chevron--open' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Expandable body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`ps-body-${pair.id}`}
            role="region"
            aria-labelledby={`ps-toggle-${pair.id}`}
            className="ps__body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="ps__body-inner">
              <div className="ps__col ps__col--problem">
                <div className="ps__col-label">Почему это происходит</div>
                <p>{pair.problem.description}</p>
              </div>
              <div className="ps__col-divider" aria-hidden="true" />
              <div className="ps__col ps__col--solution">
                <div className="ps__col-label">Как мы это решаем</div>
                <p>{pair.solution.description}</p>
                <div className="ps__stat gradient-text">{pair.solution.stat}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
