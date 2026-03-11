/**
 * Simplex LP Solver — собственная реализация симплекс-метода (Big-M)
 *
 * Поддерживает:
 *  - min / max оптимизацию
 *  - ограничения типа <= (max) и >= (min)
 *  - целочисленные переменные (LP-релаксация + округление)
 *
 * Совместим по интерфейсу с javascript-lp-solver (.Solve API),
 * дополнительно возвращает _iterations и _timeMs.
 */

const EPS = 1e-10       // порог численной точности
const BIG_M = 1e7       // штраф для искусственных переменных (Big-M)
const MAX_ITER_FACTOR = 20  // максимум итераций = FACTOR * (n_dec + n_con)

export interface SimplexModel {
    optimize: string                                      // имя целевой строки в variables
    opType: "min" | "max"
    constraints: Record<string, { min?: number; max?: number }>
    variables: Record<string, Record<string, number>>
    ints?: Record<string, number>                         // 1 = целочисленная переменная
}

export interface SimplexResult {
    feasible: boolean
    result: number
    _iterations: number
    _timeMs: number

    [key: string]: number | boolean                       // значения переменных
}

/**
 * solveLP — решает задачу линейного программирования симплекс-методом (Big-M).
 *
 * Алгоритм:
 *  1. Приводим задачу к стандартной форме (max):
 *     - <= ограничение → добавляем slack-переменную (s_i >= 0)
 *     - >= ограничение → вычитаем surplus-переменную и добавляем искусственную (a_i >= 0)
 *     - min → умножаем коэффициенты цели на -1 (max -c^T x)
 *  2. Строим симплекс-таблицу (tableau) размером (m+1) × (n+1):
 *     - m строк ограничений + 1 строка цели
 *     - n столбцов переменных + 1 столбец правой части (RHS)
 *  3. Инициализируем BFS: slack-переменные (для <=) и искусственные (для >=) — базисные.
 *     Штраф Big-M в строке цели гарантирует, что искусственные переменные покинут базис.
 *  4. Итерации симплекса:
 *     - Ведущий столбец: переменная с максимальным положительным reduced cost
 *     - Ведущая строка: минимальное отношение RHS / коэффициент (ratio test)
 *     - Pivot: нормировка ведущей строки, исключение ведущего столбца из всех остальных строк
 *     - Критерий оптимальности: все reduced costs <= 0
 *  5. ILP: округление LP-решения (ceil для min, floor для max)
 */
