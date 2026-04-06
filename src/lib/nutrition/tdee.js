/**
 * tdee.js — Расчёт базального метаболизма и TDEE.
 *
 * Используются две формулы:
 * - Mifflin-St Jeor (1990): более точная для современной популяции
 * - Harris-Benedict (1919): классическая, для сравнения
 *
 * Выбирается Mifflin-St Jeor как основная.
 */

/** Коэффициенты активности (PAL) */
const ACTIVITY_MULTIPLIERS = {
  sedentary:  1.2,   // сидячий образ жизни, нет спорта
  light:      1.375, // тренировки 1 раз в неделю
  moderate:   1.55,  // тренировки 2-3 раза в неделю
  active:     1.725, // тренировки 4-7 раз в неделю
  veryActive: 1.9,   // физический труд + спорт
};

/**
 * Вычисляет BMR по Mifflin-St Jeor.
 * @param {number} weightKg
 * @param {number} heightCm
 * @param {number} age
 * @param {'male'|'female'} gender
 * @returns {number} BMR в ккал/день
 */
export function calcBMR(weightKg, heightCm, age, gender) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return gender === 'male' ? base + 5 : base - 161;
}

/**
 * Вычисляет TDEE (Total Daily Energy Expenditure).
 * @param {number} bmr
 * @param {string} activityLevel
 * @returns {number} TDEE в ккал/день
 */
export function calcTDEE(bmr, activityLevel) {
  const mult = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return Math.round(bmr * mult);
}

/**
 * Вычисляет целевую калорийность с учётом цели и темпа.
 * 1 кг жира ≈ 7700 ккал → темп 0.5 кг/нед ≈ −550 ккал/день
 * @param {number} tdee
 * @param {'lose'|'maintain'|'gain'} goal
 * @param {number} goalRate  кг/неделю (отрицательное → похудение)
 * @returns {number} целевые ккал/день
 */
export function calcTargetCalories(tdee, goal, goalRate) {
  if (goal === 'maintain') return tdee;
  const dailyDelta = Math.round((goalRate * 7700) / 7);
  const target = tdee + dailyDelta;
  // Минимальная безопасная калорийность
  const MIN_CALORIES = 1200;
  return Math.max(target, MIN_CALORIES);
}
