# CLAUDE.md — правила поддержки проекта

Источник правды для Claude и людей. Любое изменение кода должно соответствовать ему. Если правило не подходит — сначала
правим CLAUDE.md, потом код.

## 1. Архитектура

Clean Architecture по Беспоясову. Три слоя с однонаправленной зависимостью:

```
adapters  →  application  →  domain
```

- **`src/domain/`** — сущности и чистые функции бизнес-правил. Ноль импортов из `react`, `next`, `drizzle-orm`,
  `@/src/db`, `@/src/adapters`, `@/src/application`, `fetch`, `localStorage`. Только TypeScript + другие файлы внутри
  `domain/`.
- **`src/application/`** — use-cases (сценарии) и ports (интерфейсы к внешнему миру). Импортирует `domain/`. Нельзя:
  `adapters/`, `react`, `next`, `drizzle-orm`.
- **`src/adapters/`** — реализации портов (drizzle, http, s3, browser) и UI-обёртки (React-хуки, провайдеры). Может
  импортировать `application/` и `domain/`.
- **`app/`** — Next.js routing. Тонкий слой: парсинг входа → вызов use-case с адаптерами → форматирование ответа.
  Никакой бизнес-логики и SQL.
- **`components/`** — презентация. Никаких `fetch`, `localStorage`, импортов `@/src/db`, `drizzle-orm`. Данные и
  действия — через пропсы или хуки из `@/src/adapters/ui/react/hooks/`.

ESLint `no-restricted-imports` обеспечивает это автоматически — нарушение ломает lint.

### 1.1 Механизмы принуждения (почему плохой код не скомпилируется)

Архитектурные границы защищены в три слоя: **TypeScript** (branded типы, strict-опции), **ESLint**
(импорты, AST-запреты), **конвенции** (barrel, `.internal.ts`). Если нарушение не ловит компилятор —
его ловит линтер в CI. Локальный `// eslint-disable-next-line` допустим только с комментарием-
обоснованием и желательно со ссылкой на issue.

| Правило                                                              | Уровень      | Чем защищено                               |
|----------------------------------------------------------------------|--------------|--------------------------------------------|
| Domain не импортирует фреймворки / adapters / application            | lint-time    | ESLint `no-restricted-imports`             |
| Application не импортирует adapters                                  | lint-time    | ESLint `no-restricted-imports`             |
| Внешние модули импортируют домен только через barrel (`index.ts`)    | lint-time    | ESLint паттерны (этап 7)                   |
| Файлы `*.internal.ts` не импортируются снаружи своего модуля         | lint-time    | ESLint паттерны (этап 7)                   |
| `as unknown as T` запрещён                                           | lint-time    | ESLint `no-restricted-syntax` (этап 7)     |
| `any`, `!` (non-null assertion), произвольный `<T>`-cast             | lint-time    | ESLint                                     |
| Branded ID не равен голому `number`                                  | compile-time | TypeScript + `Brand<>`                     |
| Неопределённый элемент массива / Record                              | compile-time | `noUncheckedIndexedAccess` (этап 7)        |
| Циклы между модулями                                                 | lint-time    | `import/no-cycle` (этап 7)                 |

Правило для кода и агентов: не обходите enforcement. Если правило мешает — обсуждайте в PR и
меняйте CLAUDE.md + конфиг, а не глушите линтер молча.

### 1.2 Публичная поверхность модуля (barrel-only)

Каждый модуль-папка (`src/domain/<name>/`, `src/application/use-cases/<entity>/`,
`src/adapters/storage/<tech>/`) экспортируется **только** через `index.ts`. Извне модуля
импортировать напрямую его файлы — запрещено. Внутренние файлы называются `<name>.internal.ts`
(или лежат в папке `_internal/`) — их импорт снаружи модуля запрещён ESLint.

```ts
// ✅ Правильно
import { Order } from '@/src/domain/order'
import { productStorageDrizzle } from '@/src/adapters/storage/drizzle'

// ❌ Неправильно — глубокий импорт
import { Order } from '@/src/domain/order/order'

// ❌ Неправильно — импорт internal
import { mapRow } from '@/src/adapters/storage/drizzle/product-mapper.internal'
```

Что экспортировать из `index.ts`:

