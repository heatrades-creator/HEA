import { Resend } from "resend";
import { prisma } from "@/lib/db";

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple in-memory rate limiting (use redis for production)
const rateLimitMap = new Map();

function rateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 3;

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }

  const requests = rateLimitMap.get(ip).filter((time) => now - time < windowMs);

  if (requests.length >= maxRequests) {
    return false;
  }

  requests.push(now);
  rateLimitMap.set(ip, requests);
  return true;
}

// Email validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Spam detection (basic)
function detectSpam(message) {
  const spamKeywords = ["crypto", "bitcoin", "lottery", "winner", "click here"];
  const lowerMessage = message.toLowerCase();
  return spamKeywords.some((keyword) => lowerMessage.includes(keyword));
}

async function sendTelegram({ name, email, phone, service, message, solarTier }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = `\u{1F4E9} New Contact Form Submission

Name: ${name}
Email: ${email}
Phone: ${phone}
Service: ${service}
${solarTier ? `Solar Tier: ${solarTier}` : ''}
Message: ${message}`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

export async function POST(request) {
  try {
    // Get IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit
    if (!rateLimit(ip)) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, phone, service, message, solarTier } = body;

    // validate requires fields
    if (!name || !email || !phone || !service || !message) {
      return Response.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // validate email format
    if (!isValidEmail(email)) {
      return Response.json(
        { error: "Invalid email address." },
        { status: 400 }
      );
    }

    // Basic spam detection
    if (detectSpam(message)) {
      return Response.json(
        { error: "Spam detected in the message." },
        { status: 400 }
      );
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitizedData = {
      name: name.substring(0, 100),
      email: email.substring(0, 100),
      phone: phone.substring(0, 20),
      service: service.substring(0, 50),
      message: message.substring(0, 1000),
      solarTier: solarTier ? solarTier.substring(0, 50) : "",
    };

    // Send email using Resend
    const data = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: [process.env.CLIENT_EMAIL],
      replyTo: sanitizedData.email,
      subject: `New Contact: ${sanitizedData.service}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(90deg,rgba(230, 210, 83, 1) 1%, rgba(230, 214, 76, 1) 65%, rgba(66, 54, 199, 1) 100%);
                      color: white; padding: 30px; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .field { margin-bottom: 20px; }
            .label { font-weight: bold; color: #4a5568; margin-bottom: 5px; }
            .value { color: #1a202c; }
            .footer { text-align: center; margin-top: 20px; color: #718096; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">New Contact Form Submission</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${sanitizedData.name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${sanitizedData.email}">${
                  sanitizedData.email
                }</a></div>
              </div>
              <div class="field">
                <div class="label">Phone:</div>
                <div class="value"><a href="tel:${sanitizedData.phone}">${
                  sanitizedData.phone
                }</a></div>
              </div>
              <div class="field">
                <div class="label">Service Interested In:</div>
                <div class="value">${sanitizedData.service}</div>
              </div>
              ${sanitizedData.solarTier ? `
              <div class="field">
                <div class="label">Solar System Tier:</div>
                <div class="value">${sanitizedData.solarTier}</div>
              </div>
              ` : ''}
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${sanitizedData.message.replace(
                  /\n/g,
                  "<br>"
                )}</div>
              </div>
            </div>
            <div class="footer">
              Submitted on ${new Date().toLocaleString("en-AU", {
                timeZone: "Australia/Melbourne",
                dateStyle: "full",
                timeStyle: "short",
              })}
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Optional: Send confirmation email to user
    await resend.emails.send({
      from: "info@hea-group.com.au",
      to: [sanitizedData.email],
      subject: "Thanks for reaching out!",
      html: `
        <h2>Thanks for contacting us, ${sanitizedData.name}!</h2>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p><strong>Your inquiry about:</strong> ${sanitizedData.service}</p>
        ${sanitizedData.solarTier ? `<p><strong>Solar system tier:</strong> ${sanitizedData.solarTier}</p>` : ''}
        <p>Best regards,<br>Heffernan Electrical Automation</p>
      `,
    });

    // Send Telegram notification (non-blocking)
    sendTelegram(sanitizedData).catch((err) =>
      console.error("Telegram error:", err)
    );

    // Save lead to Prisma (non-fatal)
    try {
      const nameParts = sanitizedData.name.trim().split(" ");
      const firstName = nameParts[0];
      const lastName  = nameParts.slice(1).join(" ") || "-";
      await prisma.lead.create({
        data: {
          firstName,
          lastName,
          email:     sanitizedData.email,
          phone:     sanitizedData.phone,
          address:   "Not provided",
          suburb:    "Not provided",
          state:     "VIC",
          postcode:  "0000",
          notes:     `Service: ${sanitizedData.service}\n\n${sanitizedData.message}`,
          leadSource: "website",
          status:    "pending_review",
          auditLog: {
            create: {
              action: "lead_received",
              actor:  "system",
              detail: JSON.stringify({ source: "contact_form", service: sanitizedData.service }),
            },
          },
        },
      });
    } catch (dbErr) {
      console.error("Lead DB save failed:", dbErr);
    }

    return Response.json(
      { success: true, messageId: data.id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email error: ", error);
    return Response.json({ error: "Failed to send email" }, { status: 500 });
  }
}
