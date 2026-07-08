import type { MailTemplate } from "@/server/mail/types";

export type PasswordResetPayload = {
  resetUrl: string;
  ttlMinutes: number;
};

export const passwordResetTemplate: MailTemplate<PasswordResetPayload> = {
  name: "password-reset",

  buildSubject() {
    return "重置你的 Bookmark Lite 密码";
  },

  buildHtml(payload: PasswordResetPayload): string {
    const minutes = payload.ttlMinutes;
    return `<!DOCTYPE html>
<html lang="zh-CN">
  <body style="margin:0;padding:0;background-color:#f8fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafb;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e2eef0;border-radius:12px;padding:32px;">
            <tr>
              <td style="padding-bottom:8px;">
                <span style="font-size:20px;font-weight:800;color:#0d9488;letter-spacing:-0.02em;">Bookmark Lite</span>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;">
                <h1 style="margin:0;font-size:22px;font-weight:600;color:#0f1f1c;">重置你的密码</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5c58;">
                  我们收到你重置 Bookmark Lite 账户密码的请求。点击下方按钮即可设置新密码，链接有效期为 ${minutes} 分钟。
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${payload.resetUrl}" style="display:inline-block;background-color:#0d9488;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">重置密码</a>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#7a8a86;">
                  如果按钮无法点击，请直接复制以下链接到浏览器地址栏：
                </p>
                <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;color:#0d9488;word-break:break-all;">${payload.resetUrl}</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e2eef0;padding-top:16px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#7a8a86;">
                  如果你没有发起过重置密码的请求，请忽略此邮件，你的密码不会发生任何变化。
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:12px;color:#7a8a86;">© 2026 Bookmark Lite · 保留所有权利</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
  },

  buildText(payload: PasswordResetPayload): string {
    const minutes = payload.ttlMinutes;
    return [
      "Bookmark Lite · 重置你的密码",
      "",
      "我们收到你重置 Bookmark Lite 账户密码的请求。",
      `请在 ${minutes} 分钟内通过以下链接设置新密码：`,
      "",
      payload.resetUrl,
      "",
      "如果你没有发起过重置密码的请求，请忽略此邮件，你的密码不会发生任何变化。",
      "",
      "© 2026 Bookmark Lite · 保留所有权利",
    ].join("\n");
  },
};
