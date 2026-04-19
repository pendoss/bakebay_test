import {toast} from '@/hooks/use-toast'
import type {Notifier, NotifierMessage} from '@/src/application/ports/notifier'

export function notifierToast(): Notifier {
    return {
        success({title, description}: NotifierMessage) {
            toast({title, description})
        },
        error({title, description}: NotifierMessage) {
            toast({title, description, variant: 'destructive'})
        },
        info({title, description}: NotifierMessage) {
            toast({title, description})
        },
    }
}
