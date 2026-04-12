import nodemailer from "nodemailer";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, subject, text, attachments } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "briblue83.piscine@gmail.com",
      pass: "ztxxdmapqzosfldu",
    },
  });

  try {
    await transporter.sendMail({
      from: '"BRIBLUE Piscines" <briblue83.piscine@gmail.com>',
      to,
      subject,
      text,
      attachments: attachments?.map(a => ({
        filename: a.filename,
        content: Buffer.from(a.content, "base64"),
        contentType: "text/html",
      })),
    });
    return res.status(200).json({ id: "ok" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
