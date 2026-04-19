import {globalIgnores} from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextConfig from 'eslint-config-next'
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
    ...nextConfig,
    ...nextVitals,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            'quotes': ['error', 'single', {avoidEscape: true, allowTemplateLiterals: true}],
            'jsx-quotes': ['error', 'prefer-single'],
            'indent': ['error', 'tab', {SwitchCase: 1}],
            'no-tabs': 'off',
            'react-hooks/exhaustive-deps': 'error',
        },
    },
    // Clean Architecture layer boundaries.
    // domain → не зависит ни от чего фреймворкового
    {
        files: ['src/domain/**/*.ts', 'src/domain/**/*.tsx'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [
                    {group: ['react', 'react-*', 'next', 'next/*'], message: 'domain must not depend on React/Next'},
                    {group: ['drizzle-orm', 'drizzle-orm/*'], message: 'domain must not depend on Drizzle'},
                    {
                        group: ['@/src/adapters', '@/src/adapters/*', '@/src/application', '@/src/application/*'],
                        message: 'domain must not import adapters/application'
                    },
                    {
                        group: ['@/components', '@/components/*', '@/contexts', '@/contexts/*', '@/hooks', '@/hooks/*', '@/app', '@/app/*'],
                        message: 'domain must not import UI/app layers'
                    },
                ],
            }],
        },
    },
    // application → знает только domain и свои порты
    {
        files: ['src/application/**/*.ts', 'src/application/**/*.tsx'],
        rules: {
            'no-restricted-imports': ['error', {
                patterns: [
                    {
                        group: ['react', 'react-*', 'next', 'next/*'],
                        message: 'application must not depend on React/Next'
                    },
                    {group: ['drizzle-orm', 'drizzle-orm/*'], message: 'application must not depend on Drizzle'},
                    {group: ['@/src/adapters', '@/src/adapters/*'], message: 'application must not import adapters'},
                    {
                        group: ['@/components', '@/components/*', '@/contexts', '@/contexts/*', '@/hooks', '@/hooks/*', '@/app', '@/app/*'],
                        message: 'application must not import UI/app layers'
                    },
                ],
            }],
        },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        rules: {
            // Запрет any — предупреждение, не ошибка (удобно при миграции)
            '@typescript-eslint/no-explicit-any': 'warn',
            // Явные типы возврата — отключено (громоздко для React/Next.js компонентов)
            '@typescript-eslint/explicit-function-return-type': 'off',
            // Неиспользуемые переменные с исключением для _prefixed
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }],
            'no-unused-vars': 'off',
            // non-null assertions (!) — предупреждение
            '@typescript-eslint/no-non-null-assertion': 'warn',
            // Пустые интерфейсы
            '@typescript-eslint/no-empty-object-type': 'warn',
        },
    },
]
