import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER, // your Gmail or service account
    pass: process.env.MAIL_PASS, // app password or SMTP password
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  const info = await transporter.sendMail({
    from: `"Mentorship Platform" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log('📧 Email sent:', info.messageId);
};