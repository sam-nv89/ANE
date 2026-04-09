import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, ArrowLeft, Sliders, Clock, Heart, 
  ShieldAlert, Sparkles, ChevronDown, Check, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useUserStore } from '../../store/useUserStore';
import { usePlanStore } from '../../store/usePlanStore';
import { generatePlan } from '../../lib/planner/generator';
import { calcBMR, calcTDEE, calcTargetCalories } from '../../lib/nutrition/tdee';
import { calcMacros } from '../../lib/nutrition/macros';
import recipes from '../../data/recipes.json';
import CustomSelect from '../../components/Common/CustomSelect';

import './SettingsPage.css';

/* ── Constants ── */

const MEAT_OPTIONS = [
  { value: 'lamb',    emoji: '🍖', label: 'Баранина' },
  { value: 'beef',    emoji: '🥩', label: 'Говядина' },
  { value: 'turkey',  emoji: '🦃', label: 'Индейка' },
  { value: 'chicken', emoji: '🍗', label: 'Курица' },
  { value: 'seafood', emoji: '🦐', label: 'Морепродукты' },
  { value: 'fish',    emoji: '🐟', label: 'Рыба' },
  { value: 'pork',    emoji: '🥓', label: 'Свинина' },
];

const DAIRY_OPTIONS = [
  { value: 'yogurt',         emoji: '🍶', label: 'Йогурт' },
  { value: 'kefir',          emoji: '🥛', label: 'Кефир' },
  { value: 'milk',           emoji: '🥛', label: 'Молоко' },
  { value: 'cheese',         emoji: '🧀', label: 'Сыр' },
  { value: 'cottage-cheese', emoji: '🥣', label: 'Творог' },
  { value: 'eggs',           emoji: '🥚', label: 'Яйца' },
];

const GRAINS_OPTIONS = [
  { value: 'pea',       emoji: '🟢', label: 'Горох' },
  { value: 'buckwheat', emoji: '🤎', label: 'Гречневая крупа' },
  { value: 'quinoa',    emoji: '🌿', label: 'Киноа/Амарант' },
  { value: 'corn',      emoji: '🌽', label: 'Кукурузная' },
  { value: 'pasta',     emoji: '🍝', label: 'Макароны/Паста' },
  { value: 'wheat',     emoji: '🌾', label: 'Манка/Булгур/Кускус' },
  { value: 'chickpea',  emoji: '🟤', label: 'Нут' },
  { value: 'oats',      emoji: '🥣', label: 'Овсянка/Геркулес' },
  { value: 'barley',    emoji: '🌾', label: 'Перловка/Ячневая' },
  { value: 'millet',    emoji: '🟡', label: 'Пшенная крупа' },
  { value: 'rice',      emoji: '🍚', label: 'Рис (белый, бурый)' },
  { value: 'beans',     emoji: '🫘', label: 'Фасоль' },
  { value: 'bread',     emoji: '🍞', label: 'Хлеб/Лаваш' },
  { value: 'lentil',    emoji: '🧆', label: 'Чечевица' },
];

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
    title: '🌰 Орехи и семена',
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

const ALLERGENS = [
  { id: 'gluten',      label: 'Глютен',       emoji: '🌾' },
  { id: 'dairy',       label: 'Лактоза',      emoji: '🥛' },
  { id: 'eggs',        label: 'Яйца',         emoji: '🥚' },
  { id: 'nuts',        label: 'Орехи',        emoji: '🥜' },
  { id: 'fish',        label: 'Рыба',         emoji: '🐟' },
  { id: 'shellfish',   label: 'Морепрод.',    emoji: '🦐' },
  { id: 'soy',         label: 'Соя',          emoji: '🫘' },
  { id: 'sesame',      label: 'Кунжут',       emoji: '🌰' },
];

const MEDICAL = [
  { id: 'diabetes2',  label: 'Диабет 2 типа' },
  { id: 'hypertension', label: 'Гипертония' },
  { id: 'low-salt',   label: 'Без соли' },
  { id: 'low-fat',    label: 'Низкожировое' },
  { id: 'ibs',        label: 'СРК / Чувств. ЖКТ' },
];

const DIETARY = [
  { id: 'vegetarian', label: '🥗 Вегетарианство' },
  { id: 'vegan',      label: '🌱 Веганство' },
  { id: 'keto',       label: '🥓 Кето' },
  { id: 'fasting',    label: '⏰ Интерв. голодание' },
  { id: 'halal',      label: '☪️ Халяль' },
  { id: 'kosher',     label: '✡️ Кошер' },
];

