import fs from 'node:fs'
import path from 'node:path'
import {pipeline} from 'node:stream/promises'
import pg from 'pg'
import {to as copyTo} from 'pg-copy-streams'

const {Pool} = pg

if (!process.env.DATABASE_URL) {
    console.error('[backup] DATABASE_URL is not set')
    process.exit(1)
}

const outDir = process.env.BACKUP_DIR ?? './data-backup'
fs.mkdirSync(outDir, {recursive: true})

const pool = new Pool({connectionString: process.env.DATABASE_URL})

const meta = {tables: []}

try {
    const tablesRes = await pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `)
    const tables = tablesRes.rows.map((r) => r.table_name)
    console.log(`[backup] found ${tables.length} tables`)

    const client = await pool.connect()
    try {
        for (const table of tables) {
            const countRes = await client.query(`SELECT count(*) ::int AS n
                                                 FROM "${table}"`)
            const n = countRes.rows[0].n

            const colsRes = await client.query(
                `SELECT column_name
                 FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = $1
                 ORDER BY ordinal_position`,
                [table],
            )
            const cols = colsRes.rows.map((r) => `"${r.column_name}"`)

            const seqRes = await client.query(
                `SELECT column_name, pg_get_serial_sequence('public.' || $1, column_name) AS seq
                 FROM information_schema.columns
                 WHERE table_schema = 'public'
                   AND table_name = $1`,
                [table],
            )
            const sequences = []
            for (const row of seqRes.rows) {
                if (!row.seq) continue
                const maxRes = await client.query(`SELECT max("${row.column_name}") ::bigint AS m
                                                   FROM "${table}"`)
                sequences.push({column: row.column_name, sequence: row.seq, max: maxRes.rows[0].m})
            }

            const filePath = path.join(outDir, `${table}.csv`)
            const stream = client.query(
                copyTo(`COPY "${table}" (${cols.join(',')}) TO STDOUT WITH (FORMAT csv, HEADER true)`),
            )
            await pipeline(stream, fs.createWriteStream(filePath))

            console.log(`[backup] ${table}: ${n} rows -> ${filePath}`)
            meta.tables.push({name: table, rows: n, columns: cols, sequences})
        }
    } finally {
        client.release()
    }

    fs.writeFileSync(path.join(outDir, '_meta.json'), JSON.stringify(meta, null, 2))
    console.log(`[backup] wrote _meta.json — done`)
} finally {
    await pool.end()
}
