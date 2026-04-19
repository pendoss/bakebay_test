export interface Router {
    push(path: string): void

    replace(path: string): void

    refresh(): void

    back(): void
}
