import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Save, LogOut, AlertTriangle } from 'lucide-react';

import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import { calcBMR, calcTDEE, calcTargetCalories } from '../../lib/nutrition/tdee';
import { calcMacros } from '../../lib/nutrition/macros';
import { generatePlan } from '../../lib/planner/generator';
import recipes from '../../data/recipes.json';

import './ProfilePage.css';

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Сидячий' }, { value: 'light', label: 'Лёгкий' },
  { value: 'moderate',  label: 'Умеренный' }, { value: 'active', label: 'Активный' },
  { value: 'veryActive',label: 'Очень активный' },
];
const GOAL_OPTIONS = [
  { value: 'lose', label: 'Похудение' }, { value: 'maintain', label: 'Поддержание' },
  { value: 'gain', label: 'Набор массы' },
];
const GOAL_LABELS = { lose: 'Похудение', maintain: 'Поддержание', gain: 'Набор массы' };

export default function ProfilePage() {
  const navigate = useNavigate();
  const { profile, nutrition, updateProfile, setNutrition, resetProfile } = useUserStore();
  const { setPlan } = usePlanStore();

  const [local, setLocal] = useState({ ...profile });
  const [saved, setSaved] = useState(false);

  const update = (patch) => setLocal((p) => ({ ...p, ...patch }));

  const handleSave = () => {
    const bmr = calcBMR(local.weightKg, local.heightCm, local.age, local.gender);
    const tdee = calcTDEE(bmr, local.activityLevel);
    const targetCalories = calcTargetCalories(tdee, local.goal, local.goalRate ?? -0.5);
    const macros = calcMacros(targetCalories, local.weightKg, local.goal);
    const newNutrition = { bmr, tdee, targetCalories, ...macros };

    const updatedProfile = { ...local, goalLabel: GOAL_LABELS[local.goal] };
    updateProfile(updatedProfile);
    setNutrition(newNutrition);

    // Regenerate plan with new profile
    const newPlan = generatePlan(recipes, updatedProfile, newNutrition);
    setPlan(newPlan);

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleLogout = () => {
    resetProfile();
    navigate('/');
  };

  if (!profile) return null;

  return (
    <div className="profile">
      <h1 className="profile__title">Профиль</h1>
      <p className="profile__subtitle">Изменение данных пересчитает КБЖУ и обновит рацион.</p>

      {/* Biometrics */}
      <div className="profile__card">
        <div className="profile__section-title">Биометрия</div>

        <div className="field">
          <label className="field__label" htmlFor="prf-name">Имя</label>
          <input id="prf-name" className="field__input" value={local.name} onChange={(e) => update({ name: e.target.value })} />
        </div>

        <div className="field__row">
          <div className="field">
            <label className="field__label" htmlFor="prf-age">Возраст</label>
            <input id="prf-age" className="field__input" type="number" min={14} max={100} value={local.age} onChange={(e) => update({ age: parseInt(e.target.value) || local.age })} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="prf-gender">Пол</label>
            <select id="prf-gender" className="field__select" value={local.gender} onChange={(e) => update({ gender: e.target.value })}>
              <option value="female">Женский</option>
              <option value="male">Мужской</option>
            </select>
          </div>
        </div>

        <div className="field__row">
          <div className="field">
            <label className="field__label">Рост: {local.heightCm} см</label>
            <input type="range" className="field__slider" min={140} max={210} value={local.heightCm} onChange={(e) => update({ heightCm: parseInt(e.target.value) })} />
          </div>
          <div className="field">
            <label className="field__label">Вес: {local.weightKg} кг</label>
            <input type="range" className="field__slider" min={40} max={200} step={0.5} value={local.weightKg} onChange={(e) => update({ weightKg: parseFloat(e.target.value) })} />
          </div>
        </div>
      </div>

      {/* Goal & Activity */}
      <div className="profile__card">
        <div className="profile__section-title">Цель и активность</div>
        <div className="field__row">
          <div className="field">
            <label className="field__label" htmlFor="prf-goal">Цель</label>
            <select id="prf-goal" className="field__select" value={local.goal} onChange={(e) => update({ goal: e.target.value })}>
              {GOAL_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="field__label" htmlFor="prf-activity">Активность</label>
            <select id="prf-activity" className="field__select" value={local.activityLevel} onChange={(e) => update({ activityLevel: e.target.value })}>
              {ACTIVITY_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Current nutrition */}
      {nutrition && (
        <div className="profile__card profile__card--nutrition">
          <div className="profile__section-title">Текущие показатели</div>
          <div className="profile__nutrition-grid">
            {[
              { label: 'Калории',   value: nutrition.targetCalories, unit: 'ккал', color: 'var(--clr-accent-1)' },
              { label: 'Белки',     value: nutrition.protein,         unit: 'г',   color: 'var(--clr-accent-2)' },
              { label: 'Жиры',      value: nutrition.fat,             unit: 'г',   color: '#f59e0b' },
              { label: 'Углеводы',  value: nutrition.carbs,           unit: 'г',   color: '#a78bfa' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="profile__nutrition-cell">
                <div className="profile__nutrition-value" style={{ color }}>{value} <span>{unit}</span></div>
                <div className="profile__nutrition-label">{label}</div>
              </div>
            ))}
          </div>
          <p className="profile__nutrition-note">
            * Нажмите «Сохранить» чтобы пересчитать показатели на основе изменённых данных.
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="profile__actions">
        <motion.button
          className="btn-primary"
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Save size={16} />
          {saved ? '✅ Сохранено!' : 'Сохранить и пересчитать'}
        </motion.button>

        <button
          className="btn-secondary"
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fc8181' }}
        >
          <LogOut size={16} /> Сбросить профиль
        </button>
      </div>

      <div className="profile__danger-note">
        <AlertTriangle size={14} />
        Сброс профиля удалит все данные (рацион, прогресс, список покупок) из браузера.
      </div>
    </div>
  );
}
