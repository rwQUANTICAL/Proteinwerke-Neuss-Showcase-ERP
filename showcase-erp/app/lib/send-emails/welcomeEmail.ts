import sgMail from "@sendgrid/mail";
import { escapeHtml } from "@/app/lib/send-emails/escapeHtml";

sgMail.setApiKey(process.env.SEND_GRID_KEY!);

export async function sendWelcomeEmail({
  to,
  name,
  password,
  loginUrl,
}: {
  to: string;
  name: string;
  password: string;
  loginUrl: string;
}) {
  const html = buildWelcomeHtml({ name, email: to, password, loginUrl });

  await sgMail.send({
    to,
    from: {
      email: "noreply.erp@quantical.com",
      name: "Protein und Ölwerk Neuss",
    },
    subject: "Ihr Benutzerkonto wurde erstellt",
    html,
    trackingSettings: {
      clickTracking: { enable: false, enableText: false },
    },
  });
}

function buildWelcomeHtml({
  name,
  email,
  password,
  loginUrl,
}: {
  name: string;
  email: string;
  password: string;
  loginUrl: string;
}) {
  // Colors matching the "proteinwerke" daisyUI theme
  const primary = "#4a7c18";
  const primaryContent = "#ffffff";
  const cardBg = "#ffffff";
  const pageBg = "#f5f5f5";
  const subtleBg = "#f9fafb";
  const border = "#e5e7eb";
  const text = "#1f2937";
  const textMuted = "#6b7280";
  const headerBg = "#3d4a2c";
  const headerText = "#f3f4f6";

  const font =
    "'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ihr Benutzerkonto</title>
</head>
<body style="margin:0;padding:0;background-color:${pageBg};font-family:${font};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${pageBg};padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:${cardBg};border-radius:8px;overflow:hidden;border:1px solid ${border};">
          <!-- Header -->
          <tr>
            <td style="background-color:${headerBg};padding:28px 40px;text-align:center;">
              <img
                src="https://raw.githubusercontent.com/rwQUANTICAL/Proteinwerke-Neuss-Showcase-ERP/main/showcase-erp/public/logo-thywissen.svg"
                alt="Logo"
                width="44"
                height="36"
                style="display:inline-block;vertical-align:middle;margin-right:14px;"
              />
              <span style="color:${headerText};font-size:18px;font-weight:600;vertical-align:middle;letter-spacing:0.01em;">
                Protein und Ölwerk Neuss
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 40px 48px;">
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:${primary};letter-spacing:-0.01em;">
                Willkommen, ${escapeHtml(name)}!
              </h1>
              <p style="margin:0 0 32px;font-size:15px;line-height:1.7;color:${textMuted};">
                Ihr Benutzerkonto für das ERP-System wurde erstellt.
                Nachfolgend finden Sie Ihre Zugangsdaten:
              </p>

              <!-- Credentials box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${subtleBg};border-radius:8px;border:1px solid ${border};margin-bottom:32px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;font-size:14px;color:${textMuted};">E-Mail</td>
                        <td style="padding:8px 0;font-size:14px;color:${text};text-align:right;font-weight:600;">
                          ${escapeHtml(email)}
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:0;"><div style="border-bottom:1px solid ${border};"></div></td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;font-size:14px;color:${textMuted};">Passwort</td>
                        <td style="padding:8px 0;font-size:14px;color:${text};text-align:right;font-weight:600;font-family:'Geist Mono',Consolas,monospace;letter-spacing:0.02em;">
                          ${escapeHtml(password)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-top:4px;">
                    <a
                      href="${escapeHtml(loginUrl)}"
                      style="display:inline-block;background-color:${primary};color:${primaryContent};text-decoration:none;font-size:14px;font-weight:600;padding:14px 40px;border-radius:6px;letter-spacing:0.01em;"
                    >
                      Jetzt anmelden
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:${textMuted};">
                Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px;"><div style="border-top:1px solid ${border};"></div></td>
          </tr>
          <tr>
            <td style="padding:24px 40px 28px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${textMuted};line-height:1.6;">
                &copy; ${new Date().getFullYear()} Protein und Ölwerk Neuss &mdash; Showcase ERP
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}


