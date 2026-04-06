import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const VEG_FRUIT_GROUPS = [
  {
    title: '🥦 Капустные',
    items: [
      { value: 'cabbage', label: 'Белокочанная', emoji: '🥬' },
      { value: 'broccoli', label: 'Брокколи', emoji: '🥦' },
      { value: 'brussels-sprouts', label: 'Брюссельская', emoji: '🥬' },
      { value: 'cauliflower', label: 'Цветная', emoji: '🥦' },
    ]
  },
  {
    title: '🥕 Корнеплоды',
    items: [
      { value: 'potato', label: 'Картофель', emoji: '🥔' },
      { value: 'carrot', label: 'Морковь', emoji: '🥕' },
      { value: 'parsnip', label: 'Пастернак', emoji: '🥕' },
      { value: 'radish', label: 'Редис', emoji: '🟣' },
      { value: 'turnip', label: 'Репа', emoji: '🟡' },
      { value: 'beet', label: 'Свёкла', emoji: '🔴' },
    ]
  },
  {
    title: '🍑 Косточковые',
    items: [
      { value: 'apricot', label: 'Абрикос', emoji: '🍑' },
      { value: 'cherry', label: 'Вишня / Черешня', emoji: '🍒' },
      { value: 'peach', label: 'Персик', emoji: '🍑' },
      { value: 'plum', label: 'Слива', emoji: '🫐' },
    ]
  },
  {
    title: '🥬 Листовые',
    items: [
      { value: 'arugula', label: 'Руккола', emoji: '🌿' },
      { value: 'lettuce', label: 'Салат', emoji: '🥬' },
      { value: 'spinach', label: 'Шпинат', emoji: '🥬' },
    ]
  },
  {
    title: '🧅 Луковичные',
    items: [
      { value: 'onion', label: 'Лук', emoji: '🧅' },
      { value: 'leek', label: 'Лук-порей', emoji: '🧅' },
      { value: 'garlic', label: 'Чеснок', emoji: '🧄' },
    ]
  },
  {
    title: '🍆 Паслёновые',
    items: [
      { value: 'eggplant', label: 'Баклажан', emoji: '🍆' },
      { value: 'bell-pepper', label: 'Перец', emoji: '🫑' },
      { value: 'tomato', label: 'Помидор', emoji: '🍅' },
    ]
  },
  {
    title: '🍏 Семечковые',
    items: [
      { value: 'quince', label: 'Айва', emoji: '🍋' },
      { value: 'pear', label: 'Груша', emoji: '🍐' },
      { value: 'apple', label: 'Яблоко', emoji: '🍎' },
    ]
  },
  {
    title: '🎃 Тыквенные',
    items: [
      { value: 'zucchini', label: 'Кабачок', emoji: '💡' },
      { value: 'cucumber', label: 'Огурец', emoji: '🥒' },
      { value: 'pumpkin', label: 'Тыква', emoji: '🎃' },
    ]
  },
  {
    title: '🍊 Цитрусовые',
    items: [
      { value: 'orange', label: 'Апельсин', emoji: '🍊' },
      { value: 'grapefruit', label: 'Грейпфрут', emoji: '🍊' },
      { value: 'lemon', label: 'Лимон', emoji: '🍋' },
      { value: 'mandarin', label: 'Мандарин', emoji: '🍊' },
    ]
  },
  {
    title: '🍍 Экзотические',
    items: [
      { value: 'pineapple', label: 'Ананас', emoji: '🍍' },
      { value: 'banana', label: 'Банан', emoji: '🍌' },
      { value: 'kiwi', label: 'Киви', emoji: '🥝' },
      { value: 'mango', label: 'Манго', emoji: '🥭' },
      { value: 'papaya', label: 'Папайя', emoji: '🍈' },
    ]
  },
  {
    title: '🍓 Ягоды',
    items: [
      { value: 'strawberry', label: 'Клубника', emoji: '🍓' },
      { value: 'raspberry', label: 'Малина', emoji: '🔴' },
      { value: 'currant', label: 'Смородина', emoji: '🫐' },
      { value: 'blueberry', label: 'Черника', emoji: '🫐' },
    ]
  }
];

export default function VegStep({ form, update, onNext, onBack }) {
  const toggleItem = (val) => {
    const current = form.likedVeg || [];
    const next = current.includes(val)
      ? current.filter((c) => c !== val)
      : [...current, val];
    update({ likedVeg: next });
  };

  return (
    <>
      <h2 className="step__title">Овощи, фрукты и ягоды</h2>
      <p className="step__subtitle">
        Выбирайте любимые! Если отметить только помидоры и огурцы — меню будет состоять в основном из них.
      </p>

      {VEG_FRUIT_GROUPS.map((group) => (
        <div key={group.title} className="field" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: 'var(--text-1)' }}>{group.title}</h3>
          <div className="option-grid option-grid--4">
            {group.items.map(({ value, emoji, label }) => {
              const isSelected = (form.likedVeg || []).includes(value);
              return (
                <button
                  key={value}
                  className={`option-card ${isSelected ? 'option-card--selected' : ''}`}
                  onClick={() => toggleItem(value)}
                  type="button"
                >
                  <span className="option-card__emoji">{emoji}</span>
                  <div className="option-card__label">{label}</div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="onboarding__nav">
        <button className="onboarding__back" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Назад
        </button>
        <button className="btn-primary" onClick={onNext} type="button">
          Далее <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
