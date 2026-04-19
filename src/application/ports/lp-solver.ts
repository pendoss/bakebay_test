export interface LpConstraint {
    min?: number
    max?: number
}

export interface LpModel {
    optimize: string
    opType: 'min' | 'max'
    constraints: Record<string, LpConstraint>
    variables: Record<string, Record<string, number>>
    ints: Record<string, number>
}

export interface LpResult {
    feasible?: boolean

    [variableOrMetric: string]: number | boolean | undefined
}

export interface LpSolver {
    solve(model: LpModel): LpResult
}
