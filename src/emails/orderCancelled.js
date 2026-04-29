const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Formats a number as Indian Rupees
 */
function formatINR(amount) {
  return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * Builds an HTML row for each order item
 */
function buildItemRows(items) {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #f0e6d3;">
        <div style="font-weight: 600; color: #2d1b0e; font-size: 14px;">${item.productName}</div>
        <div style="font-size: 12px; color: #9c7c5a; margin-top: 3px;">
          ${item.category}
          ${item.selectedSize ? ` &bull; Size: ${item.selectedSize}` : ''}
          ${item.selectedFragrance ? ` &bull; ${item.category === 'candle' ? 'Fragrance' : 'Options'}: ${item.selectedFragrance}` : ''}
        </div>
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #f0e6d3; text-align: center; color: #5c4a37; font-size: 14px;">
        x${item.quantity}
      </td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #f0e6d3; text-align: right; font-weight: 600; color: #b07d4a; font-size: 14px;">
        ${formatINR(item.price * item.quantity)}
      </td>
    </tr>`
    )
    .join('');
}

/**
 * Sends an HTML order cancellation email to the customer.
 * @param {object} order - Full Prisma Order object including items[]
 */
async function sendOrderCancelled(order) {
  const itemRows = buildItemRows(order.items);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Cancelled – Glossy Treasures</title>
</head>
<body style="margin:0; padding:0; background-color:#FAF8F5; font-family: 'Georgia', serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(196,148,138,0.12);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%); padding: 48px 40px; text-align:center;">
              <div style="font-size: 11px; letter-spacing: 4px; color: #ffffff; text-transform: uppercase; margin-bottom: 12px; opacity: 0.9;">Glossy Treasures</div>
              <h1 style="margin:0; color:#fff; font-size:32px; font-weight:400; letter-spacing:2px;">Order Cancelled</h1>
              <div style="margin-top: 20px; width: 60px; height: 2px; background: #ffffff; margin-left: auto; margin-right: auto; opacity: 0.6;"></div>
            </td>
          </tr>

          <!-- Message -->
          <tr>
            <td style="padding: 40px 40px 0;">
              <p style="margin:0; font-size:18px; color:#2d1b0e; line-height:1.7;">
                Hello <strong>${order.name}</strong>,
              </p>
              <p style="margin: 12px 0 0; font-size:16px; color:#5c4a37; line-height:1.8;">
                Your order <strong>#${order.orderNumber}</strong> has been cancelled.
              </p>
              ${order.paymentMethod !== 'cod' ? `
              <div style="margin-top: 24px; padding: 16px; background: #fdf6ee; border-left: 4px solid #C4948A; border-radius: 4px;">
                <p style="margin:0; font-size:14px; color:#7a6252;">
                  <strong>Refund Information:</strong> Since you paid via ${order.paymentMethod}, your refund of <strong>${formatINR(order.total)}</strong> has been initiated and should reflect in your account within 5-7 business days.
                </p>
              </div>
              ` : ''}
              
              <div style="margin-top: 32px; padding: 24px; border: 1px dashed #C4948A; border-radius: 12px; text-align: center; background-color: #fff9f8;">
                <h3 style="margin: 0; color: #2d1b0e; font-size: 18px;">A little something for next time... ✦</h3>
                <p style="margin: 8px 0 16px; font-size: 14px; color: #5c4a37;">We're sorry this order didn't work out. Use this code for 10% off your next purchase:</p>
                <div style="display: inline-block; padding: 12px 24px; background: #C4948A; color: #fff; font-size: 20px; font-weight: 700; letter-spacing: 2px; border-radius: 8px;">
                  THANKYOU10
                </div>
              </div>
            </td>
          </tr>

          <!-- Summary -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <div style="font-size:13px; letter-spacing:3px; text-transform:uppercase; color:#9c7c5a; margin-bottom:16px;">Cancelled Items</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="background:#FAF8F5;">
                    <th style="padding: 10px 8px; text-align:left; font-size:11px; color:#9c7c5a; letter-spacing:2px; text-transform:uppercase; font-weight:600; border-bottom: 2px solid #e8d5b5;">Item</th>
                    <th style="padding: 10px 8px; text-align:center; font-size:11px; color:#9c7c5a; letter-spacing:2px; text-transform:uppercase; font-weight:600; border-bottom: 2px solid #e8d5b5;">Qty</th>
                    <th style="padding: 10px 8px; text-align:right; font-size:11px; color:#9c7c5a; letter-spacing:2px; text-transform:uppercase; font-weight:600; border-bottom: 2px solid #e8d5b5;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 20px 8px 8px; text-align:right; font-size:13px; color:#5c4a37; font-weight:600; letter-spacing:1px; text-transform:uppercase;">Total Amount</td>
                    <td style="padding: 20px 8px 8px; text-align:right; font-size:20px; font-weight:700; color:#C4948A;">${formatINR(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin:0; font-size:13px; color:#9c7c5a; text-align:center; line-height:1.6;">
                If you have any questions, please contact us on <a href="https://wa.me/918544911357" style="color:#C4948A; text-decoration:none;">WhatsApp</a>.
              </p>
              <div style="margin: 32px auto 24px; width:40px; height:2px; background: #C4948A;"></div>
              <p style="margin:0; font-size:13px; color:#9c7c5a; text-align:center; line-height:1.6;">
                With love,<br/>
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
    to: order.email,
    subject: `Your Glossy Treasures order has been cancelled #${order.orderNumber}`,
    html,
  });
}

module.exports = { sendOrderCancelled };
