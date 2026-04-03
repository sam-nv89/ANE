import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap } from 'lucide-react';
import heroImg from '../assets/hero.png';
import './Hero.css';

/* ----------------------------------------------------------------
   Framer Motion presets
----------------------------------------------------------------- */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

/* Animated dot in the "live" badge */
function PulseDot() {
  return (
    <span className="hero__pulse-dot" aria-hidden="true">
      <span />
    </span>
  );
}

export default function Hero() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  const navigate = useNavigate();
  const handleCTA = () => navigate('/app/onboarding');

  return (
    <section className="hero" ref={ref}>
      {/* Background decorations */}
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__grid-overlay grid-overlay" />
        <div className="hero__glow hero__glow--1" />
        <div className="hero__glow hero__glow--2" />
        <div className="hero__glow hero__glow--3" />
      </div>

      <div className="container hero__inner">
        {/* Left column — text */}
        <div className="hero__content">
          {/* Live badge */}
          <motion.div
            className="hero__badge"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0}
          >
            <PulseDot />
            <span>Beta · Ранний доступ открыт</span>
          </motion.div>

          <motion.h1
            className="hero__title"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0.1}
          >
            Алгоритм питания,{' '}
            <span className="gradient-text">который подстраивается</span>
            {' '}под вашу жизнь, а не наоборот
          </motion.h1>

          <motion.p
            className="hero__subtitle"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0.2}
          >
            Интеллектуальная система планирования рациона, объединяющая научный
            расчёт КБЖУ, учёт вашего реального тайм-менеджмента и психологический
            комфорт. Достигайте целей без стресса и лишних затрат времени.
          </motion.p>

          {/* CTA row */}
          <motion.div
            className="hero__cta-row"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0.3}
          >
            <button
              id="hero-cta-btn"
              className="btn-primary hero__cta-btn"
              onClick={handleCTA}
              aria-label="Запустить бесплатный расчёт рациона"
            >
              <Zap size={18} />
              Запустить бесплатный расчёт рациона
              <ArrowRight size={16} />
            </button>
            <p className="hero__cta-note">
              Без карты. Без подписки на 14 дней.
            </p>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            className="hero__trust"
            variants={fadeUp}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            custom={0.4}
          >
            {[
              { value: '80%', label: 'retention после 2 недель' },
              { value: '40%', label: 'экономия времени на рутину' },
              { value: '100%', label: 'контроль аллергенов' },
            ].map(({ value, label }) => (
              <div key={label} className="hero__trust-item">
                <span className="hero__trust-value gradient-text">{value}</span>
                <span className="hero__trust-label">{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right column — visual */}
        <motion.div
          className="hero__visual"
          initial={{ opacity: 0, x: 48, scale: 0.95 }}
          animate={inView ? { opacity: 1, x: 0, scale: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Dashboard mockup card */}
          <div className="hero__mockup">
            <div className="hero__mockup-header">
              <div className="hero__mockup-dots" aria-hidden="true">
                <span /><span /><span />
              </div>
              <span className="hero__mockup-title">ANE Dashboard · v2.4</span>
              <span className="hero__mockup-status">
                <PulseDot /> Live
              </span>
            </div>

            <img
              src={heroImg}
              alt="Adaptive Nutrition Engine dashboard preview"
              className="hero__mockup-img"
              loading="eager"
            />

            {/* Floating metric chips */}
            <motion.div
              className="hero__chip hero__chip--1"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={14} />
              <span>Time-Adaptive</span>
              <strong className="gradient-text">15 мин</strong>
            </motion.div>

            <motion.div
              className="hero__chip hero__chip--2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            >
              <span>КБЖУ точность</span>
              <strong className="gradient-text">±2%</strong>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
