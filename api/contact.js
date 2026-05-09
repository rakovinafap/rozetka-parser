const nodemailer = require('nodemailer')

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, message } = req.body

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is empty' })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'New message from Rozetka Parser',
      text: `
Email: ${email || 'not provided'}

Message:
${message}
      `
    })

    return res.json({ success: true })
  } catch (e) {
    return res.status(500).json({ error: 'Email error' })
  }
}