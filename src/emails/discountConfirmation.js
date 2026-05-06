const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendDiscountConfirmation(email, name, code, discountAmount, orderNumber) {
  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#FAF8F5;font-family:Georgia,serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr><td align="center">
        <table width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#2d1b0e,#C4948A);padding:40px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;font-weight:400;">Glossy Treasures</h1>
              <p style="color:#fff;margin:16px 0 0;font-size:18px;">🎉 Your discount has been applied!</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <p style="font-size:16px;color:#2d1b0e;">Hi ${name},</p>
              <p style="font-size:14px;color:#5c4a37;line-height:1.8;">
                Your discount code <strong style="color:#C4948A;">${code}</strong> has been successfully applied to order <strong>#${orderNumber}</strong>.
              </p>
              <div style="background:#D4EDDA;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                <p style="margin:0;font-size:13px;color:#155724;">You saved</p>
                <p style="margin:8px 0 0;font-size:32px;font-weight:700;color:#155724;">₹${discountAmount}</p>
              </div>
              <p style="font-size:13px;color:#9c7c5a;text-align:center;">
                Thank you for shopping with Glossy Treasures! 🕯️
              </p>
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`;

  await resend.emails.send({
    from: 'Glossy Treasures <orders@glossytreasures.shop>',
    to: email,
    subject: `🎉 You saved ₹${discountAmount} on order #${orderNumber}!`,
    html,
  });
}

module.exports = { sendDiscountConfirmation };