| Слой        | Публично через barrel                                               | Скрыто (`.internal.ts`)                        |
|-------------|---------------------------------------------------------------------|------------------------------------------------|
| domain      | сущности, чистые функции, доменные ошибки, типы, branded IDs        | helper-утилиты, разборы SQL, приватные маппинги |
| application | use-case функции, port-интерфейсы, типы `Input` / `Deps` / `Output` | валидаторы-утилиты, общие обёртки              |
| adapters    | только фабрика адаптера                                             | drizzle schema, row→entity мапперы, SQL-билдеры |

Исключение: `src/domain/shared/**` (branded IDs, value-objects) — разрешено импортировать глубоким
путём из любого слоя. Это общий словарь.

### 1.3 Branded IDs и запрет `as unknown as`

Все числовые ID — branded (`ProductId`, `OrderId`, `UserId`, `SellerId`, `IngredientId`,
`OrderItemId`), см. [id.ts](src/domain/shared/id.ts). Конструирование branded-значения —
только через smart constructor `asProductId(n: number): ProductId` и аналоги.

```ts
// ✅ Правильно
const pid = asProductId(row.product_id)

// ❌ Запрещено — type assertion в обход типа
const pid = row.product_id as ProductId

// ❌ Запрещено — двойной cast (ESLint отключит после этапа 7)
const pid = row.product_id as unknown as ProductId
```

На границе с Drizzle (schema) используется `brandedInt(asProductId)` из
`src/adapters/storage/drizzle/branded-columns.internal.ts` — это **единственное легальное место**,
где происходит «распаковка» branded-типа. В остальном коде голый `number` не должен присваиваться
переменной типа `ProductId`.

### 1.4 Иммутабельность домена

Доменные сущности и value-objects декларируются с `readonly` на всех полях. Массивы в доменных
типах — `ReadonlyArray<T>`. Изменение состояния — возвращение нового объекта через smart
constructor или `with*`-метод (`withStatus(order, 'delivered')`).

Запрещено в `src/domain/` и в выходных значениях use-cases:

- `Object.assign(order, { ... })`
- мутирующий spread с последующей перезаписью полей через присваивание
- `arr.push` / `arr.splice` / `arr.sort` на доменных массивах — используйте `[...arr, x]`,
  `arr.filter(...)`, `[...arr].sort(...)`

### Куда класть код

| Это...                                              | → сюда                                                   |
|-----------------------------------------------------|----------------------------------------------------------|
| Чистая функция расчёта (цена, статус, валидация)    | `src/domain/<сущность>/`                                 |
| Тип/enum/value-object бизнес-области                | `src/domain/<сущность>/`                                 |
| Сценарий «пользователь делает X»                    | `src/application/use-cases/<сущность>/<action>.ts`       |
| Интерфейс к БД/API/хранилищу                        | `src/application/ports/<name>.ts`                        |
| Реализация такого интерфейса через Drizzle/fetch/S3 | `src/adapters/storage/<tech>/`                           |
| React-хук, обёртывающий use-case                    | `src/adapters/ui/react/hooks/use-<action>.ts`            |
| Провайдер React Context                             | `src/adapters/ui/react/providers/`                       |
| Страница Next.js                                    | `app/<route>/page.tsx` — только композиция               |
| Route handler                                       | `app/api/<resource>/route.ts` — парсинг + вызов use-case |
| Server action                                       | `app/actions/<name>.ts` — обёртка над use-case           |
| Чистая UI-презентация                               | `components/<Name>.tsx`                                  |

## 2. Именование

### Файлы

- `kebab-case.ts`, `kebab-case.tsx`.
- Компонент: файл `kebab-case.tsx`, экспорт — PascalCase.
- Хуки: `use-<thing>.ts`, экспорт — `use<Thing>`.
- Use-cases: `<verb>-<noun>.ts` → `<verbNoun>`.
- Ports: `<noun>-<role>.ts` → `<NounRole>` (интерфейс).
- Adapters: `<port>-<tech>.ts` → фабрика `<portTech>`.
- Тесты: рядом с исходником, `<name>.test.ts`.

### Типы и интерфейсы

**Базовое правило: для формы объекта — `interface`. `type` — только для того, что `interface` не умеет.**

- **Props React-компонента**: `interface <ComponentName>Props`.
  ```tsx
  interface ProductCardProps {
    product: Product
    onAdd: (id: ProductId) => void
  }
  export function ProductCard({ product, onAdd }: ProductCardProps) { ... }
  ```
