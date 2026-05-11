import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

const {Pool} = pg

if (!process.env.DATABASE_URL) {
    console.error('[baseline] DATABASE_URL is not set')
    process.exit(1)
}

const migrationsFolder = './drizzle'
const journalPath = path.join(migrationsFolder, 'meta', '_journal.json')
const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'))

const entries = journal.entries.map((e) => {
    const sqlPath = path.join(migrationsFolder, `${e.tag}.sql`)
    const sql = fs.readFileSync(sqlPath, 'utf8')
    const hash = crypto.createHash('sha256').update(sql).digest('hex')
    return {tag: e.tag, when: e.when, hash}
})

const pool = new Pool({connectionString: process.env.DATABASE_URL})
const client = await pool.connect()

try {
    await client.query('BEGIN')
    await client.query('CREATE SCHEMA IF NOT EXISTS "drizzle"')
    await client.query(`
        CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations"
        (
            id
            SERIAL
            PRIMARY
            KEY,
            hash
            text
            NOT
            NULL,
            created_at
            bigint
        )
    `)

    for (const entry of entries) {
        const exists = await client.query(
            'SELECT 1 FROM "drizzle"."__drizzle_migrations" WHERE hash = $1',
            [entry.hash],
        )
        if (exists.rowCount > 0) {
            console.log(`[baseline] skip ${entry.tag} (already recorded)`)
            continue
        }
        await client.query(
            'INSERT INTO "drizzle"."__drizzle_migrations" (hash, created_at) VALUES ($1, $2)',
            [entry.hash, entry.when],
        )
        console.log(`[baseline] recorded ${entry.tag}`)
    }

    await client.query('COMMIT')
    console.log('[baseline] done — drizzle.__drizzle_migrations is now in sync with ./drizzle')
} catch (err) {
    await client.query('ROLLBACK')
    console.error('[baseline] failed:', err)
    process.exitCode = 1
} finally {
    client.release()
    await pool.end()
}
