# BakeBay — Анализ текущего состояния архитектуры

---

## 1. Карта слоёв

Проект следует Clean Architecture по схеме **adapters → application → domain**. Зависимости однонаправлены: каждый слой
знает только о слоях правее.

```
┌─────────────────────────────────────────────────────────────────┐
│  app/            Next.js routing (парсинг + вызов use-case)     │
│  components/     Презентация (пропсы / хуки)                    │
├─────────────────────────────────────────────────────────────────┤
│  src/adapters/   Реализации портов                              │
│    storage/drizzle/   Drizzle ORM (PostgreSQL)                  │
│    storage/http/      HTTP-клиенты (fetch)                      │
│    storage/browser/   localStorage                              │
│    storage/s3/        S3 / MinIO                                │
│    auth/              bcrypt, JWT                               │
│    solver/            javascript-lp-solver                      │
│    ui/react/hooks/    React-хуки (обёртки use-cases)            │
│    ui/react/providers/ React-контексты                          │
├─────────────────────────────────────────────────────────────────┤
│  src/application/     Use-cases + порты (интерфейсы)            │
│    use-cases/         Сценарии (auth, cart, product, order, …)  │
│    ports/             Интерфейсы к внешнему миру                │
├─────────────────────────────────────────────────────────────────┤
│  src/domain/          Бизнес-сущности и чистые функции          │
│    product/  cart/  order/  ingredient/  user/  seller/  auth/  │
│    optimization/  shared/                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Что реализовано корректно

### Доменный слой (`src/domain/`)

Все сущности — чистые TypeScript-интерфейсы без внешних зависимостей.

| Файл                                  | Что есть                                                                                                 |
|---------------------------------------|----------------------------------------------------------------------------------------------------------|
| `domain/product/product.ts`           | Entity, branded `ProductId`, `validateDraft`, `isOwnedBySeller`, `getMainImage`, доменные ошибки         |
| `domain/cart/cart.ts`                 | Чистые функции: `addItem`, `removeItem`, `updateQuantity`, `applyPromo`, `itemsCount`, `isEmpty`         |
| `domain/order/order.ts`               | Конечный автомат статусов, `canTransition`, `assertTransition`, `calcOrderTotal`, `aggregateIngredients` |
| `domain/ingredient/ingredient.ts`     | `computeStatus`, `applyDeduction`, `applyRestock`, `isLowOrOut`, `shortageAmount`                        |
| `domain/optimization/optimization.ts` | `aggregateNeeded`, `buildPurchaseList`, `sumCost`, `csvRow` — без зависимостей                           |
| `domain/shared/id.ts`                 | Branded-типы для всех ID                                                                                 |
| `domain/shared/money.ts`              | `Money`, `addMoney`, `subtractMoney`, `multiplyMoney`                                                    |

### Слой use-cases (`src/application/`)

Все use-cases имеют сигнатуру `(input, deps) => Promise<output>`. Зависимости — через параметр, не импорт.

| Use-case                                    | Порты                                                |
|---------------------------------------------|------------------------------------------------------|
| `auth/login-user.ts`                        | `UserStorage`, `PasswordHasher`, `TokenService`      |
| `auth/register-user.ts`                     | те же                                                |
| `cart/checkout.ts`                          | `OrderGateway`, `CartStorage`, `CheckoutPreferences` |
| `product/create-product.ts`                 | `ProductStorage`, `FileStorage`                      |
| `product/update-product.ts`                 | те же + проверка `isOwnedBySeller`                   |
| `order/update-order-status.ts`              | `OrderStorage` + `assertTransition` из домена        |
| `optimization/compute-max-profit.ts`        | `LpSolver`                                           |
| `optimization/compute-min-purchase-cost.ts` | `LpSolver`                                           |

### Адаптеры-реализации

- `adapters/storage/drizzle/` — полный набор Drizzle-реализаций для всех портов хранилища
- `adapters/auth/password-hasher-bcrypt.ts` — bcryptjs
- `adapters/auth/token-service-jwt.ts` — JWT
- `adapters/solver/lp-solver-js.ts` — LP solver
- `adapters/storage/s3/file-storage-s3.ts` — S3
- `adapters/storage/browser/cart-storage-local.ts` — localStorage для корзины
- `adapters/storage/http/product-storage-http.ts` — HTTP-адаптер для ProductStorage (новый)

### React-хуки (хорошие примеры)

- `adapters/ui/react/hooks/use-products.ts` — использует `productStorageHttp()`, правильная отмена
- `adapters/ui/react/hooks/use-checkout.ts` — DI через параметры, очищает корзину через порт
- `adapters/ui/react/hooks/use-product-detail.ts` — параллельная загрузка через `Promise.all`

---

## 3. Нарушения и смешение ответственностей

### 3.1 Прямые `fetch` в компонентах и страницах

Компоненты должны получать данные только через хуки из `src/adapters/ui/react/hooks/`. Ниже — места, где это правило
нарушено.

| Файл                                                | Строки   | Нарушение                                                                                                                     |
|-----------------------------------------------------|----------|-------------------------------------------------------------------------------------------------------------------------------|
| `components/sellers-list.tsx`                       | ~50–97   | `fetch('/api/sellers')` и `fetch('/api/products/count?sellerId=…')` прямо в компоненте; последовательные вызовы в цикле       |
| `app/orders/page.tsx`                               | ~72      | `fetch('/api/orders?userId=…')` в `useEffect` без адаптера                                                                    |
| `app/profile/page.tsx`                              | ~135–138 | `fetch('/api/orders?userId=…')` в `.then`-цепочке                                                                             |
| `src/adapters/ui/react/hooks/use-product-detail.ts` | ~40, ~60 | Прямые `fetch('/api/sellers?…')` и `fetch('/api/reviews?…')` вместо использования адаптеров `SellerStorage` / `ReviewStorage` |

### 3.2 Бизнес-логика в UI-слое

| Файл                            | Строки   | Нарушение                                                                                              |
|---------------------------------|----------|--------------------------------------------------------------------------------------------------------|
| `components/product-detail.tsx` | 13–21    | `dietaryLabels` — словарь перевода меток диеты захардкожен в компоненте; принадлежит домену или i18n   |
| `app/profile/page.tsx`          | ~100–130 | Zod-схема валидации смены пароля + проверка совпадения паролей — бизнес-правило, не UI-ответственность |
| `app/orders/page.tsx`           | ~80–100  | Сортировка и фильтрация заказов по статусу — логика вычисления, не рендер                              |
| `components/product-detail.tsx` | ~200     | Расчёт `price × quantity` инлайн в рендере                                                             |

### 3.3 API route handlers с SQL, минуя use-cases

Route handlers в `app/api/` в ряде мест обращаются к Drizzle напрямую, не через use-cases.

| Файл                           | Нарушение                                                                  |
|--------------------------------|----------------------------------------------------------------------------|
| `app/api/sellers/route.ts`     | Прямые Drizzle-запросы к таблице `sellers` без вызова use-case             |
| `app/api/reviews/route.ts`     | INSERT/SELECT отзывов без use-case                                         |
| `app/api/order-items/route.ts` | SELECT order_items без use-case                                            |
| `app/api/categories/route.ts`  | SELECT categories без use-case (допустимо как справочник, если правил нет) |

### 3.4 Нет адаптеров для части HTTP-ресурсов

HTTP-адаптер есть только для `ProductStorage` (`product-storage-http.ts`). Для остальных ресурсов клиентского слоя
адаптеры отсутствуют, что провоцирует прямые `fetch` в хуках и компонентах.

| Порт / ресурс                | HTTP-адаптер                                      |
|------------------------------|---------------------------------------------------|
| `ProductStorage` (read)      | `adapters/storage/http/product-storage-http.ts` ✅ |
| `SellerStorage` (read)       | ❌ нет                                             |
| `ReviewStorage` (read/write) | ❌ нет                                             |
| `OrderStorage` (buyer read)  | ❌ нет                                             |
| `UserStorage` (profile)      | ❌ нет                                             |

---

## 4. Сводная таблица соответствия

| Область                          | Статус            | Комментарий                                                           |
|----------------------------------|-------------------|-----------------------------------------------------------------------|
| Domain layer — чистота           | ✅ Соответствует   | Нет внешних зависимостей, только TS                                   |
| Application / use-cases — DI     | ✅ Соответствует   | Зависимости через параметры                                           |
| Drizzle-адаптеры                 | ✅ Полные          | Все порты реализованы                                                 |
| HTTP-адаптеры                    | ⚠️ Частично       | Только product; остальное — прямые fetch                              |
| React-хуки как обёртки use-cases | ⚠️ Частично       | `use-products`, `use-checkout` — ок; `use-product-detail` — нарушения |
| Компоненты — нет fetch           | ⚠️ Частично       | `sellers-list.tsx` нарушает                                           |
| Страницы — нет fetch             | ⚠️ Частично       | `orders/page.tsx`, `profile/page.tsx` нарушают                        |
| API routes через use-cases       | ⚠️ Частично       | Часть routes содержит прямой SQL                                      |
| Бизнес-логика вне домена         | ⚠️ Есть нарушения | Validation в profile page, hardcoded labels                           |
| ESLint no-restricted-imports     | ✅ Настроен        | Автоматически ловит импорты через слои                                |

---

## 5. Структура директорий (фактическая)

```
bakeBayTest/
├── app/                          # Next.js routing
│   ├── api/
│   │   ├── auth/route.ts         # login
│   │   ├── auth/logout/route.ts
│   │   ├── products/route.ts
│   │   ├── products/count/route.ts
│   │   ├── orders/route.ts
│   │   ├── order-items/route.ts
│   │   ├── seller/orders/route.ts
│   │   ├── seller/analytics/route.ts
│   │   ├── sellers/route.ts
│   │   ├── users/route.ts
│   │   ├── users/me/route.ts
│   │   ├── users/[id]/role/route.ts
│   │   ├── users/password/route.ts
│   │   ├── categories/route.ts
│   │   ├── dietary-constraints/route.ts
│   │   ├── product-ingredients/route.ts
│   │   ├── product-dietary-constraints/route.ts
│   │   └── reviews/route.ts
│   ├── actions/
│   │   ├── fetchProducts.ts
│   │   ├── fetchIngredients.ts
│   │   ├── getOrders.ts
│   │   ├── addIngredient.ts
│   │   ├── addImages.ts
│   │   ├── product.ts
│   │   ├── exportData.ts
│   │   └── computeOptimization.ts
│   ├── catalog/page.tsx
│   ├── product/page.tsx          # новый (untracked)
│   ├── cart/page.tsx
│   ├── orders/page.tsx
│   ├── profile/page.tsx
│   ├── sellers/page.tsx
│   └── seller-dashboard/
│       ├── page.tsx
│       ├── products/page.tsx
│       ├── products/new/page.tsx
│       ├── products/[id]/edit/page.tsx
│       ├── orders/page.tsx
│       ├── ingredients/page.tsx
│       ├── questions/page.tsx
│       └── reviews/page.tsx
├── components/
│   ├── catalog.tsx
│   ├── product-card.tsx
│   ├── product-detail.tsx        # новый (untracked)
│   ├── product-detail.module.css # новый (untracked)
│   ├── product-edit-dialog.tsx
│   ├── shopping-cart.tsx
│   ├── order-card.tsx
│   ├── order-timeline.tsx
│   ├── review-dialog.tsx
│   ├── sellers-list.tsx
│   ├── auth-dialog.tsx
│   ├── become-seller-form.tsx
│   ├── main-nav.tsx
│   ├── site-header.tsx
│   ├── user-nav.tsx
│   ├── cart-indicator.tsx
│   ├── filter-sidebar.tsx
│   └── seller-dashboard/
│       ├── overview.tsx
│       ├── recent-orders.tsx
│       ├── recent-reviews.tsx
│       ├── new-product-slot.tsx
│       └── seller-nav.tsx
├── contexts/
│   ├── user-context.tsx          # auth state, sellerId
│   └── notification-context.tsx  # toast system
├── src/
│   ├── domain/
│   │   ├── product/
│   │   ├── cart/
│   │   ├── order/
│   │   ├── ingredient/
│   │   ├── user/
│   │   ├── seller/
│   │   ├── auth/
│   │   ├── optimization/
│   │   └── shared/               # id.ts, money.ts
│   ├── application/
│   │   ├── use-cases/
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── product/
│   │   │   ├── order/
│   │   │   ├── user/
│   │   │   ├── ingredient/
│   │   │   ├── seller/
│   │   │   └── optimization/
│   │   └── ports/
│   │       ├── product-storage.ts
│   │       ├── order-storage.ts
│   │       ├── order-gateway.ts
│   │       ├── user-storage.ts
│   │       ├── ingredient-storage.ts
│   │       ├── seller-storage.ts
│   │       ├── cart-storage.ts
│   │       ├── checkout-preferences.ts
│   │       ├── password-hasher.ts
│   │       ├── token-service.ts
│   │       ├── file-storage.ts
│   │       ├── lp-solver.ts
│   │       ├── notifier.ts
│   │       ├── router.ts
│   │       └── session-gateway.ts
│   └── adapters/
│       ├── storage/
│       │   ├── drizzle/          # полный набор реализаций
│       │   ├── http/
│       │   │   └── product-storage-http.ts  # только product
│       │   ├── browser/
│       │   │   ├── cart-storage-local.ts
│       │   │   └── checkout-preferences-local.ts
│       │   └── s3/
│       ├── auth/
│       │   ├── password-hasher-bcrypt.ts
│       │   └── token-service-jwt.ts
│       ├── solver/
│       │   └── lp-solver-js.ts
│       └── ui/react/
│           ├── hooks/
│           │   ├── use-products.ts
│           │   ├── use-product-detail.ts
│           │   └── use-checkout.ts
│           ├── providers/
│           ├── notifier-toast.ts
│           └── next-router.ts
└── src/db/                       # (legacy, не перенесено в adapters/drizzle)
```