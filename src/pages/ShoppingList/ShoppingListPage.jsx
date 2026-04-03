import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Trash2, RefreshCw } from 'lucide-react';

import { usePlanStore } from '../../store/usePlanStore';
import { useShoppingStore } from '../../store/useShoppingStore';
import recipes from '../../data/recipes.json';

import './ShoppingListPage.css';

const CATEGORY_CONFIG = {
  protein:    { label: '🥩 Белковые', order: 1 },
  dairy:      { label: '🥛 Молочное',  order: 2 },
  vegetables: { label: '🥦 Овощи и фрукты', order: 3 },
  grains:     { label: '🌾 Крупы и злаки', order: 4 },
  other:      { label: '🧂 Прочее',    order: 5 },
};

export default function ShoppingListPage() {
  const { plan } = usePlanStore();
  const { items, buildList, toggleItem, clearList } = useShoppingStore();

  // Auto-build from plan if items empty
  useEffect(() => {
    if (plan && Object.keys(items).length === 0) {
      buildList(plan, recipes);
    }
  }, [plan]);

  const grouped = useMemo(() => {
    const groups = {};
    Object.values(items).forEach((item) => {
      const cat = item.category ?? 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    // Sort by config order
    return Object.entries(groups).sort(([a], [b]) => {
      return (CATEGORY_CONFIG[a]?.order ?? 99) - (CATEGORY_CONFIG[b]?.order ?? 99);
    });
  }, [items]);

  const checkedCount = Object.values(items).filter((i) => i.checked).length;
  const totalCount = Object.values(items).length;

  const handleRebuild = () => {
    if (plan) buildList(plan, recipes);
  };

  if (totalCount === 0) {
    return (
      <div className="shopping">
        <div className="shopping__empty">
          <div className="shopping__empty-emoji">🛒</div>
          <div className="shopping__empty-title">Список покупок пуст</div>
          <p className="shopping__empty-sub">
            Сначала создайте рацион на дашборде — список сформируется автоматически.
          </p>
          <button className="btn-primary" onClick={handleRebuild} disabled={!plan}>
            <RefreshCw size={14} /> Сформировать из рациона
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shopping">
      {/* Header */}
      <div className="shopping__header">
        <div>
          <h1 className="shopping__title">Список покупок</h1>
          <p className="shopping__subtitle">
            {checkedCount} из {totalCount} · Zero Waste объединение
          </p>
        </div>
        <div className="shopping__actions">
          <button className="btn-secondary" onClick={handleRebuild} style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={14} /> Обновить
          </button>
          <button
            className="btn-secondary"
            onClick={clearList}
            style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#fc8181' }}
          >
            <Trash2 size={14} /> Очистить
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="shopping__progress-bar" aria-label={`Куплено ${checkedCount} из ${totalCount}`}>
        <div
          className="shopping__progress-fill"
          style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
        />
      </div>

      {/* Groups */}
      <div className="shopping__groups">
        {grouped.map(([category, categoryItems], gi) => (
          <motion.div
            key={category}
            className="shopping__group"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.07 }}
          >
            <div className="shopping__group-header">
              {CATEGORY_CONFIG[category]?.label ?? category}
            </div>
            <div className="shopping__items">
              {categoryItems.map((item) => (
                <button
                  key={item.id}
                  className={`shopping__item ${item.checked ? 'shopping__item--checked' : ''}`}
                  onClick={() => toggleItem(item.id)}
                  type="button"
                >
                  <div className={`shopping__checkbox ${item.checked ? 'shopping__checkbox--checked' : ''}`}>
                    {item.checked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <span className="shopping__item-name">{item.name}</span>
                  <span className="shopping__item-amount">
                    {item.totalAmount % 1 === 0 ? item.totalAmount : item.totalAmount.toFixed(1)} {item.unit}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {checkedCount === totalCount && totalCount > 0 && (
        <motion.div
          className="shopping__done-banner"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          ✅ Все продукты куплены! Можно приступать к готовке.
        </motion.div>
      )}
    </div>
  );
}
