export interface EmailMessage {
    readonly to: string
    readonly subject: string
    readonly html: string
    readonly text: string
}

export interface EmailGateway {
    send(message: EmailMessage): Promise<void>
}