- **Аргументы use-case**: `interface <UseCaseName>Input`, `interface <UseCaseName>Deps`.
- **Ports**: `interface`.
- **Domain-сущности**: `interface`.
- **Когда `type`**:
    - union: `export type OrderStatus = 'ordering' | 'processing' | 'delivering' | 'delivered'`
    - branded ID: `export type ProductId = number & { readonly __brand: 'ProductId' }`
    - alias примитива: `export type Email = string`
    - intersection
- Enums избегаем — union-строки.
- Префикс `I` не используем.

### Переменные и функции

- **camelCase** (кроме компонентов и типов — PascalCase).
- Булевы — `is`/`has`/`can`/`should`.
- Handlers: в компоненте `handle<Event>`, в пропсах `on<Event>`.

## 3. Компоненты

### Можно

- Принимать данные и коллбэки через `<ComponentName>Props`.
- Вызывать хуки из `src/adapters/ui/react/hooks/`.
- Локальный UI-state.
- Условный рендер, стили, композиция.

### Нельзя

- `fetch(...)` напрямую → хук поверх HTTP-адаптера.
- `localStorage` / `sessionStorage` → порт `CartStorage`/`SessionGateway`.
- Импорты `@/src/db`, `drizzle-orm`, `minio`, `jsonwebtoken`.
- Инлайн-расчёт денег/скидок/налогов → `domain/`.
- Маппинг snake_case ↔ camelCase → адаптер.
- Доменные валидации (ownership и т.п.) → `domain/` или use-case.
- Импорты `*.internal.ts` из других модулей — только через barrel (`@/src/domain/<name>`).
- Глубокие импорты в чужой домен (`@/src/domain/order/order`, `@/src/domain/cart/price-calc`) —
  только через barrel.
- `as unknown as T` и `x as ProductId` — используйте smart constructor (`asProductId(x)`).
- Файлы больше **250 строк** — разбить.
- JSX-вложенность глубже 11 уровней — вынести поддерево в отдельный компонент (текущий baseline с shadcn-структурами Dialog→Tabs→Form→Card→Select; целевой — 9).

### 3.1 Клиентское состояние: Context vs MobX-store

Разделение по назначению:

| Что хранит                                                    | Чем                                      | Где лежит                                        |
|---------------------------------------------------------------|------------------------------------------|--------------------------------------------------|
| Доменное / разделяемое состояние (user, cart, session)        | **MobX store**                           | `src/adapters/ui/react/stores/<name>-store.ts`   |
| UI-only локальное для поддерева (диалог открыт, тема, toast)  | React Context или `useState`             | `src/adapters/ui/react/providers/`               |
| Серверное состояние (список товаров, детали заказа)           | React Query / хук поверх HTTP-адаптера   | `src/adapters/ui/react/hooks/`                   |

Правила для store:

- Store — класс с `makeAutoObservable(this)` в конструкторе, поля — observable, actions — методы.
- Зависимости store (use-cases, порты) инъектятся через конструктор, не импортируются статически.
- Единый Root-провайдер в `app/layout.tsx` создаёт инстансы store и раздаёт через Context.
- Публичная поверхность store — **только через хук-селектор**: `useCurrentUser()`, `useCartItems()`, `useCartTotals()`. Компонент **не получает store целиком** — иначе любое изменение любого поля вызывает ре-рендер.
- Компонент, читающий store, оборачивается в `observer(...)` из `mobx-react-lite`.
- Бизнес-правила (расчёт цены, переходы FSM) — остаются в `src/domain/`; store вызывает чистые функции домена и обновляет observable.

Правила для Context:

- Только UI-state поддерева. Никаких side-effects в провайдере.
- Провайдер размещается как можно ближе к потребителям (не всегда в root).
- Значение мемоизируется; если хранит и state, и actions — split на два контекста (StateContext + ActionsContext) чтобы actions-only потребители не ре-рендерились.

### 3.2 Без props-drilling

- Один проп передаётся через **≤ 2 уровня**. Больше — поднимать в store или локальный Context.
- Коллбэки (`onSubmit`, `onChange`) через 3+ уровня — запрещены; либо Context/store, либо композиция через `children`/slots.
- Если компоненту нужно много разнородных данных (product + seller + reviews + related) — передавать **один объект** через Context «product detail» рядом со страницей, а не 4 пропа через цепочку.
- JSX-максимум 11 уровней вложенности (enforced через `react/jsx-max-depth`, baseline с учётом shadcn; целевой — 9).

### 3.3 Без дублирования

