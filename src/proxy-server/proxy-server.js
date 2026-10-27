import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import "dotenv/config";

const app = express();
const PORT = 7777;

const token = process.env.TCDD_TOKEN;
const xsrfToken = process.env.TCDD_XSRF_TOKEN;
const captchaSession = process.env.TCDD_CAPTCHA_SESSION;
// Tarayıcıdaki Cookie header'ının tamamı (DevTools > Network > Request Headers > Cookie)
const cookie = process.env.TCDD_COOKIE;

const headers = {
  Accept: "application/json, text/plain, */*",
  "Accept-Encoding": "gzip, deflate, br, zstd",
  "Accept-Language": "tr",
  Authorization: token,
  "Content-Type": "application/json",
  Cookie: cookie,
  Origin: "https://ebilet.tcddtasimacilik.gov.tr",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-site",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36",
  "X-TMS-XSRF-TOKEN": xsrfToken,
  "captcha-session": captchaSession,
  "sec-ch-ua": '"Google Chrome";v="155", "Chromium";v="155", "Not(A:Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "unit-id": "3895",
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all("/proxy", async (req, res) => {
  try {
    const targetUrl = req.query.url;

    if (!targetUrl) {
      return res.status(400).json({ error: "url parametresi eksik" });
    }

    const hasBody = !["GET", "HEAD"].includes(req.method);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: hasBody ? JSON.stringify(req.body) : undefined,
    });

    const text = await response.text();

    if (!response.ok) {
      console.error(`❌ TCDD ${response.status}:`, text.slice(0, 500));
    }

    res
      .status(response.status)
      .type(response.headers.get("content-type") || "application/json")
      .send(text);
  } catch (error) {
    console.error("❌ Proxy hatası:", error.message);
    res.status(500).json({ error: "Proxy isteği başarısız oldu" });
  }
});


app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor...`);
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post("/send-mail", async (req, res) => {
  const { email, data } = req.body;

  if (!email || !data) {
    return res.status(400).json({ error: "email veya data eksik" });
  }

  try {
    const info = await transporter.sendMail({
      from: `"Tren Bulucu" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Tren Bulundu",
      html: data,
    });

    console.log("✅ Mail gönderildi:", info.messageId);
    res.status(200).json({ message: "Mail gönderildi" });
  } catch (error) {
    console.error("❌ Mail gönderme hatası:", error.message);
    res.status(500).json({ error: "Mail gönderilemedi" });
  }
});