export function solveLP(model: SimplexModel): SimplexResult {
    const t0 = Date.now()

    const decVarNames = Object.keys(model.variables)
    const constraintNames = Object.keys(model.constraints)
    const nDec = decVarNames.length
    const nCon = constraintNames.length

    // Пустая задача
    if (nDec === 0 || nCon === 0) {
        return {feasible: true, result: 0, _iterations: 0, _timeMs: Date.now() - t0}
    }

    // ── 1. Индексы переменных ──────────────────────────────────────────────────

    const decIdx: Record<string, number> = {}
    decVarNames.forEach((v, i) => {
        decIdx[v] = i
    })

    // Тип ограничения: le = «<=», ge = «>=»
    type ConType = "le" | "ge"
    const conTypes: ConType[] = constraintNames.map(name => {
        const c = model.constraints[name]
        return c.min !== undefined && c.max === undefined ? "ge" : "le"
    })

    // Вспомогательные столбцы (следуют за переменными решения)
    let auxCol = nDec
    const slackCol: number[] = []   // slack (le) или surplus (ge)
    const artCol: number[] = []   // искусственная (ge) или -1 (le)

    for (let i = 0; i < nCon; i++) {
        slackCol.push(auxCol++)
        artCol.push(conTypes[i] === "ge" ? auxCol++ : -1)
    }

    const nCols = auxCol + 1   // +1 для RHS
    const RHS = nCols - 1
    const OBJ = nCon         // строка цели (последняя)
    const nRows = nCon + 1

    // ── 2. Инициализация таблицы ───────────────────────────────────────────────

    const T: number[][] = Array.from({length: nRows}, () => new Array(nCols).fill(0))

    for (let i = 0; i < nCon; i++) {
        const cName = constraintNames[i]
        const b = conTypes[i] === "le"
            ? (model.constraints[cName].max ?? 0)
            : (model.constraints[cName].min ?? 0)

        T[i][RHS] = b

        // Коэффициенты переменных решения в строке ограничения
        for (const [vName, vData] of Object.entries(model.variables)) {
            T[i][decIdx[vName]] = vData[cName] ?? 0
        }

        if (conTypes[i] === "le") {
            T[i][slackCol[i]] = 1           // slack
        } else {
            T[i][slackCol[i]] = -1          // surplus
            T[i][artCol[i]] = 1          // искусственная
        }
    }

    // ── 3. Строка цели (max форма) ─────────────────────────────────────────────

    const sign = model.opType === "min" ? -1 : 1

    for (const [vName, vData] of Object.entries(model.variables)) {
        T[OBJ][decIdx[vName]] = sign * (vData[model.optimize] ?? 0)
    }

    // Штраф -M для искусственных переменных
    for (let i = 0; i < nCon; i++) {
        if (artCol[i] >= 0) {
            T[OBJ][artCol[i]] = -BIG_M
        }
    }

    // Фаза 0: убираем искусственные переменные из строки цели
    // (т.к. они базисные, их reduced cost = 0)
    // Добавляем M × строку_i к строке цели для каждого >= ограничения
    for (let i = 0; i < nCon; i++) {
        if (artCol[i] >= 0) {
            for (let j = 0; j < nCols; j++) {
                T[OBJ][j] += BIG_M * T[i][j]
            }
        }
    }

    // Базисные переменные (по одной на строку ограничения)
    const basis: number[] = conTypes.map((t, i) =>
        t === "le" ? slackCol[i] : artCol[i]
    )

    // ── 4. Итерации симплекс-метода ────────────────────────────────────────────

    const maxIter = MAX_ITER_FACTOR * (nDec + nCon)
    let iterations = 0

    while (iterations < maxIter) {
        // Ведущий столбец: максимальный положительный reduced cost
        let pcol = -1
        let maxRC = EPS
        for (let j = 0; j < RHS; j++) {
            if (T[OBJ][j] > maxRC) {
                maxRC = T[OBJ][j]
                pcol = j
            }
        }

        if (pcol === -1) break  // все reduced costs <= 0 → оптимум

        // Ведущая строка: минимальное отношение (ratio test)
        let prow = -1
        let minRatio = Infinity
        for (let i = 0; i < nCon; i++) {
            if (T[i][pcol] > EPS) {
                const ratio = T[i][RHS] / T[i][pcol]
                if (ratio < minRatio - EPS) {
                    minRatio = ratio
                    prow = i
                }
            }
        }

        if (prow === -1) {
            // Задача неограничена
            return {feasible: false, result: 0, _iterations: iterations, _timeMs: Date.now() - t0}
        }

        // Pivot: нормировка ведущей строки
        const piv = T[prow][pcol]
        for (let j = 0; j < nCols; j++) T[prow][j] /= piv

        // Исключение ведущего столбца из всех строк (включая строку цели)
        for (let i = 0; i <= nCon; i++) {
            if (i !== prow) {
                const factor = T[i][pcol]
                if (Math.abs(factor) > EPS) {
                    for (let j = 0; j < nCols; j++) {
                        T[i][j] -= factor * T[prow][j]
                    }
                }
            }
        }

        basis[prow] = pcol
        iterations++
    }

    // ── 5. Извлечение решения ──────────────────────────────────────────────────

    const solution: Record<string, number> = {}
    for (const vName of decVarNames) {
        const col = decIdx[vName]
        const row = basis.indexOf(col)
        solution[vName] = row >= 0 ? Math.max(0, T[row][RHS]) : 0
    }

    // Проверка допустимости: если искусственная переменная осталась базисной > EPS → не допустимо
    let feasible = true
    for (let i = 0; i < nCon; i++) {
        if (artCol[i] >= 0 && basis[i] === artCol[i] && T[i][RHS] > EPS) {
            feasible = false
            break
        }
    }

    // ── 6. Целочисленное округление (LP-релаксация → ILP) ─────────────────────
    //
    // Для задачи МИНИМИЗАЦИИ (закупок) каждое ограничение независимо:
    // x_i × package_qty_i >= shortfall_i → x_i >= shortfall_i / package_qty_i
    // Округление вверх (ceil) даёт наименьшее целое допустимое x_i.
    //
    // Для задачи МАКСИМИЗАЦИИ (прибыли) округление вниз (floor) не нарушает
    // ограничения по запасам (Ax <= b при меньшем x).

    const ints = model.ints ?? {}
    for (const vName of decVarNames) {
        if (ints[vName]) {
            solution[vName] = model.opType === "min"
                ? Math.ceil(solution[vName])
                : Math.floor(solution[vName])
        }
    }

    // Пересчёт значения цели по округлённым переменным
    let result = 0
    for (const [vName, vData] of Object.entries(model.variables)) {
        result += (vData[model.optimize] ?? 0) * solution[vName]
    }

    return {
        feasible,
        result,
        _iterations: iterations,
        _timeMs: Date.now() - t0,
        ...solution,
    }
}
