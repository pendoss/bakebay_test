import {seedBaselineScenario} from './test-fixtures/scenarios'
import {resetTestData} from './test-fixtures/factories'

async function main(): Promise<void> {
    const args = new Set(process.argv.slice(2))
    const shouldReset = args.has('--reset')
    const scenario = args.has('--scenario=baseline') || args.size === 0 || (args.size === 1 && shouldReset)
        ? 'baseline'
        : 'unknown'

    if (shouldReset) {
        await resetTestData('test.local')
    }

    if (scenario === 'baseline') {
        await seedBaselineScenario()
    } else {
        console.error(`Unknown scenario. Usage: tsx scripts/seed.ts [--reset] [--scenario=baseline]`)
        process.exit(1)
    }

    console.log('[seed] done')
    process.exit(0)
}

main().catch((err) => {
    console.error('[seed] failed', err)
    process.exit(1)
})