- Логика, повторяющаяся в 2+ местах → вынести в хук (`src/adapters/ui/react/hooks/use-*`) или чистую функцию в `src/domain/`.
- Разметка, повторяющаяся в 2+ местах → вынести в компонент.
- Точки размещения:
    - переиспользуемые UI-примитивы (Button, Input, Dialog) — `components/ui/` (shadcn);
    - переиспользуемые бизнес-виджеты (ProductCard, OrderTimeline) — `components/`;
    - локальные для страницы — рядом с page (`app/<route>/_components/`).
- Перед созданием нового компонента проверить: нет ли похожего по имени/назначению. `ProductCard` и `ProductTile` не должны сосуществовать без чёткой семантической разницы, описанной в JSDoc.
- Не копируй серверные экшены и хуки с одинаковой логикой: серверная часть — в `app/actions/` → use-case, клиентская — в `src/adapters/ui/react/hooks/` → тот же use-case через HTTP-адаптер.
- Enforcement: `sonarjs/no-identical-functions` (error), `sonarjs/no-duplicate-string` (warn, порог 5).

### Шаблон

```tsx
'use client'
import {useAddToCart} from '@/src/adapters/ui/react/hooks/use-add-to-cart'
import type {Product} from '@/src/domain/product/product'

interface ProductCardProps {
    product: Product
    onOpenDetails?: (id: Product['id']) => void
}

export function ProductCard({product, onOpenDetails}: ProductCardProps) {
    const addToCart = useAddToCart()
    return (
        <article onClick={() => onOpenDetails?.(product.id)}>
            <button onClick={(e) => {
                e.stopPropagation();
                addToCart(product)
            }}>В корзину
            </button>
        </article>
    )
}
```

## 4. Use-cases

- Сигнатура: `(input: Input, deps: Deps) => Promise<Output>`. Зависимости — через параметр.
- Никаких импортов из `adapters/` или `next/*`.
- Никаких `console.log`.
- Возврат — либо результат, либо throw доменной ошибки. Не `{ success, error }`.

## 5. Ports и adapters

- Port — `interface`, без реализации.
- Adapter — функция-фабрика: `export function productStorageDrizzle(db: DB): ProductStorage { return { ... } }`.
- Мапперы row → entity — в адаптере.

## 6. Тесты

- **Domain**: юнит-тесты без моков.
- **Use-cases**: юнит с in-memory портами.
- **Adapters**: интеграционные против тестовой БД или моков fetch.
- **Components**: smoke-рендер и ключевые интеракции.
- **E2E**: критические сценарии (checkout, создать товар, логин).

Правило: если для теста нужно мокать `fetch` или `db` — логика лежит не на том слое.

## 7. Ошибки

- Domain — доменные классы: `class InsufficientStockError extends Error`.
- Use-case — пропускает доменные, оборачивает инфраструктурные.
- Route handler / server action — ловит, маппит на HTTP.
- Компонент — показывает через `Notifier`-порт.

## 8. Server vs client

- **Server**: route handlers, server actions, server components → drizzle-адаптеры.
- **Client** (`'use client'`): http-адаптеры через React-хуки. Никогда не импортирует drizzle-адаптеры.
- Порты — одни. Реализации — разные.

## 9. Стиль кода

- 2 пробела, без табов.
- Импорты: внешние → `@/src/domain` → `@/src/application` → `@/src/adapters` → `@/components` → относительные.
- Комментарии — про **WHY**. «Что делает код» не комментируем.
- Никакого закомментированного мёртвого кода.

## 10. Git / PR

- Один PR = одна вертикальная фича или один слой одной сущности.
- PR не трогает больше трёх сущностей.
- В описании PR — ссылка на этап миграции.

## 11. План миграции

Поэтапная миграция на Clean Architecture идёт вертикальными срезами:

- **Этап 0** — фундамент: структура, базовые примитивы, первые порты/адаптеры, ESLint-границы. ✅
- **Этап 1** — Cart. ✅
- **Этап 2** — Product. ✅
- **Этап 3** — Order + Ingredient stock. ✅
- **Этап 4** — User / Auth / Seller. ✅
- **Этап 5** — Seller-specific (optimization, analytics). ✅
- **Этап 6** — cleanup, переименование `src/db` → `src/adapters/storage/drizzle`, `src/s3` → `src/adapters/storage/s3`.
  ✅
- **Этап 7** — enforcement hardening: barrel-only правила, запрет `as unknown as`, branded
  drizzle-колонки, ужесточение tsconfig (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
  и др.). 🔄

Статья-источник: <https://bespoyasov.me/blog/clean-architecture-on-frontend/>.
