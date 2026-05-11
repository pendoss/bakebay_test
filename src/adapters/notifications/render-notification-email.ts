import type {Notification} from '@/src/domain/notification'
import type {EmailMessage} from '@/src/application/ports/email-gateway'

const ESCAPE: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
}

function escapeHtml(input: string): string {
    return input.replace(/[&<>"']/g, (ch) => ESCAPE[ch] ?? ch)
}

function mdInline(input: string): string {
    let out = escapeHtml(input)
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
    out = out.replace(/\n/g, '<br/>')
    return out
}

function absoluteHref(href: string, base?: string): string {
    if (!base) return href
    if (/^https?:\/\//.test(href)) return href
    const joined = href.startsWith('/') ? `${base.replace(/\/$/, '')}${href}` : `${base.replace(/\/$/, '')}/${href}`
    return joined
}

export function renderNotificationEmail(
    notification: Notification,
    to: string,
    publicBaseUrl?: string,
): EmailMessage {
    const subject = notification.titleMd.replace(/\*\*/g, '').slice(0, 120)
    const actionsHtml = notification.actions
        .map(
            (a) =>
                `<a href="${absoluteHref(a.href, publicBaseUrl)}" style="display:inline-block;padding:8px 14px;margin:4px 6px 0 0;border-radius:6px;background:#5b3a8a;color:#fff;text-decoration:none;font-size:14px;">${escapeHtml(a.label)}</a>`,
        )
        .join('')
    const actionsText = notification.actions
        .map((a) => `${a.label}: ${absoluteHref(a.href, publicBaseUrl)}`)
        .join('\n')
    const html = `
<!doctype html>
<html><body style="font-family:system-ui,sans-serif;background:#f6f5fa;padding:24px;">
  <table style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;padding:20px;border:1px solid #ece6f5;">
    <tr><td>
      <h2 style="margin:0 0 8px 0;font-size:18px;color:#2a2237;">${mdInline(notification.titleMd)}</h2>
      <p style="margin:0;color:#5d5773;font-size:14px;">${mdInline(notification.bodyMd)}</p>
      <div style="margin-top:16px;">${actionsHtml}</div>
    </td></tr>
  </table>
</body></html>`.trim()
    const text = [notification.titleMd.replace(/\*\*/g, ''), notification.bodyMd, '', actionsText]
        .filter(Boolean)
        .join('\n')
    return {to, subject, html, text}
}
