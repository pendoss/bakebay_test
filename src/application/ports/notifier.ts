export interface NotifierMessage {
    title: string
    description?: string
}

export interface Notifier {
    success(message: NotifierMessage): void

    error(message: NotifierMessage): void

    info(message: NotifierMessage): void
}
