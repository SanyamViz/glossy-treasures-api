const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Formats a number as Indian Rupees
 */
function formatINR(amount) {
  return `₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/**
 * Returns estimated delivery date string (5 days from now)
 */
function getEstimatedDelivery() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
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
 * Sends a beautiful HTML order confirmation email to the customer.
 * @param {object} order - Full Prisma Order object including items[]
 */
async function sendOrderConfirmation(order) {
  const estimatedDelivery = getEstimatedDelivery();
  const itemRows = buildItemRows(order.items);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Confirmed – Glossy Treasures</title>
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
              <div style="margin-top: 20px; font-size: 18px; color: #ffffff; font-weight: 400;">✨ Your order is confirmed!</div>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 40px 40px 0;">
              <p style="margin:0; font-size:18px; color:#2d1b0e; line-height:1.7;">
                Thank you <strong>${order.name}</strong>!
              </p>
              <p style="margin: 12px 0 0; font-size:16px; color:#5c4a37; line-height:1.8;">
                Your order <strong>#${order.orderNumber}</strong> has been confirmed and is now being lovingly prepared.
              </p>
              <div style="margin-top: 24px; padding: 16px; background: #fdf6ee; border-left: 4px solid #C4948A; border-radius: 4px;">
                <p style="margin:0; font-size:14px; color:#7a6252; font-style:italic;">
                  "Angel will handcraft your order with love and ship it within 2-3 days." 🕯️
                </p>
              </div>
            </td>
          </tr>

          <!-- Order Info Box -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; border: 1px solid #e8d5b5;">
                <tr>
                  <td style="padding: 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:50%; padding-bottom: 12px;">
                          <div style="font-size:11px; color:#9c7c5a; text-transform:uppercase; letter-spacing:2px;">Order Number</div>
                          <div style="font-size:16px; font-weight:700; color:#C4948A; margin-top:4px;">#${order.orderNumber}</div>
                        </td>
                        <td style="width:50%; padding-bottom: 12px; text-align:right;">
                          <div style="font-size:11px; color:#9c7c5a; text-transform:uppercase; letter-spacing:2px;">Payment</div>
                          <div style="font-size:14px; color:#5c4a37; margin-top:4px;">${order.paymentMethod}</div>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <div style="font-size:11px; color:#9c7c5a; text-transform:uppercase; letter-spacing:2px;">Est. Delivery</div>
                          <div style="font-size:14px; color:#5c4a37; margin-top:4px;">${estimatedDelivery}</div>
                        </td>
                        <td style="text-align:right;">
                           <div style="font-size:11px; color:#9c7c5a; text-transform:uppercase; letter-spacing:2px;">Support</div>
                           <div style="font-size:14px; color:#5c4a37; margin-top:4px;">
                             <a href="https://wa.me/918544911357" style="color:#C4948A; text-decoration:none;">WhatsApp Us</a>
                           </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <div style="font-size:13px; letter-spacing:3px; text-transform:uppercase; color:#9c7c5a; margin-bottom:16px;">Order Summary</div>
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
                    <td colspan="2" style="padding: 20px 8px 8px; text-align:right; font-size:13px; color:#5c4a37; font-weight:600; letter-spacing:1px; text-transform:uppercase;">Order Total</td>
                    <td style="padding: 20px 8px 8px; text-align:right; font-size:20px; font-weight:700; color:#C4948A;">${formatINR(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding: 32px 40px 0;">
              <div style="font-size:13px; letter-spacing:3px; text-transform:uppercase; color:#9c7c5a; margin-bottom:16px;">Shipping Address</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF8F5; border-radius:10px; border:1px solid #e8d5b5;">
                <tr>
                  <td style="padding:20px 24px; font-size:14px; color:#5c4a37; line-height:1.8;">
                    <strong style="color:#2d1b0e;">${order.name}</strong><br/>
                    ${order.address}<br/>
                    ${order.city}, ${order.state} – ${order.pincode}<br/>
                    📞 ${order.phone}
                  </td>
                </tr>
              </table>
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
    from: 'Glossy Treasures <Glossy Treasures <orders@glossytreasures.shop>',
    to: order.email,
    subject: `Your Glossy Treasures order is confirmed! 🎉 #${order.orderNumber}`,
    html,
  });
}

module.exports = { sendOrderConfirmation };
