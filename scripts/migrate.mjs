import {drizzle} from 'drizzle-orm/node-postgres'
import {migrate} from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

const {Pool} = pg

if (!process.env.DATABASE_URL) {
    console.error('[migrate] DATABASE_URL is not set')
    process.exit(1)
}

const pool = new Pool({connectionString: process.env.DATABASE_URL})

try {
    console.log('[migrate] applying migrations from ./drizzle')
    await migrate(drizzle(pool), {migrationsFolder: './drizzle'})
    console.log('[migrate] done')
} catch (err) {
    console.error('[migrate] failed:', err)
    process.exitCode = 1
} finally {
    await pool.end()
}
