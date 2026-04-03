# DEV_LOG.md — Adaptive Nutrition Engine Landing Page

---

## [2026-04-03] — Написание документации (README, ARCHITECTURE, ROADMAP)

**Статус:** ✅ Выполнено

- Переписан общепроектный README.md с техническим и бизнесовым описанием проекта.
- Создан новый файл ARCHITECTURE.md с глубоким разбором ядра генератора (4-уровневый Fallback), timeFilter'ов и логики Zustand-схемы.
- Создан файл ROADMAP.md для трекинга завершенных фич MVP и построения плана будущих улучшений (БД, Интеграции, PWA).

---
## [2026-04-03] — Bugfix: Generator NULL-slots and calorie deficit

**Status:** Fixed, build 0 errors

### 3 root causes fixed

**Bug 1 — monotonyIndex.js: noRepeat=1**
- noRepeat raised 1 -> 2 (realistic minimum for 7-day plan)
- Counter is now per-mealType, not global

**Bug 2 — generator.js: global monotony counter**
- selectedPerType{} per meal category instead of globalSelected[]
- pickRecipe calorie window: +-30% (level 1/2), +-45% (level 3)

**Bug 3 — Too few dinner recipes (<=30 min)**
- Added 10 new recipes: 7 dinner <=30 min + 3 lunch
- Dinner pool: 3->10, Lunch pool: 7->10

### Result: NULL slots 0/28 (was 3-7/day), avg 1480 kcal/day

---
## [2026-04-03] — Phase 3–6 · SPA Full Implementation ✅

**Статус:** ✅ Все страницы реализованы, build успешен (0 ошибок), проверка в браузере пройдена.

### Что было сделано

**Phase 3 — Onboarding Wizard (6 шагов):**
- `OnboardingPage.jsx` + `OnboardingPage.css` — оболочка с AnimatePresence, состоянием формы, расчётом КБЖУ и генерацией первого плана
- `BiometricStep.jsx` — имя, возраст, пол, рост/вес (слайдеры), уровень активности (option-cards)
- `GoalStep.jsx` — цель (похудение/поддержание/набор), темп изменения веса
- `TimeStep.jsx` — временное окно готовки, частота, toggle «ленивые блюда»
- `TasteStep.jsx` — вкусовые категории, нелюбимые ингредиенты (tag multi-select), toggle монотонности
- `AllergenStep.jsx` — аллергены (карточки), медицинские ограничения, диетические стили
- `SummaryStep.jsx` — анимированные КБЖУ-боксы, профиль-теги, CTA генерации рациона
- `Hero.jsx` — CTA кнопка переведена с scroll-to-anchor на `navigate('/app/onboarding')`

**Phase 4 — Dashboard + MealDetail + ShoppingList:**
- `DashboardPage.jsx` + CSS — 7-колонный week-grid, SVG macro-rings (Белки/Жиры/Углеводы), today-summary, meal-cards, кнопка «Пересчитать»
- `MealDetailPage.jsx` + CSS — Hero с emoji, nutrition-table 4 ячейки, цветные ingredient-list, numbered steps, теги аллергенов/batch-cook/lazy
- `ShoppingListPage.jsx` + CSS — авто-сборка из плана, группировка по категориям, чекбоксы, прогресс-бар, Zero Waste объединение ингредиентов

**Phase 5 — Progress:**
- `ProgressPage.jsx` + CSS — SVG line chart с gradient-fill для веса, лог веса, ComplianceBar, streak, avgCompliance, stat-boxes

**Phase 6 — Profile:**
- `ProfilePage.jsx` + CSS — редактирование биометрии/цели/активности с немедленным пересчётом КБЖУ и регенерацией рациона, danger-zone сброс профиля

**Инфраструктура:**
- `AppShell.jsx` — добавлен импорт `AppShell.css`
- `index.css` — добавлен `.btn-primary:disabled`

### Результат проверки в браузере
✅ Лендинг: все 5 секций, TechStack удалён  
✅ CTA Hero → `/app/onboarding`  
✅ Онбординг: 6 шагов, прогресс-бар, слайдеры, cards, tags, toggles  
✅ Dashboard: „Рацион на неделю", 7 дней × 4 приёма, macro-rings (1470/1589 ккал, Б: 84, Ж: 39, У: 188)  
✅ MealDetail: «Овсянка ночная» — emoji, nutrition table, ингредиенты, теги ⚠️ Глютен, ⚠️ Лактоза  
✅ Сборка: 0 ошибок, бандл 533 КБ (163 КБ gzip)

---



## [2026-04-02] — Initial Full Build · Лендинг ANE (Adaptive Nutrition Engine)

**Статус:** ✅ Завершено, dev-сервер работает на `http://localhost:5173`

### Что было сделано

Создан полноценный лендинг для презентации продукта "Adaptive Nutrition Engine" — кейс агентства веб-разработки.

**Технологии:**
- React 19 + Vite 8 (существующий проект)
- Framer Motion (анимации, scroll-triggered)
- lucide-react (иконки)
- Vanilla CSS (CSS Custom Properties / Design Tokens)
- Google Fonts: Space Grotesk (заголовки) + Inter (тело)

**Созданные компоненты:**

| Компонент | Файлы | Описание |
|-----------|-------|----------|
| `Hero` | `Hero.jsx / Hero.css` | Двухколоночный hero с темным фоном, градиентными глоу-эффектами, dashboard-mockup, floating chips, trust-strip |
| `Engine` | `Engine.jsx / Engine.css` | 3 карточки модулей (Time-Adaptive, Psychological Comfort, Precision Bio) с цветовой акцентировкой |
| `ProblemSolution` | `ProblemSolution.jsx / ProblemSolution.css` | Accordion-компонент — 3 пары проблема/решение с AnimatePresence |
| `Metrics` | `Metrics.jsx / Metrics.css` | 4 метрики с анимированными счётчиками (framer-motion `animate`) |
| `TechStack` | `TechStack.jsx / TechStack.css` | Terminal-блок + 2×2 карточки слоёв архитектуры + CTA баннер |
| `Footer` | `Footer.jsx / Footer.css` | Трёхколоночный footer с контактами, nav, mini-CTA |

**Design System (`index.css`):**
- Dark theme: `#050810` base, `#00f5a0` (electric green), `#00d4ff` (cyan), `#7c3aed` (violet)
- Полный набор CSS Variables: цвета, радиусы, тени, transitions
- Утилиты: `.gradient-text`, `.card`, `.btn-primary`, `.btn-secondary`, `.section-label`

**SEO (`index.html`):**
- Заголовок, meta description, OG tags, Google Fonts preconnect

**Исправленный баг:**
- `lucide-react@1.7.0` не экспортирует иконку `Github` — заменена на `Code2`

### Структура файлов

```
src/
├── index.css              # Design System
├── App.jsx / App.css
├── main.jsx
└── components/
    ├── Hero.jsx / Hero.css
    ├── Engine.jsx / Engine.css
    ├── ProblemSolution.jsx / ProblemSolution.css
    ├── Metrics.jsx / Metrics.css
    ├── TechStack.jsx / TechStack.css
    └── Footer.jsx / Footer.css
```


