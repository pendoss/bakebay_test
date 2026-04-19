import type {LpSolver, LpModel, LpResult} from '@/src/application/ports/lp-solver'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const solver = require('javascript-lp-solver')

export function lpSolverJs(): LpSolver {
    return {
        solve(model: LpModel): LpResult {
            return solver.Solve(model) as LpResult
        },
    }
}
