const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a welcome email with the discount code to the user.
 * @param {string} email - Customer's email address
 */
async function sendWelcomeEmail(email) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Glossy Treasures</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF8F5; font-family: 'Georgia', serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(196,148,138,0.12);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d1b0e 0%, #C4948A 100%); padding: 48px 40px; text-align:center;">
              <div style="font-size: 11px; letter-spacing: 4px; color: #ffffff; text-transform: uppercase; margin-bottom: 12px; opacity: 0.9;">Handcrafted with Love</div>
              <h1 style="margin:0; color:#fff; font-size:32px; font-weight:400; letter-spacing:2px;">Glossy Treasures</h1>
              <div style="margin-top: 20px; width: 60px; height: 2px; background: #ffffff; margin-left: auto; margin-right: auto; opacity: 0.6;"></div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 40px 0; text-align:center;">
              <p style="margin:0; font-size:24px; color:#2d1b0e; line-height:1.7;">
                Welcome to our family! ✨
              </p>
              <p style="margin: 16px 0 0; font-size:16px; color:#5c4a37; line-height:1.8;">
                We're so glad you're here. As promised, here is your special 10% off code for your first order:
              </p>
              <div style="margin-top: 24px; padding: 20px; background: #fdf6ee; border: 2px dashed #C4948A; border-radius: 8px;">
                <p style="margin:0; font-size:24px; font-weight:bold; color:#C4948A; letter-spacing: 2px;">
                  ANGEL10
                </p>
              </div>
              <p style="margin: 20px 0 0; font-size:14px; color:#7a6252; font-style:italic;">
                Use this code at checkout to enjoy 10% off your entire purchase. No minimums.
              </p>
            </td>
          </tr>

          <!-- Footer Message -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align:center;">
                <p style="margin:0; font-size:14px; color:#7a6252; line-height:1.8;">
                  Have questions? Connect with us on WhatsApp or Instagram.
                </p>
                <div style="margin-top: 20px;">
                  <a href="https://wa.me/918544911357" style="display:inline-block; padding: 10px 20px; background-color: #25D366; color: white; text-decoration: none; border-radius: 30px; font-size: 14px; margin-right: 10px;">WhatsApp</a>
                  <a href="https://instagram.com/glossy_treasures" style="display:inline-block; padding: 10px 20px; background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color: white; text-decoration: none; border-radius: 30px; font-size: 14px;">Instagram</a>
                </div>
              </div>

              <div style="margin: 40px auto 32px; width:40px; height:2px; background: #C4948A;"></div>

              <p style="margin:0; font-size:13px; color:#9c7c5a; text-align:center; line-height:1.6;">
                With love & light,<br/>
                <strong style="color:#C4948A; font-size:15px;">The Glossy Treasures Team 🕯️</strong>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  await resend.emails.send({
    from: 'Glossy Treasures <orders@glossytreasures.shop>',
    to: email,
    subject: `Your 10% Off Welcome Code! 🎉`,
    html,
  });
}

module.exports = { sendWelcomeEmail };
