import React, { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, Trash2, RefreshCw, Printer, Download, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
  const listRef = React.useRef(null);
  const [isExporting, setIsExporting] = React.useState(false);

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const text = Object.entries(CATEGORY_CONFIG)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([cat, config]) => {
        const catItems = Object.values(items).filter(i => (i.category || 'other') === cat);
        if (catItems.length === 0) return '';
        return `--- ${config.label} ---\n` + catItems.map(i => `${i.checked ? '[x]' : '[ ]'} ${i.name}: ${i.totalAmount} ${i.unit}`).join('\n');
      })
      .filter(Boolean)
      .join('\n\n');
    
    const blob = new Blob([`СПИСОК ПОКУПОК\n\n${text}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
  };

  const handleExportPDF = async () => {
    if (!listRef.current) return;
    setIsExporting(true);
    
    // Give a small delay for CSS to apply light-mode if needed
    // (We'll use a data-attribute on body to force light print styles in html2canvas)
    document.body.setAttribute('data-print-mode', 'true');
    
    try {
      const canvas = await html2canvas(listRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff', // Force white bg in PDF
        logging: false,
        onclone: (clonedDoc) => {
          // Hide buttons and controls in the clone before capturing
          const actions = clonedDoc.querySelector('.shopping__actions');
          const checkboxes = clonedDoc.querySelectorAll('.shopping__checkbox');
          if (actions) actions.style.display = 'none';
          // Make text black and clear
          clonedDoc.querySelectorAll('.shopping__item-name').forEach(el => el.style.color = '#000');
          clonedDoc.querySelectorAll('.shopping__group-header').forEach(el => el.style.color = '#000');
          clonedDoc.querySelectorAll('.shopping__title').forEach(el => el.style.color = '#000');
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('shopping-list.pdf');
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      document.body.removeAttribute('data-print-mode');
      setIsExporting(false);
    }
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
    <div className="shopping" ref={listRef} data-is-exporting={isExporting}>
      {/* Header */}
      <div className="shopping__header">
        <div>
          <h1 className="shopping__title">Список покупок</h1>
          <p className="shopping__subtitle">
            {checkedCount} из {totalCount} · Zero Waste объединение
          </p>
        </div>
        <div className="shopping__actions">
          <button 
            className="btn-secondary" 
            onClick={handleExportPDF} 
            disabled={isExporting} 
            title="Экспорт в PDF"
            style={{ position: 'relative' }}
          >
            <FileText size={14} /> {isExporting ? '...' : 'PDF'}
          </button>
          <button className="btn-secondary" onClick={handleDownload} title="Скачать список">
            <Download size={14} /> Скачать
          </button>
          <button className="btn-secondary" onClick={handlePrint} title="Печать">
            <Printer size={14} /> Печать
          </button>
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
