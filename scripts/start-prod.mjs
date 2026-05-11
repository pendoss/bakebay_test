/**
 * Production/preview entrypoint.
 *
 *   migrate → [optional] seed-full --reset → next start
 *
 * Сидинг включается env-флагом SEED_ON_START=1 (или 'true').
 * В Coolify ставим эту переменную только в Environment у preview-деплоев —
 * production остаётся неизменным.
 */
import {spawnSync} from 'node:child_process'

function run(label, cmd, args) {
    console.log(`[start-prod] ▶ ${label}: ${cmd} ${args.join(' ')}`)
    const result = spawnSync(cmd, args, {stdio: 'inherit', env: process.env})
    if (result.status !== 0) {
        console.error(`[start-prod] ✖ ${label} failed (exit ${result.status})`)
        process.exit(result.status ?? 1)
    }
}

run('migrate', 'node', ['scripts/migrate.mjs'])

const seedFlag = (process.env.SEED_ON_START ?? '').toLowerCase()
if (seedFlag === '1' || seedFlag === 'true' || seedFlag === 'yes') {
    run('seed-full', 'pnpm', ['exec', 'tsx', 'scripts/seed-full.ts', '--reset'])
} else {
    console.log('[start-prod] SEED_ON_START is not set — пропускаем сидинг')
}

run('next start', 'pnpm', ['exec', 'next', 'start'])
