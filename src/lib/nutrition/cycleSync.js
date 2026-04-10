/**
 * cycleSync.js — Расчет фаз менструального цикла и гормональных сдвигов.
 */

/**
 * Рассчитывает текущую фазу цикла на основе даты последних месячных.
 * @param {string|Date} lastPeriodDate 
 * @param {number} cycleLength 
 * @param {string|Date} targetDate 
 * @returns {{phase: string, day: number, nextPeriodIn: number}|null}
 */
export function getCyclePhase(lastPeriodDate, cycleLength = 28, targetDate = new Date()) {
  if (!lastPeriodDate) return null;

  const start = new Date(lastPeriodDate);
  // Игнорируем время при расчете
  start.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  if (target < start) return null;
  
  // Разница в днях
  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // День внутри цикла (1-индексированный)
  const dayOfCycle = (diffDays % cycleLength) + 1;
  const nextPeriodIn = cycleLength - dayOfCycle;

  // Динамические границы фаз
  // Менструальная всегда около 5 дней
  // Лютеиновая всегда последние 14 дней перед месячными
  // Овуляторная 3 дня до лютеиновой
  const menstrualLength = 5;
  const lutealPhaseLength = 14; 
  const ovulatoryLength = 3;
  
  const lutealStart = cycleLength - lutealPhaseLength + 1;
  const ovulatoryStart = lutealStart - ovulatoryLength;

  let phase = 'follicular';

  if (dayOfCycle <= menstrualLength) {
    phase = 'menstrual';
  } else if (dayOfCycle >= ovulatoryStart && dayOfCycle < lutealStart) {
    phase = 'ovulatory';
  } else if (dayOfCycle >= lutealStart) {
    phase = 'luteal';
  } else {
    phase = 'follicular';
  }

  return { phase, day: dayOfCycle, nextPeriodIn };
}

/**
 * Возвращает калорийный модификатор и теги для фазы цикла.
 * @param {string} phase 
 * @returns {{kcalModifier: number, boostedTags: string[], info: string}}
 */
export function getPhaseModifiers(phase) {
  switch (phase) {
    case 'menstrual':
      return {
        kcalModifier: 0,
        boostedTags: ['iron', 'magnesium', 'comfort_food'],
        info: "Менструальная фаза: Рекомендуются блюда, богатые железом и магнием для восполнения потерь."
      };
    case 'follicular':
      return {
        kcalModifier: 0,
        boostedTags: ['protein', 'fiber'],
        info: "Фолликулярная фаза: Подходящее время для легких белков и активных тренировок."
      };
    case 'ovulatory':
      return {
        kcalModifier: 0,
        boostedTags: ['fiber', 'vegetables'],
        info: "Овуляторная фаза: Энергия максимальна, добавьте больше овощей и антиоксидантов."
      };
    case 'luteal':
      return {
        // Увеличение TDEE в лютеиновой фазе из-за базальной температуры
        kcalModifier: 150, 
        boostedTags: ['complex_carbs', 'comfort_food', 'magnesium'],
        info: "Лютеиновая фаза: Норма калорий увеличена на 150 ккал для поддержки энергии и баланса настроения."
      };
    default:
      return { kcalModifier: 0, boostedTags: [], info: "" };
  }
}
