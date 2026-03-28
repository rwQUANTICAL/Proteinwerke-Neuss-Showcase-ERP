import sgMail from "@sendgrid/mail";

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
      email: "noreply@proteinwerke-neuss.de",
      name: "Öl & Proteinwerke Neuss",
    },
    subject: "Ihr Benutzerkonto wurde erstellt",
    html,
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
  // Colors from the lemonade daisyUI theme
  const primary = "#519903"; // oklch(65.69% 0.17 126.1) ≈ green
  const primaryContent = "#ffffff";
  const base100 = "#f8fced";
  const base200 = "#e8edda";
  const base300 = "#d8ddc8";
  const baseContent = "#2e3128";
  const neutral = "#3d4a2c";
  const neutralContent = "#dce0d4";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ihr Benutzerkonto</title>
</head>
<body style="margin:0;padding:0;background-color:${base200};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${base200};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:${base100};border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:${neutral};padding:24px 32px;text-align:center;">
              <img
                src="https://raw.githubusercontent.com/rwQUANTICAL/Proteinwerke-Neuss-Showcase-ERP/main/showcase-erp/public/logo-thywissen.svg"
                alt="Logo"
                width="48"
                height="40"
                style="display:inline-block;vertical-align:middle;margin-right:12px;"
              />
              <span style="color:${neutralContent};font-size:20px;font-weight:600;vertical-align:middle;">
                Öl &amp; Proteinwerke Neuss
              </span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:${primary};">
                Willkommen, ${escapeHtml(name)}!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:${baseContent};">
                Ihr Benutzerkonto für das ERP-System wurde erstellt.
                Nachfolgend finden Sie Ihre Zugangsdaten:
              </p>

              <!-- Credentials box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${base200};border-radius:6px;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:${baseContent};">
                          <strong>E-Mail:</strong>
                        </td>
                        <td style="padding:4px 0;font-size:14px;color:${baseContent};text-align:right;">
                          ${escapeHtml(email)}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:14px;color:${baseContent};">
                          <strong>Passwort:</strong>
                        </td>
                        <td style="padding:4px 0;font-size:14px;color:${baseContent};text-align:right;font-family:monospace;">
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
                  <td align="center">
                    <a
                      href="${escapeHtml(loginUrl)}"
                      style="display:inline-block;background-color:${primary};color:${primaryContent};text-decoration:none;font-size:15px;font-weight:600;padding:12px 32px;border-radius:6px;"
                    >
                      Jetzt anmelden
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:${base300};">
                Bitte ändern Sie Ihr Passwort nach der ersten Anmeldung.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${base200};padding:16px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:${baseContent};opacity:0.6;">
                &copy; ${new Date().getFullYear()} Öl &amp; Proteinwerke Neuss &mdash; Showcase ERP
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
