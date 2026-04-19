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
- Файлы больше **250 строк** — разбить.

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

Статья-источник: <https://bespoyasov.me/blog/clean-architecture-on-frontend/>.
