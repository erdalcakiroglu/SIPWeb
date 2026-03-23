import fs from 'node:fs'
import path from 'node:path'
import nodemailer from 'nodemailer'
import { env } from '../config/env'

export type DeliveryMode = 'smtp' | 'outbox'

const dataDir = path.resolve(__dirname, '..', '..', 'data')
const outboxPath = path.join(dataDir, 'mail-outbox.log')

function hasSmtpConfig() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass)
}

async function appendOutbox(entry: object) {
  fs.mkdirSync(dataDir, { recursive: true })
  fs.appendFileSync(outboxPath, `${JSON.stringify(entry)}\n`, 'utf8')
}

export async function sendActivationEmail(email: string, name: string, code: string): Promise<DeliveryMode> {
  const subject = 'Your SQL Performance Intelligence™ activation code'
  const text = `Hello ${name},\n\nYour SQL Performance Intelligence™ activation code is: ${code}\n\nThis code will expire in 15 minutes.\n`

  if (!hasSmtpConfig()) {
    await appendOutbox({
      type: 'activation',
      email,
      subject,
      code,
      createdAt: new Date().toISOString(),
    })

    return 'outbox'
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  })

  await transporter.sendMail({
    from: env.smtpFrom,
    to: email,
    subject,
    text,
  })

  return 'smtp'
}
