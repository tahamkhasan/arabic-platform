import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'منصة مساعد اللغة العربية <onboarding@resend.dev>'
const ADMIN_EMAIL = 'tahamkhasan@gmail.com'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mosaed-arabic.vercel.app'

const STAGE_NAMES: Record<string, string> = {
  primary: 'ابتدائي',
  middle: 'متوسط',
  high: 'ثانوي',
}

const IS_TEST_MODE = true

function getRecipient(email: string) {
  return IS_TEST_MODE ? ADMIN_EMAIL : email
}

// ── إيميل استلام طلب التسجيل ──
export async function sendRegistrationEmail(user: {
  name: string
  email: string
  userType: string
  allowedStages: string[]
  allowedGrades: string[]
}) {
  const stagesText = user.allowedStages.map(s => STAGE_NAMES[s] || s).join('، ')
  const gradesText = user.allowedGrades.join('، ')

  await resend.emails.send({
    from: FROM,
    to: getRecipient(user.email),
    subject: '📨 تم استلام طلب تسجيلك — منصة مساعد اللغة العربية',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1117; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg,#f9d423,#ff4e50); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #1a1a2e; font-size: 24px;">🌙 منصة مساعد اللغة العربية</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #f9d423;">تم استلام طلب التسجيل يا ${user.name} 👋</h2>
          <p style="color: #a0aec0; line-height: 1.8;">تم استلام طلبك بنجاح، وسيتم مراجعته من الإدارة قريباً.</p>
          <div style="background: #161b22; border-radius: 12px; padding: 20px; margin: 20px 0; border-right: 4px solid #f9d423;">
            <p style="margin: 0 0 8px;"><strong style="color: #f9d423;">الاسم:</strong> <span style="color: #e2e8f0;">${user.name}</span></p>
            <p style="margin: 0 0 8px;"><strong style="color: #f9d423;">الإيميل:</strong> <span style="color: #e2e8f0;">${user.email}</span></p>
            <p style="margin: 0 0 8px;"><strong style="color: #f9d423;">نوع الحساب:</strong> <span style="color: #e2e8f0;">${user.userType === 'teacher' ? '👨‍🏫 معلم' : '👨‍🎓 طالب'}</span></p>
            <p style="margin: 0 0 8px;"><strong style="color: #f9d423;">المراحل:</strong> <span style="color: #e2e8f0;">${stagesText}</span></p>
            ${user.userType === 'student' ? `<p style="margin: 0;"><strong style="color: #f9d423;">الصف:</strong> <span style="color: #e2e8f0;">${gradesText}</span></p>` : ''}
          </div>
          <p style="color: #718096; font-size: 13px;">سيصلك إشعار عند قبول الطلب أو رفضه.</p>
          <p style="color: #4a5568; font-size: 12px; margin-top: 32px;">منصة مساعد اللغة العربية • الكويت 🇰🇼</p>
        </div>
      </div>
    `,
  })
}

// ── إيميل الموافقة ──
export async function sendApprovalEmail(user: {
  name: string
  email: string
  userType: string
  allowedStages: string[]
  allowedGrades: string[]
}) {
  const stagesText = user.allowedStages.map(s => STAGE_NAMES[s] || s).join('، ')

  await resend.emails.send({
    from: FROM,
    to: getRecipient(user.email),
    subject: `✅ تمت الموافقة على حساب ${user.name}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1117; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg,#43e97b,#38f9d7); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #1a1a2e; font-size: 24px;">✅ تمت الموافقة على حسابك!</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #43e97b;">أهلاً ${user.name} 🎉</h2>
          <p style="color: #a0aec0; line-height: 1.8;">يسعدنا إخبارك بأنه تمت الموافقة على طلب تسجيلك في منصة مساعد اللغة العربية.</p>
          <div style="background: #161b22; border-radius: 12px; padding: 20px; margin: 20px 0; border-right: 4px solid #43e97b;">
            <p style="margin: 0 0 8px;"><strong style="color: #43e97b;">نوع الحساب:</strong> <span style="color: #e2e8f0;">${user.userType === 'teacher' ? '👨‍🏫 معلم' : '👨‍🎓 طالب'}</span></p>
            <p style="margin: 0 0 8px;"><strong style="color: #43e97b;">المراحل المتاحة:</strong> <span style="color: #e2e8f0;">${stagesText}</span></p>
            ${user.userType === 'student' ? `<p style="margin: 0;"><strong style="color: #43e97b;">الصف:</strong> <span style="color: #e2e8f0;">${user.allowedGrades.join('، ')}</span></p>` : ''}
          </div>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${APP_URL}/login" style="background: linear-gradient(135deg,#f9d423,#ff4e50); color: #1a1a2e; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 16px;">
              دخول المنصة ←
            </a>
          </div>
          <p style="color: #4a5568; font-size: 12px; margin-top: 32px;">منصة مساعد اللغة العربية • الكويت 🇰🇼</p>
        </div>
      </div>
    `,
  })
}

// ── إيميل الرفض ──
export async function sendRejectionEmail(user: { name: string; email: string }) {
  await resend.emails.send({
    from: FROM,
    to: getRecipient(user.email),
    subject: `❌ تم رفض طلب ${user.name}`,
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1117; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg,#fc8181,#feb2b2); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #1a1a2e; font-size: 24px;">بخصوص طلب تسجيلك</h1>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #fc8181;">أهلاً ${user.name}</h2>
          <p style="color: #a0aec0; line-height: 1.8;">نأسف لإخبارك بأنه تم رفض طلب تسجيلك في منصة مساعد اللغة العربية.</p>
          <p style="color: #a0aec0;">للاستفسار أو تقديم طلب جديد، تواصل مع الإدارة.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${APP_URL}/register" style="background: linear-gradient(135deg,#fc8181,#feb2b2); color: #1a1a2e; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 16px;">
              إنشاء طلب جديد ←
            </a>
          </div>
          <p style="color: #4a5568; font-size: 12px; margin-top: 32px;">منصة مساعد اللغة العربية • الكويت 🇰🇼</p>
        </div>
      </div>
    `,
  })
}

// ── إيميل إعادة تعيين كلمة المرور ──
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  await resend.emails.send({
    from: FROM,
    to: getRecipient(email),
    subject: '🔑 إعادة تعيين كلمة المرور — منصة مساعد اللغة العربية',
    html: `
      <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1117; color: #e2e8f0; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg,#4facfe,#00f2fe); padding: 32px; text-align: center;">
          <h1 style="margin: 0; color: #1a1a2e; font-size: 24px;">🔑 إعادة تعيين كلمة المرور</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #a0aec0; line-height: 1.8;">تلقينا طلباً لإعادة تعيين كلمة مرور الحساب: <strong style="color: #4facfe;">${email}</strong></p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${resetLink}" style="background: linear-gradient(135deg,#4facfe,#00f2fe); color: #1a1a2e; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 900; font-size: 16px;">
              تعيين كلمة مرور جديدة 🔑
            </a>
          </div>
          <p style="color: #718096; font-size: 13px;">إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.</p>
          <p style="color: #4a5568; font-size: 12px; margin-top: 32px;">منصة مساعد اللغة العربية • الكويت 🇰🇼</p>
        </div>
      </div>
    `,
  })
}