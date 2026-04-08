import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Flame, ChevronRight, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, Heart, ChevronDown, Plus } from 'lucide-react';
import { useFavoritesStore } from '../../store/useFavoritesStore';
import { usePlanStore } from '../../store/usePlanStore';

import recipes from '../../data/recipes.json';
import './RecipesPage.css';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'favs', label: '❤️ Избранное' },
  { id: 'breakfast', label: 'Завтраки' },
  { id: 'lunch', label: 'Обеды' },
  { id: 'dinner', label: 'Ужины' },
  { id: 'snack', label: 'Перекусы' },
];

const TIME_FILTERS = [
  { id: 0, label: 'Любое время' },
  { id: 15, label: 'До 15 мин' },
  { id: 30, label: 'До 30 мин' },
  { id: 60, label: 'До 60 мин' },
];

const SORT_OPTIONS = [
  { id: 'name', label: 'По названию' },
  { id: 'calories', label: 'По калориям' },
  { id: 'time', label: 'По времени' },
];

const DAY_NAMES_FULL = [
  'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
];

const MEAL_LABELS = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус 1',
  snack2: 'Перекус 2',
  snack3: 'Перекус 3',
  snack4: 'Перекус 4',
};

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [limitTime, setLimitTime] = useState(0);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [activeDropdown, setActiveDropdown] = useState(null); // 'category', 'time', 'sort'
  
  // States for adding to plan
  const [addingToPlan, setAddingToPlan] = useState(null); // recipe object
  const [targetDay, setTargetDay] = useState(0);
  const [targetMealType, setTargetMealType] = useState('breakfast');

  const { favorites, toggleFavorite } = useFavoritesStore();
  const { plan, replaceMeal } = usePlanStore();

  // Динамический список трапез на основе текущего плана
  const mealTypes = useMemo(() => {
    if (!plan || !plan[0]) return [];
    return Object.keys(plan[0].meals).map(id => ({
      id,
      label: MEAL_LABELS[id] || id
    }));
  }, [plan]);

  // Устанавливаем первую доступную трапезу при открытии модалки
  useEffect(() => {
    if (addingToPlan && mealTypes.length > 0) {
      setTargetMealType(mealTypes[0].id);
    }
  }, [addingToPlan, mealTypes]);

  const handleSortChange = (key) => {
    if (sortBy === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const filteredRecipes = useMemo(() => {
    let result = recipes.filter((r) => {
      const matchQuery = 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = activeCategory === 'all' || 
                           (activeCategory === 'favs' ? favorites.includes(r.id) : r.category === activeCategory);
      
      const matchTime = limitTime === 0 || r.cookTimeMin <= limitTime;

      return matchQuery && matchCategory && matchTime;
    });

    return result.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'calories') {
        valA = a.nutrition.calories;
        valB = b.nutrition.calories;
      } else if (sortBy === 'time') {
        valA = a.cookTimeMin;
        valB = b.cookTimeMin;
      }
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [searchQuery, activeCategory, limitTime, sortBy, sortOrder, favorites]);

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const onConfirmAdd = () => {
    if (!plan) return;
    
    // Формируем RecipeRef
    const recipeRef = {
      id: addingToPlan.id,
      name: addingToPlan.name,
      calories: addingToPlan.nutrition.calories,
      protein: addingToPlan.nutrition.protein,
      fat: addingToPlan.nutrition.fat,
      carbs: addingToPlan.nutrition.carbs,
      cookTimeMin: addingToPlan.cookTimeMin,
      imageEmoji: addingToPlan.imageEmoji,
      multiplier: 1 // По умолчанию
    };

    replaceMeal(targetDay, targetMealType, recipeRef);
    setAddingToPlan(null);
  };

  return (
    <div className="recipes-page">
      <header className="recipes-header">
        <div className="recipes-header__info">
          <h1 className="recipes-header__title">Рецепты</h1>
          <p className="recipes-header__subtitle">
            Найдено {filteredRecipes.length} вкусных идей для вашего рациона
          </p>
        </div>
      </header>

      {/* Toolbar: Search + Dropdown Filters */}
      <div className="recipes-toolbar">
        <div className="search-box">
          <Search className="search-box__icon" size={20} />
          <input 
            type="text" 
            placeholder="Поиск по названию или ингредиентам..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-box__input"
          />
          {searchQuery && (
            <button className="search-box__clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="recipes-filters">
          {/* Category Dropdown */}
          <div className="dropdown">
            <button 
              className={`dropdown__trigger ${activeCategory !== 'all' ? 'dropdown__trigger--active' : ''}`}
              onClick={() => toggleDropdown('category')}
            >
              <span>{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
              <ChevronDown size={14} className={`dropdown__arrow ${activeDropdown === 'category' ? 'dropdown__arrow--open' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'category' && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="dropdown__menu"
                >
                  {CATEGORIES.map(cat => (
                    <button 
                      key={cat.id}
                      className={`dropdown__item ${activeCategory === cat.id ? 'dropdown__item--active' : ''}`}
                      onClick={() => { setActiveCategory(cat.id); setActiveDropdown(null); }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Time Dropdown */}
          <div className="dropdown">
            <button 
              className={`dropdown__trigger ${limitTime !== 0 ? 'dropdown__trigger--active' : ''}`}
              onClick={() => toggleDropdown('time')}
            >
              <span>{TIME_FILTERS.find(t => t.id === limitTime)?.label}</span>
              <ChevronDown size={14} className={`dropdown__arrow ${activeDropdown === 'time' ? 'dropdown__arrow--open' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'time' && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="dropdown__menu"
                >
                  {TIME_FILTERS.map(tf => (
                    <button 
                      key={tf.id}
                      className={`dropdown__item ${limitTime === tf.id ? 'dropdown__item--active' : ''}`}
                      onClick={() => { setLimitTime(tf.id); setActiveDropdown(null); }}
                    >
                      {tf.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sort Dropdown */}
          <div className="dropdown">
            <button 
              className={`dropdown__trigger ${sortBy !== 'name' || sortOrder !== 'asc' ? 'dropdown__trigger--active' : ''}`}
              onClick={() => toggleDropdown('sort')}
            >
              <div className="dropdown__trigger-content">
                <span>{SORT_OPTIONS.find(o => o.id === sortBy)?.label}</span>
                <span className="sort-indicator">
                  {sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                </span>
              </div>
              <ChevronDown size={14} className={`dropdown__arrow ${activeDropdown === 'sort' ? 'dropdown__arrow--open' : ''}`} />
            </button>
            <AnimatePresence>
              {activeDropdown === 'sort' && (
                <motion.div 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="dropdown__menu"
                >
                  {SORT_OPTIONS.map(opt => (
                    <button 
                      key={opt.id}
                      className={`dropdown__item ${sortBy === opt.id ? 'dropdown__item--active' : ''}`}
                      onClick={() => { handleSortChange(opt.id); setActiveDropdown(null); }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="recipes-grid">
        <AnimatePresence mode="popLayout">
          {filteredRecipes.map((recipe, idx) => (
            <motion.div
              layout
              key={recipe.id}
              className="recipe-card-alt"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2, delay: idx * 0.02 }}
              onClick={() => navigate(`/app/meal/${recipe.id}`)}
            >
              <div className="recipe-card-alt__actions">
                <button 
                  className={`recipe-card-alt__action-btn ${favorites.includes(recipe.id) ? 'recipe-card-alt__action-btn--active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(recipe.id);
                  }}
                  title="В избранное"
                >
                  <Heart size={16} fill={favorites.includes(recipe.id) ? 'currentColor' : 'none'} />
                </button>

                <button 
                  className="recipe-card-alt__action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingToPlan(recipe);
                  }}
                  title="Добавить в рацион"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div className="recipe-card-alt__emoji">{recipe.imageEmoji}</div>
              <div className="recipe-card-alt__content">
                <div className="recipe-card-alt__cat">{CATEGORIES.find(c => c.id === recipe.category)?.label}</div>
                <h3 className="recipe-card-alt__name">{recipe.name}</h3>
                
                <div className="recipe-card-alt__meta">
                  <div className="recipe-card-alt__stat">
                    <Clock size={12} /> {recipe.cookTimeMin} мин
                  </div>
                  <div className="recipe-card-alt__stat">
                    <Flame size={12} /> {recipe.nutrition.calories} ккал
                  </div>
                </div>

                <div className="recipe-card-alt__footer">
                  <span className="recipe-card-alt__more">Посмотреть <ChevronRight size={14} /></span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredRecipes.length === 0 && (
          <div className="recipes-empty">
            <div className="recipes-empty__icon">🥣</div>
            <h3>Ничего не нашли</h3>
            <p>Попробуйте изменить параметры поиска или фильтры</p>
            <button className="btn-secondary" onClick={() => { setSearchQuery(''); setActiveCategory('all'); setLimitTime(0); }}>
              Сбросить всё
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {addingToPlan && (
          <div className="modal-overlay" onClick={() => setAddingToPlan(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="add-to-plan-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3 className="modal-title">Добавить в рацион</h3>
                  <p className="modal-recipe-name">{addingToPlan.name}</p>
                </div>
                <button className="modal-close" onClick={() => setAddingToPlan(null)}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                {!plan ? (
                  <div className="modal-error-box">
                    <p>План на неделю еще не создан. Пожалуйста, сгенерируйте его на главной странице.</p>
                    <button className="btn-modal-primary" onClick={() => navigate('/dashboard')}>
                      Перейти к Дашборду
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="modal-section">
                      <label className="modal-label">День недели:</label>
                      <div className="modal-grid-days">
                        {DAY_NAMES_FULL.map((name, idx) => (
                          <button 
                            key={idx}
                            className={`modal-grid-btn ${targetDay === idx ? 'active' : ''}`}
                            onClick={() => setTargetDay(idx)}
                          >
                            <span className="day-short">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][idx]}</span>
                            <span className="day-full">{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="modal-section">
                      <label className="modal-label">Прием пищи:</label>
                      <div className="modal-grid-meals">
                        {mealTypes.map((mt) => (
                          <button 
                            key={mt.id}
                            className={`modal-grid-btn ${targetMealType === mt.id ? 'active' : ''}`}
                            onClick={() => setTargetMealType(mt.id)}
                          >
                            {mt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button className="modal-submit-btn" onClick={onConfirmAdd}>
                      Добавить
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
