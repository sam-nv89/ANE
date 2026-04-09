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
import CustomSelect from '../../components/Common/CustomSelect';

import './ProfilePage.css';

const ACTIVITY_OPTIONS = [
  { value: '1.2', label: 'Сидячий', emoji: '🪑' },
  { value: '1.375', label: 'Лёгкий', emoji: '🚶' },
  { value: '1.55', label: 'Умеренный', emoji: '🏃' },
  { value: '1.725', label: 'Активный', emoji: '🏋️' },
  { value: '1.9', label: 'Очень активный', emoji: '🔥' },
];
const GOAL_OPTIONS = [
  { value: 'lose', label: 'Похудение', emoji: '📉' },
  { value: 'maintain', label: 'Поддержание', emoji: '⚖️' },
  { value: 'gain', label: 'Набор массы', emoji: '📈' },
];
const GENDER_OPTIONS = [
  { value: 'female', label: 'Женский', emoji: '👩' },
  { value: 'male', label: 'Мужской', emoji: '👨' },
];
const GOAL_LABELS = { lose: 'Похудение', maintain: 'Поддержание', gain: 'Набор массы' };

const fmtNum = (num) => num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

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
            <label className="field__label">Пол</label>
            <CustomSelect 
              options={GENDER_OPTIONS} 
              value={local.gender} 
              onChange={(val) => update({ gender: val })} 
              active={true}
            />
          </div>
        </div>

        <div className="field__row">
          <div className="field">
            <label className="field__label">Рост: {local.heightCm} см</label>
            <input type="range" className="field__slider" min={140} max={210} value={local.heightCm} onChange={(e) => update({ heightCm: parseInt(e.target.value) })} />
          </div>
          <div className="field">
            <label className="field__label">Текущий вес: {local.weightKg} кг</label>
            <input type="range" className="field__slider" min={40} max={200} step={0.5} value={local.weightKg} onChange={(e) => update({ weightKg: parseFloat(e.target.value) })} />
          </div>
        </div>

        <div className="field">
           <label className="field__label">Целевой вес: {local.targetWeightKg || local.weightKg} кг</label>
           <input type="range" className="field__slider" min={40} max={200} step={0.5} value={local.targetWeightKg || local.weightKg} onChange={(e) => update({ targetWeightKg: parseFloat(e.target.value) })} />
        </div>
      </div>

      {/* Goal & Activity */}
      <div className="profile__card">
        <div className="profile__section-title">Цель и активность</div>
        <div className="field__row">
          <div className="field">
            <label className="field__label">Цель</label>
            <CustomSelect 
              options={GOAL_OPTIONS} 
              value={local.goal} 
              onChange={(val) => update({ goal: val })} 
              active={true}
            />
          </div>
          <div className="field">
            <label className="field__label">Активность</label>
            <CustomSelect 
              options={ACTIVITY_OPTIONS} 
              value={local.activityLevel} 
              onChange={(val) => update({ activityLevel: val })} 
              active={true}
            />
          </div>
        </div>
      </div>

      {/* Current nutrition */}
      {nutrition && (
        <div className="profile__card profile__card--nutrition">
          <div className="profile__section-title">Текущие показатели</div>
          <div className="profile__nutrition-grid">
            {[
              { label: 'КАЛОРИИ',     value: nutrition.targetCalories, unit: '',     color: 'var(--clr-accent-1)' },
              { label: 'БЕЛКИ, г.',   value: nutrition.protein,         unit: '',     color: 'var(--clr-accent-2)' },
              { label: 'ЖИРЫ, г.',    value: nutrition.fat,             unit: '',     color: '#f59e0b' },
              { label: 'УГЛЕВОДЫ, г.',value: nutrition.carbs,           unit: '',     color: '#a78bfa' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="profile__nutrition-cell">
                <div className="profile__nutrition-value" style={{ color }}>
                  {fmtNum(value)} {unit && <span>{unit}</span>}
                </div>
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