const FREQUENCIES = [3, 4, 5, 6, 7];

const MEAL_PREFS = [
  { id: 'no-breakfast',    label: 'Без завтрака' },
  { id: 'heavy-breakfast', label: 'Плотный завтрак' },
  { id: 'light-dinner',    label: 'Облегченный ужин' },
  { id: 'no-dinner',       label: 'Без ужина' },
];

const COOK_TIME_OPTIONS = [
  { value: 15, label: 'До 15 мин' },
  { value: 30, label: 'До 30 мин' },
  { value: 60, label: 'До 60 мин' },
  { value: 120, label: 'Любое время' },
];

const COOK_FREQ_OPTIONS = [
  { value: 'daily', label: 'Каждый день' },
  { value: 'alternate', label: 'Через день' },
  { value: 'few', label: 'Пару раз в неделю' },
];

const SUGARY_FREQ = [
  { value: 'few',   label: '1–2 раза/нед' },
  { value: 'often', label: '3–4 раза/нед' },
  { value: 'daily', label: 'Каждый день' },
];

/* ── Components ── */

function Toggle({ value, onChange, title, desc }) {
  return (
    <button type="button" className="toggle-row" onClick={() => onChange(!value)} aria-pressed={value}>
      <div className="toggle-row__text">
        <div className="toggle-row__title">{title}</div>
        <div className="toggle-row__desc">{desc}</div>
      </div>
      <div className={`stg-toggle ${value ? 'stg-toggle--on' : ''}`}>
        <div className="stg-toggle__knob" />
      </div>
    </button>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className={`stg-section ${isOpen ? 'stg-section--open' : ''}`}>
      <button className="stg-section__header" onClick={() => setIsOpen(!isOpen)}>
        <div className="stg-section__title">
          {Icon && <Icon size={18} className="stg-section__icon" />}
          <span>{title}</span>
        </div>
        <ChevronDown size={18} className={`stg-section__arrow ${isOpen ? 'stg-section__arrow--open' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="stg-section__content"
          >
            <div className="stg-section__inner">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SettingsPage() {
  const { profile, updateProfile, setNutrition } = useUserStore();
  const { setPlan, setLoading } = usePlanStore();

  const [local, setLocal] = useState({ ...profile });
  const [saved, setSaved] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const update = (patch) => setLocal((p) => ({ ...p, ...patch }));

  const toggleArray = (field, val) => {
    const current = local[field] || [];
    const next = current.includes(val)
      ? current.filter((c) => c !== val)
      : [...current, val];
    update({ [field]: next });
  };

  const handleSave = () => {
    setLoading(true);
    
    // 1. Update user profile/nutrition
    const bmr = calcBMR(local.weightKg, local.heightCm, local.age, local.gender);
    const tdee = calcTDEE(bmr, local.activityLevel);
    const targetCalories = calcTargetCalories(tdee, local.goal, local.goalRate ?? -0.5);
    const macros = calcMacros(targetCalories, local.weightKg, local.goal);
    const newNutrition = { bmr, tdee, targetCalories, ...macros };

    updateProfile(local);
    setNutrition(newNutrition);

    // 2. Regenerate plan
    setTimeout(() => {
      const newPlan = generatePlan(recipes, local, newNutrition);
      setPlan(newPlan);
      setLoading(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 800);
  };

  if (!profile) return null;

  return (
    <div className="settings">
      <header className="settings__header">
        <div>
          <h1 className="settings__title">Настройки</h1>
          <p className="settings__subtitle">Управляйте параметрами генерации вашего рациона.</p>
        </div>
      </header>

      <div className="settings__grid">
        <div className="settings__main">
          {/* Режим и расписание */}
          <Section title="Режим и расписание" icon={Clock}>
             <div className="stg-field">
                <label className="stg-label">Количество приёмов пищи</label>
                <div className="tag-grid">
                  {FREQUENCIES.map((freq) => (
                    <button
                      key={freq}
                      className={`stg-tag ${local.mealFrequency === freq ? 'stg-tag--selected' : ''}`}
                      onClick={() => update({ mealFrequency: freq })}
                    >
                      {freq} {freq <= 4 ? 'приёма' : 'приёмов'}
                    </button>
                  ))}
                </div>
             </div>

             <div className="stg-field">
                <label className="stg-label">Особенности приёмов</label>
                <div className="tag-grid">
                  {MEAL_PREFS.map(({ id, label }) => (
                    <button
                      key={id}
                      className={`stg-tag ${local.mealSpecifics?.includes(id) ? 'stg-tag--selected' : ''}`}
                      onClick={() => toggleArray('mealSpecifics', id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
             </div>
          </Section>

          {/* Приготовление */}
          <Section title="Приготовление" icon={Sparkles}>
            <div className="stg-row">
              <div className="stg-field">
                <label className="stg-label">Время на готовку</label>
                <div className="tag-grid">
                  {COOK_TIME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`stg-tag ${local.cookTimeWindows?.includes(opt.value) ? 'stg-tag--selected' : ''}`}
                      onClick={() => toggleArray('cookTimeWindows', opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="stg-field">
              <label className="stg-label">Частота готовки</label>
              <div className="tag-grid">
                {COOK_FREQ_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    className={`stg-tag ${local.cookFrequency === opt.value ? 'stg-tag--selected' : ''}`}
                    onClick={() => update({ cookFrequency: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <Toggle 
              value={local.preferLazy} 
              onChange={(v) => update({ preferLazy: v })}
              title="Ленивые блюда"
              desc="Предпочитать рецепты с минимумом действий"
            />
          </Section>

          {/* Вкусовые предпочтения */}
          <Section title="Вкусовые предпочтения" icon={Heart}>
             <div className="stg-subset">
                <div className="stg-subset__header">
                  <span>Мясо, птица, рыба</span>
                  <button 
                    className="stg-link-btn"
                    onClick={() => {
                      const all = MEAT_OPTIONS.map(o => o.value);
                      const isAll = all.every(v => local.likedProteins?.includes(v));
                      update({ likedProteins: isAll ? [] : all });
                    }}
                  >
                    {MEAT_OPTIONS.map(o => o.value).every(v => local.likedProteins?.includes(v)) ? 'Снять всё' : 'Выбрать всё'}
                  </button>
                </div>
                <div className="option-grid option-grid--4">
                  {MEAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`option-card option-card--small ${local.likedProteins?.includes(opt.value) ? 'option-card--selected' : ''}`}
                      onClick={() => toggleArray('likedProteins', opt.value)}
                    >
                      <span className="option-card__emoji">{opt.emoji}</span>
                      <div className="option-card__label">{opt.label}</div>
                    </button>
                  ))}
                </div>
             </div>

             <div className="stg-subset" style={{ marginTop: 24 }}>
                <div className="stg-subset__header">
                  <span>Молочные продукты</span>
                  <button 
                    className="stg-link-btn"
                    onClick={() => {
                      const all = DAIRY_OPTIONS.map(o => o.value);
                      const isAll = all.every(v => local.likedDairy?.includes(v));
                      update({ likedDairy: isAll ? [] : all });
                    }}
                  >
                    {DAIRY_OPTIONS.map(o => o.value).every(v => local.likedDairy?.includes(v)) ? 'Снять всё' : 'Выбрать всё'}
                  </button>
                </div>
                <div className="option-grid option-grid--4">
                  {DAIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`option-card option-card--small ${local.likedDairy?.includes(opt.value) ? 'option-card--selected' : ''}`}
                      onClick={() => toggleArray('likedDairy', opt.value)}
                    >
                      <span className="option-card__emoji">{opt.emoji}</span>
                      <div className="option-card__label">{opt.label}</div>
                    </button>
                  ))}
                </div>
             </div>

             <div className="stg-subset" style={{ marginTop: 24 }}>
                <div className="stg-subset__header">
                  <span>Макароны и крупы</span>
                  <button 
                    className="stg-link-btn"
                    onClick={() => {
                      const all = GRAINS_OPTIONS.map(o => o.value);
                      const isAll = all.every(v => local.likedGrains?.includes(v));
                      update({ likedGrains: isAll ? [] : all });
                    }}
                  >
                    {GRAINS_OPTIONS.map(o => o.value).every(v => local.likedGrains?.includes(v)) ? 'Снять всё' : 'Выбрать всё'}
                  </button>
                </div>
                <div className="option-grid option-grid--4">
                  {GRAINS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`option-card option-card--small ${local.likedGrains?.includes(opt.value) ? 'option-card--selected' : ''}`}
                      onClick={() => toggleArray('likedGrains', opt.value)}
                    >
                      <span className="option-card__emoji">{opt.emoji}</span>
                      <div className="option-card__label">{opt.label}</div>
                    </button>
                  ))}
                </div>
             </div>

             {VEG_FRUIT_GROUPS.map(group => (
               <div key={group.title} className="stg-subset" style={{ marginTop: 24 }}>
                  <div className="stg-subset__header">
                    <span>{group.title}</span>
                    <button 
                      className="stg-link-btn"
                      onClick={() => {
                        const groupVals = group.items.map(o => o.value);
                        const current = local.likedVeg || [];
                        const isAll = groupVals.every(v => current.includes(v));
                        if (isAll) {
                          update({ likedVeg: current.filter(v => !groupVals.includes(v)) });
                        } else {
                          update({ likedVeg: [...new Set([...current, ...groupVals])] });
                        }
                      }}
                    >
                      {group.items.map(o => o.value).every(v => local.likedVeg?.includes(v)) ? 'Снять всё' : 'Выбрать всё'}
                    </button>
                  </div>
                  <div className="option-grid option-grid--4">
                    {group.items.map((opt) => (
                      <button
                        key={opt.value}
                        className={`option-card option-card--small ${local.likedVeg?.includes(opt.value) ? 'option-card--selected' : ''}`}
                        onClick={() => toggleArray('likedVeg', opt.value)}
                      >
                        <span className="option-card__emoji">{opt.emoji}</span>
                        <div className="option-card__label">{opt.label}</div>
                      </button>
                    ))}
                  </div>
               </div>
             ))}
          </Section>

          {/* Ограничения */}
          <Section title="Ограничения и исключения" icon={ShieldAlert}>
            <div className="stg-field">
              <label className="stg-label">Аллергены</label>
              <div className="option-grid option-grid--2">
                {ALLERGENS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`option-card option-card--slim ${local.allergens?.includes(opt.id) ? 'option-card--selected' : ''}`}
                    onClick={() => toggleArray('allergens', opt.id)}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="stg-field">
              <label className="stg-label">Дополнительные исключения (тэги)</label>
              <div className="stg-tag-input">
                <input 
                  type="text" 
                  className="stg-input"
                  placeholder="Введите продукт и нажмите Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const val = tagInput.trim();
                      if (val && !local.dislikedFreeText?.includes(val)) {
                        update({ dislikedFreeText: [...(local.dislikedFreeText || []), val] });
                      }
                      setTagInput('');
                    }
                  }}
                />
              </div>
              {local.dislikedFreeText?.length > 0 && (
                <div className="tag-grid" style={{ marginTop: 12 }}>
                   {local.dislikedFreeText.map(tag => (
                     <span key={tag} className="stg-tag stg-tag--selected stg-tag--deletable">
                        {tag}
                        <button onClick={() => update({ dislikedFreeText: local.dislikedFreeText.filter(t => t !== tag) })}>
                          <X size={14} />
                        </button>
                     </span>
                   ))}
                </div>
              )}
            </div>

            <div className="stg-field">
              <label className="stg-label">Медицинские ограничения</label>
              <div className="tag-grid">
                {MEDICAL.map((opt) => (
                  <button
                    key={opt.id}
                    className={`stg-tag ${local.medicalRestrictions?.includes(opt.id) ? 'stg-tag--selected' : ''}`}
                    onClick={() => toggleArray('medicalRestrictions', opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="stg-field">
              <label className="stg-label">Диетический стиль</label>
              <div className="tag-grid">
                {DIETARY.map((opt) => (
                  <button
                    key={opt.id}
                    className={`stg-tag ${local.dietaryStyles?.includes(opt.id) ? 'stg-tag--selected' : ''}`}
                    onClick={() => toggleArray('dietaryStyles', opt.id)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Привычки */}
          <Section title="Пищевые привычки" icon={Sparkles}>
            <Toggle 
              value={local.includeSugary}
              onChange={(v) => update({ includeSugary: v })}
              title="Включать сладкое"
              desc="Добавлять десерты в рацион"
            />
            {local.includeSugary && (
              <div className="stg-field stg-field--indent">
                <label className="stg-label">Как часто?</label>
                <div className="tag-grid">
                  {SUGARY_FREQ.map((opt) => (
                    <button
                      key={opt.value}
                      className={`stg-tag ${local.sugaryFrequency === opt.value ? 'stg-tag--selected' : ''}`}
                      onClick={() => update({ sugaryFrequency: opt.value })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <Toggle 
                value={local.allowRepeatMeals}
                onChange={(v) => update({ allowRepeatMeals: v })}
                title="Повторять блюда"
                desc="Разрешить использование одного блюда несколько раз в неделю"
              />
            </div>
          </Section>
      </div>
      </div>
      
      <div className="settings__footer">
        <button 
          className="btn-primary btn-primary--large settings__save-btn"
          onClick={handleSave}
        >
          <Save size={18} />
          {saved ? '✅ Сохранено!' : 'Сохранить и обновить'}
        </button>
      </div>
    </div>
  );
}
