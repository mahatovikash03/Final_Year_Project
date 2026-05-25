import nodemailer from 'nodemailer';

// ── Create transporter fresh on every call so env vars are always loaded ──────
// (Fixes issue where transporter was created before dotenv loaded GMAIL_USER/PASS)
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

// ── Send welcome email on registration ────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  const transporter = createTransporter();

  // Verify connection before sending
  await transporter.verify();

  await transporter.sendMail({
    from: `"HealthTrack360" <${process.env.GMAIL_USER}>`,
    to,
    subject: '🎉 Welcome to HealthTrack360 — Your Wellness Journey Starts Now!',
    html: `
      <body style="margin:0;padding:0;background:#020817;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <div style="background:linear-gradient(135deg,#10b981,#059669);padding:32px;text-align:center;">
            <div style="font-size:48px;margin-bottom:8px;">💚</div>
            <h1 style="color:white;margin:0;font-size:28px;font-weight:900;">Welcome to HealthTrack360!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px;">Your Personal AI Wellness Companion</p>
          </div>

          <div style="padding:32px;">
            <h2 style="color:white;font-size:22px;margin:0 0 8px;">Hi ${name}! 🎉</h2>
            <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
              You've just taken the first step toward a healthier life. We're so excited to have you on board!
            </p>

            <div style="background:rgba(255,255,255,0.04);border-radius:16px;padding:20px;margin-bottom:24px;">
              <p style="color:white;font-weight:700;margin:0 0 16px;font-size:15px;">Here's what you can do:</p>
              <div style="color:#94a3b8;font-size:14px;line-height:2.2;">
                📋 <strong style="color:white;">Log Today</strong> — Track sleep, diet, mood &amp; workouts<br>
                🤖 <strong style="color:white;">AI Assistant</strong> — Get personalised wellness advice anytime<br>
                📊 <strong style="color:white;">Analytics</strong> — See your 30-day health trends<br>
                🔥 <strong style="color:white;">Streaks</strong> — Build healthy daily habits<br>
                👥 <strong style="color:white;">Community</strong> — Connect with others on the journey
              </div>
            </div>

            <div style="text-align:center;margin:24px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/log"
                style="display:inline-block;background:linear-gradient(135deg,#10b981,#059669);color:white;text-decoration:none;padding:16px 40px;border-radius:14px;font-size:16px;font-weight:700;box-shadow:0 8px 25px rgba(16,185,129,0.35);">
                📝 Log Your First Entry →
              </a>
            </div>

            <p style="color:#64748b;font-size:13px;text-align:center;margin:0;">
              Need help? Use the AI Assistant inside the app anytime.
            </p>
          </div>

          <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <p style="color:#334155;font-size:12px;margin:0;">© 2026 HealthTrack360 · Made with 💚 for your wellness</p>
          </div>
        </div>
      </body>
    `,
  });

  console.log(`✅ Welcome email sent to ${to}`);
}

// ── Send password reset email ─────────────────────────────────────────────────
export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string) {
  const transporter = createTransporter();

  await transporter.verify();

  await transporter.sendMail({
    from: `"HealthTrack360" <${process.env.GMAIL_USER}>`,
    to,
    subject: '🔐 Reset Your HealthTrack360 Password',
    html: `
      <body style="margin:0;padding:0;background:#020817;font-family:'Segoe UI',Arial,sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:24px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">

          <div style="background:linear-gradient(135deg,#3b82f6,#1d4ed8);padding:32px;text-align:center;">
            <h1 style="color:white;margin:0;font-size:24px;font-weight:900;">💚 HealthTrack360</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px;">Password Reset Request</p>
          </div>

          <div style="padding:32px;">
            <h2 style="color:white;font-size:20px;margin:0 0 8px;">Hi ${name} 👋</h2>
            <p style="color:#94a3b8;font-size:15px;line-height:1.6;margin:0 0 24px;">
              We received a request to reset your password. Click the button below.<br>
              This link will expire in <strong style="color:white;">10 minutes</strong>.
            </p>

            <div style="text-align:center;margin:32px 0;">
              <a href="${resetUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;text-decoration:none;padding:16px 40px;border-radius:14px;font-size:16px;font-weight:700;box-shadow:0 8px 25px rgba(59,130,246,0.4);">
                🔐 Reset My Password
              </a>
            </div>

            <p style="color:#64748b;font-size:13px;text-align:center;">
              Or copy this link:<br>
              <a href="${resetUrl}" style="color:#60a5fa;word-break:break-all;">${resetUrl}</a>
            </p>

            <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.2);border-radius:12px;padding:16px;margin-top:24px;">
              <p style="color:#fbbf24;font-size:13px;margin:0;">
                ⚠️ If you didn't request this, ignore this email. Your password stays unchanged.
              </p>
            </div>
          </div>

          <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
            <p style="color:#334155;font-size:12px;margin:0;">© 2026 HealthTrack360 · Automated email, do not reply.</p>
          </div>
        </div>
      </body>
    `,
  });

  console.log(`✅ Password reset email sent to ${to}`);
}
