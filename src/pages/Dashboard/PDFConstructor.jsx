import React from 'react';
import Moveable from 'react-moveable';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { X, Download, RotateCcw, Layout } from 'lucide-react';
import { usePDFLayoutStore } from '../../store/usePDFLayoutStore';
import { usePlanStore } from '../../store/usePlanStore';
import { useUserStore } from '../../store/useUserStore';
import './PDFConstructor.css';

/**
 * Isolated Day Card Component for stable rendering and ref management.
 * Using React.memo to prevent unnecessary re-renders in concurrent mode.
 */
const DayCard = React.memo(({ day, index, layout, onSelect, registerRef, fmtNum, MEAL_LABELS, dateStr }) => {
  const totalCals = React.useMemo(() => {
    const mealCals = Object.values(day.meals).reduce((acc, m) => acc + (m?.calories || 0), 0);
    const customCals = day.customMeals ? day.customMeals.reduce((acc, m) => acc + (m?.calories || 0), 0) : 0;
    return mealCals + customCals;
  }, [day.meals, day.customMeals]);

  return (
    <div 
      id={`day-${index}`}
      className="pdf-constructor__item"
      ref={el => registerRef(`day-${index}`, el)}
      style={{ 
        left: layout?.x ?? (60 + (index < 4 ? 0 : 450)),
        top: layout?.y ?? (280 + (index < 4 ? index : index - 4) * 240),
        width: layout?.width || 420,
        height: layout?.height || 'auto'
      }}
      onMouseDown={(e) => { 
        e.stopPropagation(); 
        onSelect(`day-${index}`);
      }}
    >
      <div className="pdf-day-card">
        <div className="pdf-day-card__header">
          <div className="pdf-day-card__title">
            <span className="pdf-day-card__label">{day.dayLabel}</span>
            <span className="pdf-day-card__date">{dateStr}</span>
          </div>
          <div className="pdf-day-card__total">{fmtNum(totalCals)} ккал</div>
        </div>
        <div className="pdf-day-card__meals">
          {Object.keys(day.meals).map(type => {
            const m = day.meals[type];
            if (!m) return null;
            return (
              <div key={type} className="pdf-meal-item">
                <div className="pdf-meal-item__meta">
                  <span className="pdf-meal-item__type">{MEAL_LABELS[type]}</span>
                </div>
                <div className="pdf-meal-item__content">
                  <span className="pdf-meal-item__name">{m.name}</span>
                  <span className="pdf-meal-item__cals">{fmtNum(m.calories)} ккал</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default function PDFConstructor({ onClose, getPeriodString, fmtNum, MEAL_LABELS }) {
  const { plan } = usePlanStore();
  const { nutrition } = useUserStore();
  const { layouts, updateLayout, setLayouts, resetLayouts } = usePDFLayoutStore();
  
  const canvasRef = React.useRef(null);
  const elementsRef = React.useRef({});
  const [selectedId, setSelectedId] = React.useState(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [targets, setTargets] = React.useState([]);
  const [isHydrated, setIsHydrated] = React.useState(false);

  // Sync hydration state from store manually to React state
  React.useEffect(() => {
    const checkHydration = () => {
      if (usePDFLayoutStore.persist.hasHydrated()) {
        setIsHydrated(true);
      }
    };
    
    const unsub = usePDFLayoutStore.persist.onFinishHydration(() => setIsHydrated(true));
    checkHydration();
    return () => unsub();
  }, []);

  // Registry for child refs (stable function for use in sub-components)
  const registerRef = React.useCallback((id, el) => {
    if (el) elementsRef.current[id] = el;
  }, []);

  // Initial Layout calculation - Atomic and Unconditional
  React.useEffect(() => {
    if (!isHydrated || !plan || plan.length === 0) return;

    let hasChanges = false;
    const newLayouts = { ...layouts };

    // Default positioning for persistent blocks
    if (!newLayouts['branding']) { newLayouts['branding'] = { x: 60, y: 60, width: 880 }; hasChanges = true; }
    if (!newLayouts['info']) { newLayouts['info'] = { x: 60, y: 150, width: 880 }; hasChanges = true; }

    // Sequential positioning for day cards
    plan.forEach((_, i) => {
      const id = `day-${i}`;
      if (!newLayouts[id]) {
        const col = i < 4 ? 0 : 1;
        const row = i < 4 ? i : i - 4;
        newLayouts[id] = { x: 60 + col * 450, y: 280 + row * 240, width: 420 };
        hasChanges = true;
      }
    });

    if (hasChanges) setLayouts(newLayouts);
  }, [isHydrated, plan, setLayouts, layouts]);

  // Target selection synchronization
  React.useLayoutEffect(() => {
    let rafId;
    if (selectedId && elementsRef.current[selectedId]) {
      rafId = requestAnimationFrame(() => {
        const el = elementsRef.current[selectedId];
        if (el) setTargets([el]);
      });
    } else {
      setTargets([]);
    }
    return () => cancelAnimationFrame(rafId);
  }, [selectedId]);

  // Guideline computation
  const guidelines = React.useMemo(() => {
    return Object.keys(elementsRef.current)
      .filter(id => id !== selectedId && elementsRef.current[id])
      .map(id => elementsRef.current[id]);
  }, [selectedId]);

  const handleDownload = async () => {
    setIsExporting(true);
    setTargets([]);
    setSelectedId(null);
    
    // Defer for Moveable UI cleanup and canvas capture
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(canvasRef.current, { 
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff',
          logging: false
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`NutriPlan_Layout_${getPeriodString()}.pdf`);
      } catch (err) {
        console.error("PDF Export failed:", err);
      } finally {
        setIsExporting(false);
      }
    }, 150);
  };

  // Wait for hydration to prevent "Static flag" and mismatch errors
  if (!isHydrated) {
    return (
      <div className="pdf-constructor">
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-constructor">
      <div className="pdf-constructor__toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layout size={24} className="text-emerald-500" />
          <h2 className="text-lg font-bold">Конструктор PDF</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="pdf-constructor__btn" onClick={resetLayouts}>
            <RotateCcw size={16} /> Сброс
          </button>
          <button className="pdf-constructor__btn pdf-constructor__btn--primary" onClick={handleDownload} disabled={isExporting}>
            <Download size={16} /> {isExporting ? 'Создание...' : 'Скачать PDF'}
          </button>
          <button className="pdf-constructor__btn" onClick={onClose}>
            <X size={16} /> Закрыть
          </button>
        </div>
      </div>

      <div className="pdf-constructor__canvas-area">
        <div className="pdf-constructor__canvas pdf-export-template" ref={canvasRef} onClick={() => setSelectedId(null)}>
          {/* Snap Line Guidelines */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', borderLeft: '1px dashed #e2e8f0', pointerEvents: 'none' }} />
          
          {/* Header Block */}
          <div 
            id="branding"
            className="pdf-constructor__item"
            ref={el => registerRef('branding', el)}
            style={{ 
              left: layouts['branding']?.x || 60, 
              top: layouts['branding']?.y || 60,
              width: layouts['branding']?.width || 880
            }}
            onMouseDown={(e) => { e.stopPropagation(); setSelectedId('branding'); }}
          >
            <div className="pdf-export-template__branding">
              <div className="pdf-export-template__accent-bar" />
              <h1 className="pdf-export-template__main-title">Weekly Nutrition Report</h1>
            </div>
          </div>

          {/* Info Block */}
          <div 
            id="info"
            className="pdf-constructor__item"
            ref={el => registerRef('info', el)}
            style={{ 
              left: layouts['info']?.x || 60, 
              top: layouts['info']?.y || 150,
              width: layouts['info']?.width || 880
            }}
            onMouseDown={(e) => { e.stopPropagation(); setSelectedId('info'); }}
          >
            <div className="pdf-export-template__info-panel">
              <div className="pdf-export-template__info-group">
                <span className="pdf-export-template__info-label">ПЕРИОД</span>
                <span className="pdf-export-template__info-value">{getPeriodString()}</span>
              </div>
              <div className="pdf-export-template__info-group">
                <span className="pdf-export-template__info-label">ЦЕЛЕВАЯ НОРМА</span>
                <span className="pdf-export-template__info-value">
                  {fmtNum(nutrition?.targetCalories)} ккал/д ({fmtNum(nutrition?.targetCalories * 7)} ккал/нед)
                </span>
              </div>
            </div>
          </div>

          {/* Individual Day Cards */}
          {(plan || []).map((day, i) => {
            const date = new Date();
            const todayIdx = (new Date().getDay() + 6) % 7;
            date.setDate(date.getDate() - todayIdx + i);
            const dateStr = date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            
            return (
              <DayCard 
                key={`day-${i}`}
                day={day}
                index={i}
                layout={layouts[`day-${i}`]}
                onSelect={setSelectedId}
                registerRef={registerRef}
                fmtNum={fmtNum}
                MEAL_LABELS={MEAL_LABELS}
                dateStr={dateStr}
              />
            );
          })}

          {/* Global Moveable UI */}
          {!isExporting && selectedId && targets.length > 0 && (
            <Moveable
              key={selectedId}
              target={targets}
              container={canvasRef.current}
              draggable={true}
              resizable={true}
              snappable={true}
              snapThreshold={5}
              elementGuidelines={guidelines}
              onDrag={({ target, left, top }) => {
                target.style.left = `${left}px`;
                target.style.top = `${top}px`;
              }}
              onDragEnd={({ target }) => {
                updateLayout(target.id, { 
                  x: parseFloat(target.style.left), 
                  y: parseFloat(target.style.top) 
                });
              }}
              onResize={({ target, width, height, drag }) => {
                target.style.width = `${width}px`;
                target.style.height = `${height}px`;
                target.style.left = `${drag.left}px`;
                target.style.top = `${drag.top}px`;
              }}
              onResizeEnd={({ target }) => {
                updateLayout(target.id, { 
                  width: parseFloat(target.style.width),
                  height: parseFloat(target.style.height),
                  x: parseFloat(target.style.left),
                  y: parseFloat(target.style.top)
                });
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
