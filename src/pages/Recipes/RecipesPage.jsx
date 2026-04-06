import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Clock, Flame, ChevronRight, Filter, X } from 'lucide-react';

import recipes from '../../data/recipes.json';
import './RecipesPage.css';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
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

export default function RecipesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [limitTime, setLimitTime] = useState(0);

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchQuery = 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.ingredients.some(ing => ing.name.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategory = activeCategory === 'all' || r.category === activeCategory;
      const matchTime = limitTime === 0 || r.cookTimeMin <= limitTime;

      return matchQuery && matchCategory && matchTime;
    });
  }, [searchQuery, activeCategory, limitTime]);

  return (
    <div className="recipes-page">
      <header className="recipes-header">
        <div className="recipes-header__info">
          <h1 className="recipes-header__title">База рецептов</h1>
          <p className="recipes-header__subtitle">
            Найдено {filteredRecipes.length} вкусных идей для вашего рациона
          </p>
        </div>
      </header>

      {/* Search & Filters */}
      <section className="recipes-controls">
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

        <div className="filters-row">
          <div className="filter-group">
            <span className="filter-group__label">Категория:</span>
            <div className="filter-tags">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat.id}
                  className={`filter-tag ${activeCategory === cat.id ? 'filter-tag--active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span className="filter-group__label">Время:</span>
            <div className="filter-tags">
              {TIME_FILTERS.map(tf => (
                <button 
                  key={tf.id}
                  className={`filter-tag ${limitTime === tf.id ? 'filter-tag--active' : ''}`}
                  onClick={() => setLimitTime(tf.id)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

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
    </div>
  );
}
