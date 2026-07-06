import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface CoachingEmailData {
  repName: string
  repEmail: string
  managerName: string
  managerEmail: string
  date: string
  focusArea: string
  observation: string
  agreedActions: string
  followUpDate?: string | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

function emailHtml(data: CoachingEmailData, forRep: boolean) {
  const followUpLine = data.followUpDate
    ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:140px">Follow-up</td><td style="padding:8px 0;color:#111827;font-size:14px">${formatDate(data.followUpDate)}</td></tr>`
    : ''

  const greeting = forRep
    ? `Hi ${data.repName},`
    : `Hi ${data.managerName},`

  const intro = forRep
    ? `${data.managerName} logged a coaching session with you on <strong>${formatDate(data.date)}</strong>. Here's a summary of what was discussed.`
    : `You logged a coaching session with <strong>${data.repName}</strong> on <strong>${formatDate(data.date)}</strong>. Here's a copy for your records.`

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:560px;margin:40px auto;padding:0 16px">

    <!-- Header -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">
      <div style="width:32px;height:32px;background:#4f46e5;border-radius:8px;display:flex;align-items:center;justify-content:center">
        <svg width="16" height="16" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 10L5.5 6L8 8.5L12 3.5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span style="font-weight:700;font-size:16px;color:#111827">FloorTracker</span>
    </div>

    <!-- Card -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.06)">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af">Coaching Session</p>
      <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#111827">${data.focusArea}</h1>

      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6">${greeting}<br><br>${intro}</p>

      <table style="width:100%;border-top:1px solid #f3f4f6;margin-bottom:24px">
        <tr>
          <td style="padding:16px 0 8px;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;width:140px">Date</td>
          <td style="padding:16px 0 8px;color:#111827;font-size:14px">${formatDate(data.date)}</td>
        </tr>
        ${forRep
          ? `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Manager</td><td style="padding:8px 0;color:#111827;font-size:14px">${data.managerName}</td></tr>`
          : `<tr><td style="padding:8px 0;color:#6b7280;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Sales Rep</td><td style="padding:8px 0;color:#111827;font-size:14px">${data.repName}</td></tr>`
        }
        ${followUpLine}
      </table>

      <div style="margin-bottom:20px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Observation</p>
        <p style="margin:0;font-size:14px;color:#111827;line-height:1.7;background:#f9fafb;border-radius:10px;padding:14px 16px">${data.observation}</p>
      </div>

      <div style="margin-bottom:8px">
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#6b7280">Agreed Actions</p>
        <p style="margin:0;font-size:14px;color:#111827;line-height:1.7;background:#f9fafb;border-radius:10px;padding:14px 16px">${data.agreedActions}</p>
      </div>
    </div>

    <p style="text-align:center;font-size:12px;color:#9ca3af;margin-top:24px">FloorTracker · Sent automatically after a coaching session is logged</p>
  </div>
</body>
</html>`
}

export async function sendCoachingEmails(data: CoachingEmailData) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('[email] SMTP_USER/SMTP_PASS not set — skipping email send')
    return
  }

  const subject = `Coaching session: ${data.focusArea} — ${formatDate(data.date)}`

  const from = process.env.SMTP_FROM
    ? `FloorTracker <${process.env.SMTP_FROM}>`
    : `FloorTracker <${process.env.SMTP_USER}>`

  await Promise.all([
    transporter.sendMail({ from, to: data.repEmail, subject, html: emailHtml(data, true) }),
    transporter.sendMail({ from, to: data.managerEmail, subject, html: emailHtml(data, false) }),
  ])

  console.log(`[email] Sent coaching summary to ${data.repEmail} and ${data.managerEmail}`)
}
