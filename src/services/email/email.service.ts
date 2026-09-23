export interface SendEmailOptions {
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export interface PartnerActivationEmailOptions {
  email: string;
  name: string;
  otp: string;
  temporaryPassword?: string;
}

export interface PasswordResetEmailOptions {
  email: string;
  name?: string;
  otp: string;
}

/**
 * Send an email via Brevo's Transactional Email API (v3).
 */
export async function sendEmail(options: SendEmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM || "no-reply@ivora.trade";
  const senderName = process.env.EMAIL_FROM_NAME || "Ivora Business Management";

  if (!apiKey) {
    // In local development or testing without API key, log to server console
    console.warn("[Brevo Email Service - Dev Mode]: BREVO_API_KEY is not configured.");
    console.info(`[Email Dispatch Simulation] To: ${options.to.map((t) => t.email).join(", ")}, Subject: ${options.subject}`);
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: options.to,
        subject: options.subject,
        htmlContent: options.htmlContent,
        textContent: options.textContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Brevo Email Error]", response.status, errorData);
      return {
        success: false,
        error: `Brevo API returned status ${response.status}: ${JSON.stringify(errorData)}`,
      };
    }

    const data = await response.json();
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error("[Brevo Network Error]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown email transmission error",
    };
  }
}

/**
 * Send Partner Onboarding and Activation OTP email.
 */
export async function sendPartnerActivationOtpEmail(options: PartnerActivationEmailOptions): Promise<{ success: boolean; error?: string }> {
  const { email, name, otp, temporaryPassword } = options;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
        .card { background: #ffffff; max-width: 540px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 20px; font-weight: 800; letter-spacing: 0.05em; color: #0c0d12; margin-bottom: 24px; text-transform: uppercase; }
        h1 { font-size: 18px; font-weight: 700; color: #0c0d12; margin-top: 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
        .otp-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0c0d12; font-family: monospace; }
        .credentials-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">IVORA</div>
        <h1>Welcome to Ivora Partner Portal</h1>
        <p>Hello <strong>${name}</strong>,</p>
        <p>An administrator has created your Partner account on Ivora Business Management System. Please verify your email and activate your account using the verification code below:</p>
        
        <div class="otp-box">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px;">Your 6-Digit Activation Code</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Valid for 10 minutes • Single-use only</div>
        </div>

        ${
          temporaryPassword
            ? `<div class="credentials-box">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase;">Temporary Password</p>
                <code style="font-size: 14px; font-weight: 600; color: #0c0d12; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code>
                <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">You will be required to create your own secure password upon verification.</p>
              </div>`
            : ""
        }

        <p>If you did not expect this invitation, please contact your workspace administrator immediately.</p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} Ivora Business Management System. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email, name }],
    subject: "Activate Your Ivora Partner Account",
    htmlContent,
    textContent: `Welcome to Ivora, ${name}. Your account activation code is: ${otp}. This code expires in 10 minutes.`,
  });
}

/**
 * Send Password Reset OTP email.
 */
export async function sendPasswordResetOtpEmail(options: PasswordResetEmailOptions): Promise<{ success: boolean; error?: string }> {
  const { email, name, otp } = options;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
        .card { background: #ffffff; max-width: 540px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 20px; font-weight: 800; letter-spacing: 0.05em; color: #0c0d12; margin-bottom: 24px; text-transform: uppercase; }
        h1 { font-size: 18px; font-weight: 700; color: #0c0d12; margin-top: 0; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 12px 0; }
        .otp-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0c0d12; font-family: monospace; }
        .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">IVORA</div>
        <h1>Password Reset Request</h1>
        <p>Hello${name ? ` <strong>${name}</strong>` : ""},</p>
        <p>We received a request to reset the password for your Ivora account. Use the one-time code below to complete your password reset:</p>
        
        <div class="otp-box">
          <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748b; margin-bottom: 6px;">Password Reset Code</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 6px;">Valid for 10 minutes • Single-use only</div>
        </div>

        <p>If you did not request a password reset, you can safely ignore this email. Your current password remains secure.</p>

        <div class="footer">
          &copy; ${new Date().getFullYear()} Ivora Business Management System. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: [{ email, name: name || email }],
    subject: "Reset Your Ivora Password",
    htmlContent,
    textContent: `Your Ivora password reset code is: ${otp}. This code expires in 10 minutes.`,
  });
}
