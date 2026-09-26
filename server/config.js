import dotenv from "dotenv";

dotenv.config({ quiet: true });

const env = process.env;

export const config = {
  port: Number(env.PORT || 3001),
  isProduction: env.NODE_ENV === "production",

  /** Public URL of the web app. Used for links inside emails (password reset,
   * "view my ticket"). Never derived from the request, so a forged Origin/Host
   * header can't redirect a reset link to someone else's site. */
  appUrl: (env.APP_URL || "http://localhost:5173").replace(/\/+$/, ""),

  db: {
    host: env.DB_HOST || "127.0.0.1",
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || "root",
    password: env.DB_PASSWORD || "",
    database: env.DB_NAME || "showup",
  },

  sessionDays: 30,
  passwordResetMinutes: 60,

  // Notification providers — each channel is a no-op until configured.
  resendApiKey: env.RESEND_API_KEY || "",
  resendFrom: env.RESEND_FROM || "ShowUp <onboarding@resend.dev>",
  twoFactorApiKey: env.TWOFACTOR_API_KEY || "",
  fast2smsApiKey: env.FAST2SMS_API_KEY || "",
  twilioAccountSid: env.TWILIO_ACCOUNT_SID || "",
  twilioAuthToken: env.TWILIO_AUTH_TOKEN || "",
  twilioSmsFrom: env.TWILIO_SMS_FROM || "",
  twilioWhatsappFrom: env.TWILIO_WHATSAPP_FROM || "",
};
