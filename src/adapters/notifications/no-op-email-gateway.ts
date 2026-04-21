import type {EmailGateway} from '@/src/application/ports/email-gateway'

export function noopEmailGateway(): EmailGateway {
    return {
        async send() {
            /* development default — no email sent */
        },
    }
}
