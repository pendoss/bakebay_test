# CI/CD Setup

## GitHub Secrets

Добавить в **Settings → Secrets and variables → Actions → New repository secret**:

| Secret                | Описание                                                 | Пример                                |
|-----------------------|----------------------------------------------------------|---------------------------------------|
| `COOLIFY_URL`         | URL Coolify без слэша в конце                            | `https://coolify.home.example.com`    |
| `COOLIFY_TOKEN`       | API-токен из Coolify → Settings → API Tokens             | `eyJ...`                              |
| `COOLIFY_APP_UUID`    | UUID приложения в Coolify                                | `abc123xyz`                           |
| `COOLIFY_PREVIEW_URL` | Домен preview-окружения из настроек приложения в Coolify | `https://preview.bakebay.example.com` |

## Coolify — включить Preview Deployments

1. Открыть приложение в Coolify → вкладка **General**.
2. Найти переключатель **Preview Deployments** — включить.
3. Coolify начнёт создавать отдельное окружение на каждый PR автоматически.
4. UUID приложения скопировать в секрет `COOLIFY_APP_UUID`.

## Как работает пайплайн

```
PR opened/updated
      │
      ▼
pr-checks.yml
  ├─ tsc --noEmit
  ├─ next lint
  ├─ jest --ci
  └─ next build
      │  (только если всё прошло ✓)
      ▼
preview-deploy.yml
  ├─ GET /api/v1/deploy?uuid=...&pull_request_id=<PR number>
  └─ Комментарий на PR с preview URL
```

`workflow_run` требует, чтобы оба файла были в ветке `main`.
Пайплайн не активируется до первого мержа этих файлов в main.
