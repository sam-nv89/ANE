import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const VEG_FRUIT_GROUPS = [
  {
    title: '🥕 Овощи',
    items: [
      { value: 'eggplant', label: 'Баклажан', emoji: '🍆' },
      { value: 'cabbage', label: 'Белокочанная капуста', emoji: '🥬' },
      { value: 'broccoli', label: 'Брокколи', emoji: '🥦' },
      { value: 'brussels-sprouts', label: 'Брюссельская капуста', emoji: '🥬' },
      { value: 'zucchini', label: 'Кабачок', emoji: '💡' },
      { value: 'potato', label: 'Картофель', emoji: '🥔' },
      { value: 'onion', label: 'Лук', emoji: '🧅' },
      { value: 'leek', label: 'Лук-порей', emoji: '🧅' },
      { value: 'carrot', label: 'Морковь', emoji: '🥕' },
      { value: 'cucumber', label: 'Огурец', emoji: '🥒' },
      { value: 'parsnip', label: 'Пастернак', emoji: '🥕' },
      { value: 'bell-pepper', label: 'Перец', emoji: '🫑' },
      { value: 'tomato', label: 'Помидор', emoji: '🍅' },
      { value: 'radish', label: 'Редис', emoji: '🟣' },
      { value: 'turnip', label: 'Репа', emoji: '🟡' },
      { value: 'arugula', label: 'Руккола', emoji: '🌿' },
      { value: 'lettuce', label: 'Салат', emoji: '🥬' },
      { value: 'beet', label: 'Свёкла', emoji: '🔴' },
      { value: 'pumpkin', label: 'Тыква', emoji: '🎃' },
      { value: 'cauliflower', label: 'Цветная капуста', emoji: '🥦' },
      { value: 'garlic', label: 'Чеснок', emoji: '🧄' },
      { value: 'spinach', label: 'Шпинат', emoji: '🥬' },
    ]
  },
  {
    title: '🍎 Фрукты',
    items: [
      { value: 'apricot', label: 'Абрикос', emoji: '🍑' },
      { value: 'quince', label: 'Айва', emoji: '🍋' },
      { value: 'pineapple', label: 'Ананас', emoji: '🍍' },
      { value: 'orange', label: 'Апельсин', emoji: '🍊' },
      { value: 'banana', label: 'Банан', emoji: '🍌' },
      { value: 'cherry', label: 'Вишня / Черешня', emoji: '🍒' },
      { value: 'grapefruit', label: 'Грейпфрут', emoji: '🍊' },
      { value: 'pear', label: 'Груша', emoji: '🍐' },
      { value: 'kiwi', label: 'Киви', emoji: '🥝' },
      { value: 'lemon', label: 'Лимон', emoji: '🍋' },
      { value: 'mandarin', label: 'Мандарин', emoji: '🍊' },
      { value: 'mango', label: 'Манго', emoji: '🥭' },
      { value: 'papaya', label: 'Папайя', emoji: '🍈' },
      { value: 'peach', label: 'Персик', emoji: '🍑' },
      { value: 'plum', label: 'Слива', emoji: '🫐' },
      { value: 'apple', label: 'Яблоко', emoji: '🍎' },
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
  },
  {
    title: '🌰 Орехи, семена и сухофрукты',
    items: [
      { value: 'walnuts', label: 'Грецкий орех', emoji: '🧠' },
      { value: 'cashews', label: 'Кешью', emoji: '🥜' },
      { value: 'quinoa-veg', label: 'Киноа', emoji: '🥣' },
      { value: 'flax', label: 'Льняные семена', emoji: '🌾' },
      { value: 'almonds', label: 'Миндаль', emoji: '🌰' },
      { value: 'seeds', label: 'Семена/Семечки', emoji: '🌻' },
      { value: 'dried-fruits', label: 'Сухофрукты', emoji: '🧉' },
      { value: 'pistachios', label: 'Фисташки', emoji: '🥜' },
      { value: 'hazelnuts', label: 'Фундук', emoji: '🌰' },
      { value: 'chia', label: 'Чиа', emoji: '🥣' },
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

  const toggleGroup = (groupItems) => {
    const groupValues = groupItems.map(i => i.value);
    const current = form.likedVeg || [];
    const allSelected = groupValues.every(v => current.includes(v));

    if (allSelected) {
      // Remove all items of this group
      update({ likedVeg: current.filter(v => !groupValues.includes(v)) });
    } else {
      // Add missing items
      const next = [...new Set([...current, ...groupValues])];
      update({ likedVeg: next });
    }
  };

  return (
    <>
      <h2 className="step__title">Овощи, фрукты и ягоды</h2>
      <p className="step__subtitle">
        Выбирайте любимые! Если отметить только помидоры и огурцы — меню будет состоять в основном из них.
      </p>

      {VEG_FRUIT_GROUPS.map((group) => {
        const groupValues = group.items.map(i => i.value);
        const allInGroupSelected = groupValues.every(v => (form.likedVeg || []).includes(v));

        return (
          <div key={group.title} className="field" style={{ marginTop: 24 }}>
            <div className="step__header step__header--small">
              <h3 style={{ fontSize: '1.2rem', marginBottom: 0, color: 'var(--text-1)' }}>{group.title}</h3>
              <button 
                type="button" 
                className={`step__select-all ${allInGroupSelected ? 'step__select-all--active' : ''}`}
                onClick={() => toggleGroup(group.items)}
              >
                {allInGroupSelected ? 'Снять всё' : 'Выбрать всё'}
              </button>
            </div>
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
        );
      })}

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
