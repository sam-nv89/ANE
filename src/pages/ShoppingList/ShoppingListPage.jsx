import React, { useEffect, useMemo } from 'react';
import { ShoppingCart, Check, Trash2, RefreshCw, Printer, Download, FileText, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { useUserStore } from '../../store/useUserStore';
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
  const { profile } = useUserStore();
  const listRef = React.useRef(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Auto-build from plan if items empty
  useEffect(() => {
    if (plan && Object.keys(items).length === 0) {
      buildList(plan, recipes);
    }
  }, [plan, buildList, items]);

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

  const getPeriodString = () => {
    const today = new Date().getDay();
    const todayIndex = (today + 6) % 7;
    const start = new Date();
    start.setDate(start.getDate() - todayIndex);
    const end = new Date();
    end.setDate(end.getDate() + (6 - todayIndex));

    const fmt = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `${fmt(start)}-${fmt(end)}`;
  };

  const handleDownload = () => {
    const period = getPeriodString();
    const text = Object.entries(CATEGORY_CONFIG)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([cat, config]) => {
        const catItems = Object.values(items).filter(i => (i.category || 'other') === cat);
        if (catItems.length === 0) return '';
        return `--- ${config.label} ---\n` + catItems.map(i => `${i.checked ? '[x]' : '[ ]'} ${i.name}: ${i.displayAmount} ${i.unit}`).join('\n');
      })
      .filter(Boolean)
      .join('\n\n');
    
    const content = `\ufeffСПИСОК ПОКУПОК (${period})\n\n${text}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopping-list_${period}.txt`;
    a.click();
  };

  const handleExportPDF = async () => {
    const element = document.getElementById('shopping-list-pdf-template');
    if (!element) return;
    setIsExporting(true);
    const period = getPeriodString();
    
    try {
      // PURE ISOLATION LOGIC: Captures the off-screen element without touching document body or state
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1050,
        scrollX: 0,
        scrollY: 0,
        onclone: (clonedDoc) => {
          const cloneElement = clonedDoc.getElementById('shopping-list-pdf-template');
          if (cloneElement) {
            cloneElement.classList.add('is-active'); // Enable via class for capture
            cloneElement.style.position = 'static'; // Reset for capture
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const ratio = Math.min(pdfWidth / imgProps.width, pdfHeight / imgProps.height);
      const width = imgProps.width * ratio;
      const height = imgProps.height * ratio;
      const x = (pdfWidth - width) / 2;
      
      pdf.addImage(imgData, 'PNG', x, 5, width, height);
      pdf.save(`shopping-list_${period}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Ошибка при создании PDF.');
    } finally {
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
    <div className="shopping" ref={listRef}>
      {/* Header */}
      <div className="shopping__header">
        <div>
          <h1 className="shopping__title">Список покупок</h1>
          <p className="shopping__subtitle">
            {checkedCount} из {totalCount}
          </p>
        </div>
        <div className="shopping__actions">
          <div className="download-dropdown">
            <button 
              className={`btn-secondary ${isMenuOpen ? 'btn-secondary--active' : ''}`} 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              disabled={isExporting}
              title="Выбрать формат скачивания"
            >
              <Download size={14} /> Скачать <ChevronDown size={12} style={{ transition: '0.2s', transform: isMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  className="download-dropdown__menu"
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                  <button className="download-dropdown__item" onClick={() => { handleExportPDF(); setIsMenuOpen(false); }}>
                    <div className="download-dropdown__item-icon" style={{ color: '#ff4d4d' }}><FileText size={16} /></div>
                    <div className="download-dropdown__item-content">
                      <div className="download-dropdown__item-label">Список в PDF</div>
                    </div>
                  </button>
                  <button className="download-dropdown__item" onClick={() => { handleDownload(); setIsMenuOpen(false); }}>
                    <div className="download-dropdown__item-icon" style={{ color: '#4dabf7' }}><FileText size={16} /></div>
                    <div className="download-dropdown__item-content">
                      <div className="download-dropdown__item-label">Список в TXT</div>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
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
                    {item.displayAmount} {item.unit}
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
      {/* Isolated Static PDF Template (rendered off-screen to avoid shifts) */}
      <div id="shopping-list-pdf-template" className="shopping-list-pdf-template">
          <div className="shopping-list-pdf-template__header">
            <div className="shopping-list-pdf-template__header-bar" />
            <h1 className="shopping-list-pdf-template__title">СПИСОК ПОКУПОК НА НЕДЕЛЮ</h1>
            <div className="shopping-list-pdf-template__meta">
              <span>{profile?.name || 'Пользователь'}</span>
              <span className="dot">•</span>
              <span>{getPeriodString()}</span>
            </div>
          </div>

          <div className="shopping-list-pdf-template__grid">
            {grouped.map(([category, categoryItems]) => (
              <div key={category} className="pdf-shop-group">
                <div className="pdf-shop-group__header">
                  {CATEGORY_CONFIG[category]?.label ?? category}
                </div>
                <div className="pdf-shop-group__items">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="pdf-shop-item">
                      <div className="pdf-shop-item__box" />
                      <span className="pdf-shop-item__name">{item.name}</span>
                      <div className="pdf-shop-item__spacer" />
                      <span className="pdf-shop-item__amount">
                        {item.totalAmount % 1 === 0 ? item.totalAmount : item.totalAmount.toFixed(1)} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
  );
}
