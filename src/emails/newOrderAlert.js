const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

function formatINR(amount) {
  return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function buildAdminItemRows(items) {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e8d5b5; font-size:14px; color:#2d1b0e;">
        ${item.productName}
        <div style="font-size:12px; color:#7a6252; margin-top:3px;">
          Slug: ${item.productSlug} &bull; ${item.category}
          ${item.selectedSize ? ` &bull; Size: ${item.selectedSize}` : ''}
          ${item.selectedFragrance ? ` &bull; Fragrance: ${item.selectedFragrance}` : ''}
        </div>
      </td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e8d5b5; text-align:center; font-size:14px; color:#5c4a37;">x${item.quantity}</td>
      <td style="padding: 10px 8px; border-bottom: 1px solid #e8d5b5; text-align:right; font-size:14px; font-weight:600; color:#b07d4a;">${formatINR(item.price * item.quantity)}</td>
    </tr>`
    )
    .join('');
}

/**
 * Sends an internal order alert email to the store owner.
 * @param {object} order - Full Prisma Order object including items[]
 */
async function sendNewOrderAlert(order) {
  const adminEmail = process.env.ANGEL_EMAIL || 'glossytreasures@gmail.com';
  const itemRows = buildAdminItemRows(order.items);
  const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Order Alert – Glossy Treasures</title>
</head>
<body style="margin:0; padding:0; background:#1a1008; font-family: 'Arial', sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1008; padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 8px 32px rgba(0,0,0,0.4);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a0a00, #3d1f00, #7a4520); padding:36px 40px; text-align:center;">
              <div style="display:inline-block; background:rgba(255,255,255,0.1); border:1px solid rgba(212,169,106,0.4); border-radius:50px; padding:6px 18px; font-size:11px; color:#d4a96a; letter-spacing:3px; text-transform:uppercase; margin-bottom:16px;">
                🔔 New Order Received
              </div>
              <h1 style="margin:0; color:#fff; font-size:26px; font-weight:400; letter-spacing:2px;">Glossy Treasures</h1>
              <div style="margin-top:12px; font-size:28px; font-weight:700; color:#d4a96a;">
                ${formatINR(order.total)}
              </div>
              <div style="margin-top:6px; font-size:13px; color:#c4a882;">${order.orderNumber}</div>
            </td>
          </tr>

          <!-- Action Banner -->
          <tr>
            <td style="background:#fff8ed; border-bottom:2px solid #e8d5b5; padding:16px 40px;">
              <p style="margin:0; font-size:14px; color:#5c3317; font-weight:600; text-align:center;">
                🕯️ A new order is waiting! Start preparing as soon as possible.
              </p>
            </td>
          </tr>

          <!-- Customer Details -->
          <tr>
            <td style="padding:32px 40px 0;">
              <div style="font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#9c7c5a; margin-bottom:16px;">Customer Details</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8d5b5; border-radius:10px; overflow:hidden;">
                <tr style="background:#fdf6ee;">
                  <td style="padding:12px 20px; font-size:13px; color:#9c7c5a; width:35%; border-bottom:1px solid #f0e6d3;">Name</td>
                  <td style="padding:12px 20px; font-size:14px; color:#2d1b0e; font-weight:600; border-bottom:1px solid #f0e6d3;">${order.name}</td>
                </tr>
                <tr>
                  <td style="padding:12px 20px; font-size:13px; color:#9c7c5a; border-bottom:1px solid #f0e6d3;">Email</td>
                  <td style="padding:12px 20px; font-size:14px; color:#2d1b0e; border-bottom:1px solid #f0e6d3;">
                    <a href="mailto:${order.email}" style="color:#b07d4a; text-decoration:none;">${order.email}</a>
                  </td>
                </tr>
                <tr style="background:#fdf6ee;">
                  <td style="padding:12px 20px; font-size:13px; color:#9c7c5a; border-bottom:1px solid #f0e6d3;">Phone</td>
                  <td style="padding:12px 20px; font-size:14px; color:#2d1b0e; font-weight:600; border-bottom:1px solid #f0e6d3;">
                    <a href="tel:${order.phone}" style="color:#b07d4a; text-decoration:none;">📞 ${order.phone}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 20px; font-size:13px; color:#9c7c5a; border-bottom:1px solid #f0e6d3;">Payment</td>
                  <td style="padding:12px 20px; font-size:14px; color:#2d1b0e; border-bottom:1px solid #f0e6d3;">
                    <span style="background:#e8f5e9; color:#2e7d32; padding:3px 10px; border-radius:20px; font-size:13px; font-weight:600;">
                      ${order.paymentMethod}
                    </span>
                  </td>
                </tr>
                <tr style="background:#fdf6ee;">
                  <td style="padding:12px 20px; font-size:13px; color:#9c7c5a;">Order Date</td>
                  <td style="padding:12px 20px; font-size:13px; color:#5c4a37;">${orderDate}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping Address -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#9c7c5a; margin-bottom:16px;">📦 Ship To</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6ee; border-radius:10px; border:1px solid #e8d5b5;">
                <tr>
                  <td style="padding:20px 24px; font-size:14px; color:#2d1b0e; line-height:1.8;">
                    <strong>${order.name}</strong><br/>
                    ${order.address}<br/>
                    ${order.city}, ${order.state} – ${order.pincode}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="font-size:12px; letter-spacing:3px; text-transform:uppercase; color:#9c7c5a; margin-bottom:16px;">🛒 Items Ordered</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8d5b5; border-radius:10px; overflow:hidden;">
                <thead>
                  <tr style="background:#fdf6ee;">
                    <th style="padding:10px 8px; text-align:left; font-size:11px; color:#9c7c5a; letter-spacing:2px; text-transform:uppercase; font-weight:600; border-bottom:2px solid #e8d5b5;">Product</th>
                    <th style="padding:10px 8px; text-align:center; font-size:11px; color:#9c7c5a; letter-spacing:2px; text-transform:uppercase; font-weight:600; border-bottom:2px solid #e8d5b5;">Qty</th>
                    <th style="padding:10px 8px; text-align:right; font-size:11px; color:#9c7c5a; letter-spacing:2px; text-transform:uppercase; font-weight:600; border-bottom:2px solid #e8d5b5;">Total</th>
                  </tr>
                </thead>
                <tbody>${itemRows}</tbody>
                <tfoot>
                  <tr style="background:#fff8ed;">
                    <td colspan="2" style="padding:16px 8px; text-align:right; font-weight:700; color:#2d1b0e; text-transform:uppercase; letter-spacing:1px; font-size:13px;">Grand Total</td>
                    <td style="padding:16px 8px; text-align:right; font-size:20px; font-weight:700; color:#b07d4a;">${formatINR(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          ${order.giftNote ? `
          <!-- Gift Note -->
          <tr>
            <td style="padding:24px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff9f0; border-radius:10px; border:1px dashed #d4a96a;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:11px; color:#9c7c5a; text-transform:uppercase; letter-spacing:2px; margin-bottom:8px;">🎁 Gift Note (include in package)</div>
                    <div style="font-size:14px; color:#5c4a37; font-style:italic; line-height:1.7;">"${order.giftNote}"</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 40px; text-align:center; border-top:1px solid #f0e6d3; margin-top:24px;">
              <p style="margin:0; font-size:13px; color:#9c7c5a; line-height:1.8;">
                This is an automated alert from your Glossy Treasures store backend.<br/>
                Please pack and ship within 1–2 business days.
              </p>
              <p style="margin:16px 0 0; font-size:11px; color:#c4a882; letter-spacing:2px; text-transform:uppercase;">
                Glossy Treasures Admin System
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
    from: 'Glossy Treasures Store <orders@glossytreasures.shop>',
    to: adminEmail,
    subject: `🛒 New Order ${order.orderNumber} – ${formatINR(order.total)} | ${order.paymentMethod}`,
    html,
  });
}

module.exports = { sendNewOrderAlert };
