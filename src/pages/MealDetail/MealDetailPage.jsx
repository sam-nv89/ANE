import React, { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Flame, Dumbbell, Wheat, Droplets, ShoppingCart, Plus, Minus, Users } from 'lucide-react';

import { usePlanStore } from '../../store/usePlanStore';
import { useShoppingStore } from '../../store/useShoppingStore';
import recipes from '../../data/recipes.json';

import './MealDetailPage.css';

const ALLERGEN_LABELS = {
  gluten: 'Глютен', dairy: 'Лактоза', eggs: 'Яйца', nuts: 'Орехи',
  fish: 'Рыба', shellfish: 'Морепродукты', soy: 'Соя', sesame: 'Кунжут',
};

const CATEGORY_LABELS = {
  breakfast: 'Завтрак', lunch: 'Обед', dinner: 'Ужин', snack: 'Перекус',
};

export default function MealDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { multiplier: planMultiplier = 1 } = location.state || {};
  const [portions, setPortions] = React.useState(1);
  const totalMultiplier = planMultiplier * portions;
  const { plan } = usePlanStore();
  const { items, buildList } = useShoppingStore();

  const recipe = useMemo(() => recipes.find((r) => r.id === id), [id]);

  if (!recipe) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px', color: 'var(--clr-text-muted)' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Рецепт не найден</div>
        <button className="btn-secondary" onClick={() => navigate(-1)} style={{ marginTop: 20 }}>
          Вернуться назад
        </button>
      </div>
    );
  }

  const handleAddToShopping = () => {
    // Add only this recipe's ingredients to the shopping list
    const singleRecipeIngredients = {};
    recipe.ingredients.forEach((ing) => {
      singleRecipeIngredients[ing.id] = {
        id: ing.id, name: ing.name,
        totalAmount: ing.amount * totalMultiplier, unit: ing.unit,
        category: ing.category ?? 'other', checked: false,
      };
    });
    // Merge with existing items
    useShoppingStore.setState((state) => ({
      items: Object.keys(singleRecipeIngredients).reduce((acc, key) => {
        if (acc[key]) {
          acc[key] = { ...acc[key], totalAmount: acc[key].totalAmount + singleRecipeIngredients[key].totalAmount };
        } else {
          acc[key] = singleRecipeIngredients[key];
        }
        return acc;
      }, { ...state.items }),
    }));
    navigate('/app/shopping');
  };

  const calories = Math.round(recipe.nutrition.calories * totalMultiplier);
  const protein = Math.round(recipe.nutrition.protein * totalMultiplier);
  const fat = Math.round(recipe.nutrition.fat * totalMultiplier);
  const carbs = Math.round(recipe.nutrition.carbs * totalMultiplier);

  return (
    <div className="meal-detail">
      {/* Back */}
      <button className="meal-detail__back" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Назад
      </button>

      <motion.div
        className="meal-detail__card"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Hero */}
        <div className="meal-detail__hero">
          <div className="meal-detail__emoji">{recipe.imageEmoji}</div>
          <div className="meal-detail__hero-info">
            <div className="meal-detail__category">
              {CATEGORY_LABELS[recipe.category]}
            </div>
            <h1 className="meal-detail__title">{recipe.name}</h1>

            {/* Tags */}
            <div className="meal-detail__tags">
              <span className="meal-detail__tag">
                <Clock size={12} /> {recipe.cookTimeMin} мин
              </span>
              {recipe.tags?.includes('lazy') && (
                <span className="meal-detail__tag meal-detail__tag--green">Ленивый</span>
              )}
              {recipe.tags?.includes('batch-friendly') && (
                <span className="meal-detail__tag meal-detail__tag--blue">Batch-cook</span>
              )}
              {recipe.tags?.includes('high-protein') && (
                <span className="meal-detail__tag meal-detail__tag--purple">Высокий белок</span>
              )}
              {recipe.allergens?.length > 0 && recipe.allergens.map((a) => (
                <span key={a} className="meal-detail__tag meal-detail__tag--red">
                  ⚠️ {ALLERGEN_LABELS[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Nutrition table */}
        <div className="nutrition-table">
          {[
            { icon: Flame,    label: 'Калории', value: calories, unit: 'ккал', color: '#00f5a0' },
            { icon: Dumbbell, label: 'Белки',   value: protein,  unit: 'г',    color: '#00d4ff' },
            { icon: Droplets, label: 'Жиры',    value: fat,      unit: 'г',    color: '#f59e0b' },
            { icon: Wheat,    label: 'Углеводы',value: carbs,    unit: 'г',    color: '#a78bfa' },
          ].map(({ icon: Icon, label, value, unit, color }) => (
            <div key={label} className="nutrition-table__cell">
              <Icon size={18} color={color} />
              <div className="nutrition-table__value" style={{ color }}>
                {value}<span className="nutrition-table__unit">{unit}</span>
              </div>
              <div className="nutrition-table__label">{label}</div>
            </div>
          ))}
        </div>

        <div className="meal-detail__body">
          {/* Portions & Personalization */}
          <div className="portion-control">
            <div className="portion-control__info">
              <div className="portion-control__label">
                <Users size={16} /> Количество порций
              </div>
              <div className="portion-control__multiplier">
                {planMultiplier !== 1 && (
                  <span className="badge-personal">
                    🎯 Подстроено под ккал ({Math.round(planMultiplier * 100)}%)
                  </span>
                )}
              </div>
            </div>
            <div className="portion-selector">
              <button 
                className="portion-btn" 
                onClick={() => setPortions(Math.max(1, portions - 1))}
                disabled={portions <= 1}
              >
                <Minus size={16} />
              </button>
              <span className="portion-value">{portions}</span>
              <button 
                className="portion-btn" 
                onClick={() => setPortions(portions + 1)}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Ingredients */}
          <div className="meal-detail__section">
            <h2 className="meal-detail__section-title">Ингредиенты</h2>
            <ul className="ingredient-list">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="ingredient-list__item">
                  <span className="ingredient-list__name">{ing.name}</span>
                  <span className="ingredient-list__amount">
                    {Math.round(ing.amount * totalMultiplier * 10) / 10} {ing.unit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Steps */}
          <div className="meal-detail__section">
            <h2 className="meal-detail__section-title">Приготовление</h2>
            <ol className="steps-list">
              {recipe.steps.map((step, i) => (
                <li key={i} className="steps-list__item">
                  <span className="steps-list__num">{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* CTA */}
        <div className="meal-detail__footer">
          <button className="btn-primary" onClick={handleAddToShopping} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={16} /> Добавить в список покупок
          </button>
        </div>
      </motion.div>
    </div>
  );
}
