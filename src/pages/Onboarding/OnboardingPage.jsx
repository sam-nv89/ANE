import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import { calcBMR, calcTDEE, calcTargetCalories } from '../../lib/nutrition/tdee';
import { calcMacros } from '../../lib/nutrition/macros';
import { generatePlan } from '../../lib/planner/generator';
import recipes from '../../data/recipes.json';

import BiometricStep  from './steps/BiometricStep';
import GoalStep       from './steps/GoalStep';
import TimeStep       from './steps/TimeStep';
import MeatStep       from './steps/MeatStep';
import VegStep        from './steps/VegStep';
import DairyStep      from './steps/DairyStep';
import GrainsStep     from './steps/GrainsStep';
import AllergenStep   from './steps/AllergenStep';
import SummaryStep    from './steps/SummaryStep';

import './OnboardingPage.css';

/* ── Step config ── */
const STEPS = [
  { id: 'biometric', label: 'Данные',      component: BiometricStep },
  { id: 'goal',      label: 'Цель',         component: GoalStep },
  { id: 'time',      label: 'Время',        component: TimeStep },
  { id: 'meat',      label: 'Мясо/Птица',   component: MeatStep },
  { id: 'veg',       label: 'Овощи/Фрукты', component: VegStep },
  { id: 'dairy',     label: 'Молочное',     component: DairyStep },
  { id: 'grains',    label: 'Крупы/Бобовые',component: GrainsStep },
  { id: 'allergen',  label: 'Ограничения',  component: AllergenStep },
  { id: 'summary',   label: 'Итог',         component: SummaryStep },
];

/* ── Initial form state ── */
const INITIAL = {
  // Step 1 — Biometric
  name: '', age: 28, gender: 'female', heightCm: 165, weightKg: 65,
  activityLevel: 'moderate',
  // Step 2 — Goal
  goal: 'lose', goalRate: -0.5, targetWeightKg: null,
  // Step 3 — Time
  cookTimeWindows: [30], cookFrequency: 'daily', preferLazy: false,
  // Steps 4-7 — Ingredients
  likedProteins: [],
  likedVeg: [],
  likedDairy: [],
  likedGrains: [],
  
  dislikedIngredients: [],   // legacy ID-based (for generator filter)
  dislikedFreeText: [],      // array of keywords for generator
  excludedIngredientsFreeText: '', // raw string from UI text area
  
  // Step 8 — Allergens
  allergens: [], medicalRestrictions: [], dietaryStyles: [],
  
  // New features
  mealFrequency: 3,
  mealSpecifics: [], // ['no-breakfast', 'heavy-breakfast', 'light-dinner', 'no-dinner']
  includeSugary: false,
  sugaryFrequency: 'few',
  allowRepeatMeals: false,
  
  // Cycle Syncing
  cycleTracking: {
    enabled: false,
    cycleLength: 28,
    periodLength: 5,
    lastPeriodDate: '', // YYYY-MM-DD
  },
};

/* ── Animation variants ── */
const variants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 48 : -48 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -48 : 48 }),
};

/* ── StepIndicator ── */
function StepIndicator({ current, total, labels }) {
  return (
    <div className="step-indicator" role="progressbar" aria-valuenow={current + 1} aria-valuemax={total}>
      <div className="step-indicator__bar">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`step-indicator__seg ${
              i < current ? 'step-indicator__seg--done'
              : i === current ? 'step-indicator__seg--active'
              : ''
            }`}
          />
        ))}
      </div>
      <div className="step-indicator__label">
        Шаг <span>{current + 1}</span> из {total} — {labels[current]}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [nutrition, setNutrition] = useState(null);

  const completeOnboarding = useUserStore((s) => s.completeOnboarding);
  const setPlan = usePlanStore((s) => s.setPlan);

  const update = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const goNext = () => {
    if (step < STEPS.length - 1) {
      // On last step before summary — compute nutrition
      if (step === STEPS.length - 2) {
        const bmr = calcBMR(form.weightKg, form.heightCm, form.age, form.gender);
        const tdee = calcTDEE(bmr, form.activityLevel);
        const targetCalories = calcTargetCalories(tdee, form.goal, form.goalRate);
        const macros = calcMacros(targetCalories, form.weightKg, form.goal);
        setNutrition({ bmr, tdee, targetCalories, ...macros });
      }
      setDir(1);
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setDir(-1);
      setStep((s) => s - 1);
    } else {
      navigate('/');
    }
  };

  const handleFinish = () => {
    const GOAL_LABELS = { lose: 'Похудение', maintain: 'Поддержание', gain: 'Набор массы' };
    const profileData = { ...form, goalLabel: GOAL_LABELS[form.goal] };

    // Generate first plan immediately
    const plan = generatePlan(recipes, profileData, nutrition);
    setPlan(plan);
    completeOnboarding(profileData, nutrition);
    navigate('/app/dashboard');
  };

  const StepComponent = STEPS[step].component;

  return (
    <div className="onboarding">
      {/* Header */}
      <div className="onboarding__header">
        <button className="onboarding__logo gradient-text" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          ANE
        </button>
        <span className="onboarding__step-count">
          {step + 1} / {STEPS.length}
        </span>
      </div>

      {/* Progress */}
      <StepIndicator
        current={step}
        total={STEPS.length}
        labels={STEPS.map((s) => s.label)}
      />

      {/* Step card with animation */}
      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={step}
          className="onboarding__card"
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <StepComponent
            form={form}
            update={update}
            nutrition={nutrition}
            onNext={goNext}
            onBack={goBack}
            onFinish={handleFinish}
            isLast={step === STEPS.length - 1}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
