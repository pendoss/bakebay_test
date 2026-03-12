import {globalIgnores} from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import tseslint from 'typescript-eslint'

export default [
    globalIgnores([
        'node_modules/**',
        '.next/**',
        'out/**',
        'build/**',
        'next-env.d.ts',
        'drizzle/**',
    ]),
    ...nextVitals,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            // Запрет any — предупреждение, не ошибка (удобно при миграции)
            '@typescript-eslint/no-explicit-any': 'warn',
            // Явные типы возврата — отключено (громоздко для React/Next.js компонентов)
            '@typescript-eslint/explicit-function-return-type': 'off',
            // Неиспользуемые переменные с исключением для _prefixed
            '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
            // non-null assertions (!) — предупреждение
            '@typescript-eslint/no-non-null-assertion': 'warn',
            // Пустые интерфейсы
            '@typescript-eslint/no-empty-object-type': 'warn',
        },
    },
]
