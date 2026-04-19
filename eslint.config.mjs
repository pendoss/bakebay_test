import {globalIgnores} from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextConfig from 'eslint-config-next'
import tseslint from 'typescript-eslint'
import sonarjs from 'eslint-plugin-sonarjs'

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
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-unused-vars': ['error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
                caughtErrorsIgnorePattern: '^_'
            }],
            'no-unused-vars': 'off',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-empty-object-type': 'warn',
            '@typescript-eslint/consistent-type-assertions': ['error', {
                assertionStyle: 'as',
                objectLiteralTypeAssertions: 'allow-as-parameter',
            }],
        },
    },
    // shadcn/ui — сгенерированные обёртки, собственных правил не навязываем
    {
        files: ['components/ui/**/*.ts', 'components/ui/**/*.tsx'],
        rules: {
            '@typescript-eslint/consistent-type-assertions': 'off',
        },
    },
    // Антидублирование и сложность для клиентских/общих компонентов
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {sonarjs},
        rules: {
            'sonarjs/no-identical-functions': 'error',
            'sonarjs/no-duplicate-string': ['warn', {threshold: 5}],
            'sonarjs/cognitive-complexity': ['warn', 20],
            'sonarjs/no-collapsible-if': 'error',
            'sonarjs/no-redundant-boolean': 'error',
            'sonarjs/no-useless-catch': 'error',
            'react/jsx-max-depth': ['error', {max: 11}],
        },
    },
    // shadcn/ui — отключаем и sonarjs (генерированный код)
    {
        files: ['components/ui/**/*.ts', 'components/ui/**/*.tsx'],
        rules: {
            'sonarjs/no-identical-functions': 'off',
            'sonarjs/no-duplicate-string': 'off',
            'sonarjs/cognitive-complexity': 'off',
            'react/jsx-max-depth': 'off',
        },
    },
]
