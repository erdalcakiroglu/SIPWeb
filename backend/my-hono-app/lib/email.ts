import { writeAuditLog } from './audit'

export async function sendPasswordResetEmail(
  c: any,
  payload: {
    to: string
    subject: string
    html: string
    text: string
  },
) {
  if (!c.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY missing. Password reset email not sent.', payload.to)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${c.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'SQL Performance Intelligence <no-reply@sqlperformance.ai>',
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Email delivery failed.')
  }

  await writeAuditLog(c, {
    actorType: 'system',
    action: 'email_sent',
    entityType: 'email',
    entityId: null,
    metadata: {
      to: payload.to,
      subject: payload.subject,
    },
  })
}
