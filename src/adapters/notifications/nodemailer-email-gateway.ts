import 'server-only'
import nodemailer from 'nodemailer'
import type {EmailGateway, EmailMessage} from '@/src/application/ports/email-gateway'

interface SmtpConfig {
    host: string
    port: number
    user: string
    pass: string
    from: string
    secure: boolean
}

function readConfig(): SmtpConfig | null {
    const host = process.env.SMTP_HOST
    const portRaw = process.env.SMTP_PORT
    const user = process.env.SMTP_USER
    const pass = process.env.SMTP_PASS
    const from = process.env.SMTP_FROM ?? user
    if (!host || !portRaw || !user || !pass || !from) return null
    return {
        host,
        port: Number(portRaw),
        user,
        pass,
        from,
        secure: process.env.SMTP_SECURE === '1',
    }
}

export function nodemailerEmailGateway(): EmailGateway {
    const config = readConfig()
    if (!config) {
        return {
            async send(message: EmailMessage) {
                console.warn('[email] SMTP not configured, skipping email to', message.to)
            },
        }
    }

    const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {user: config.user, pass: config.pass},
    })

    return {
        async send(message: EmailMessage) {
            await transporter.sendMail({
                from: config.from,
                to: message.to,
                subject: message.subject,
                html: message.html,
                text: message.text,
            })
        },
    }
}
