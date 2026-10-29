export type BrandedEmailOptions = {
  preheader: string;
  title: string;
  greeting: string;
  message: string;
  contentHtml?: string;
  footerNote?: string;
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function detailRow(label: string, value: unknown): string {
  return `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #e8edf4;color:#64748b;font-size:13px;width:40%;vertical-align:top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:12px 14px;border-bottom:1px solid #e8edf4;color:#172033;font-size:14px;font-weight:600;overflow-wrap:anywhere;">
        ${escapeHtml(value || "Not provided")}
      </td>
    </tr>`;
}

export function buildJustdyEmail(options: BrandedEmailOptions): string {
  const {
    preheader,
    title,
    greeting,
    message,
    contentHtml = "",
    footerNote = "You received this email because of your activity with Justdy.",
  } = options;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f6fb;font-family:Arial,Helvetica,sans-serif;color:#172033;">
  <div style="display:none;font-size:1px;color:#f3f6fb;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f3f6fb;width:100%;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;">

          <tr>
            <td style="background-color:#102c54;padding:28px 32px;">
              <div style="font-size:29px;font-weight:800;letter-spacing:-1.2px;color:#ffffff;">
                justdy<span style="color:#60a5fa;">.</span>
              </div>
              <div style="margin-top:7px;color:#dbeafe;font-size:13px;line-height:20px;">
                Learn. Grow. Achieve.
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:34px 32px 18px;">
              <h1 style="margin:0 0 20px;color:#102c54;font-size:25px;line-height:1.3;font-weight:750;">
                ${escapeHtml(title)}
              </h1>

              <p style="margin:0 0 14px;color:#172033;font-size:15px;line-height:1.8;">
                ${escapeHtml(greeting)}
              </p>

              <p style="margin:0 0 22px;color:#475569;font-size:15px;line-height:1.8;">
                ${escapeHtml(message)}
              </p>

              ${contentHtml}
            </td>
          </tr>

          <tr>
            <td style="padding:8px 32px 30px;">
              <div style="height:1px;background-color:#e8edf4;margin-bottom:18px;"></div>

              <p style="margin:0 0 8px;color:#64748b;font-size:12px;line-height:1.7;">
                ${escapeHtml(footerNote)}
              </p>

              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.7;">
                © ${new Date().getFullYear()} Justdy. All rights reserved.
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
