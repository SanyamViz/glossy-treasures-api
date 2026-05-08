const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeCoupon(email, couponCode, discountValue) {
  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#FAF8F5;font-family:Georgia,serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
      <tr><td align="center">
        <table width="600" style="max-width:600px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(196,148,138,0.12);">
          <tr>
            <td style="background:linear-gradient(135deg,#2d1b0e,#C4948A);padding:48px 40px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:28px;font-weight:400;letter-spacing:2px;">Glossy Treasures</h1>
              <p style="color:#fff;margin:16px 0 0;font-size:18px;">✨ Your exclusive gift is here</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;text-align:center;">
              <p style="font-size:16px;color:#2d1b0e;margin:0 0 16px;">Welcome to the Glossy Treasures family!</p>
              <p style="font-size:14px;color:#5c4a37;line-height:1.8;margin:0 0 32px;">
                Here is your exclusive discount code. Use it on your first order and enjoy ${discountValue}% off!
              </p>
              <div style="background:#FAF8F5;border:2px dashed #C4948A;border-radius:12px;padding:24px;margin:0 0 32px;">
                <p style="margin:0 0 8px;font-size:12px;color:#9c7c5a;letter-spacing:3px;text-transform:uppercase;">Your Coupon Code</p>
                <p style="margin:0;font-size:32px;font-weight:700;color:#C4948A;letter-spacing:6px;">${couponCode}</p>
              </div>
              <p style="font-size:13px;color:#9c7c5a;line-height:1.8;">
                Valid on your next purchase at<br/>
                <a href="https://glossytreasures.shop" style="color:#C4948A;">glossytreasures.shop</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <a href="https://glossytreasures.shop/shop/candles" style="display:inline-block;padding:14px 32px;background:#C4948A;color:#fff;text-decoration:none;border-radius:12px;font-size:12px;font-weight:500;letter-spacing:2px;">
                SHOP NOW
              </a>
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
    subject: `🎁 Your ${discountValue}% off coupon is here — Glossy Treasures`,
    html,
  });
}

module.exports = { sendWelcomeCoupon };
