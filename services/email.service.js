const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    console.log("Email is not configured, skipping email to", to);
    return;
  }
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
  } catch (e) {
    console.log("Failed to send email:", e.message);
  }
};

const formatPrice = (value) => `${Number(value).toFixed(2)} EGP`;

const buildItemsTable = (items) => {
  const rows = items
    .map(
      (item) => `<tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatPrice(item.price)}</td>
        <td>${formatPrice(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join("");
  return `<table border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr><th>Product</th><th>Quantity</th><th>Price</th><th>Total</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
};

const sendOrderConfirmationEmail = async (user, order) => {
  const html = `<h2>Thank you for your order, ${user.name}</h2>
    <p>Your order <strong>${order._id}</strong> has been placed successfully.</p>
    ${buildItemsTable(order.items)}
    <ul>
      <li>Subtotal: ${formatPrice(order.subtotal)}</li>
      <li>Shipping fee: ${formatPrice(order.shippingFee)}</li>
      <li>Tax (14%): ${formatPrice(order.tax)}</li>
      <li>Discount: ${formatPrice(order.discount)}</li>
      <li><strong>Total: ${formatPrice(order.totalPrice)}</strong></li>
    </ul>
    <p>Payment method: ${order.paymentMethod}</p>`;

  await sendEmail({
    to: user.email,
    subject: `Order confirmation - ${order._id}`,
    html,
  });
};

const STATUS_MESSAGES = {
  confirmed: "Your order has been confirmed and is being prepared.",
  processing: "Your order is now being processed.",
  shipped: "Your order has been shipped and is on its way.",
  delivered: "Your order has been delivered. Enjoy your purchase!",
  cancelled: "Your order has been cancelled.",
  returned: "Your order has been marked as returned.",
};

const sendOrderStatusEmail = async (user, order) => {
  const html = `<h2>Hello ${user.name}</h2>
    <p>The status of your order <strong>${order._id}</strong> is now
      <strong>${order.status}</strong>.</p>
    <p>${STATUS_MESSAGES[order.status] || ""}</p>
    <p>Order total: ${formatPrice(order.totalPrice)}</p>`;

  await sendEmail({
    to: user.email,
    subject: `Order ${order.status} - ${order._id}`,
    html,
  });
};

module.exports = {
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
};
