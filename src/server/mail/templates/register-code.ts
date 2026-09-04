import type { MailTemplate } from "@/server/mail/types";

/** 注册验证码邮件模板负载 */
export type RegisterCodePayload = {
  /** 6 位数字验证码 */
  code: string;
  /** 验证码有效期（分钟） */
  ttlMinutes: number;
};

export const registerCodeTemplate: MailTemplate<RegisterCodePayload> = {
  name: "register-code",

  buildSubject() {
    return "你的 Bookmark Lite 注册验证码";
  },

  buildHtml(payload: RegisterCodePayload): string {
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
                <h1 style="margin:0;font-size:22px;font-weight:600;color:#0f1f1c;">完成你的注册</h1>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:24px;">
                <p style="margin:0;font-size:14px;line-height:1.6;color:#4b5c58;">
                  感谢你注册 Bookmark Lite。请使用下方验证码完成注册，验证码有效期为 ${minutes} 分钟。
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <div style="display:inline-block;background-color:#f0faf8;border:1px solid #bfe7e0;border-radius:10px;padding:16px 32px;">
                  <span style="font-size:32px;font-weight:700;letter-spacing:0.3em;color:#0d9488;font-family:'SF Mono',Menlo,Consolas,monospace;">${payload.code}</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:16px;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#7a8a86;">
                  为了你的账户安全，请勿将验证码泄露给他人。
                </p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e2eef0;padding-top:16px;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#7a8a86;">
                  如果你没有注册过 Bookmark Lite 账号，请忽略此邮件。
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

  buildText(payload: RegisterCodePayload): string {
    const minutes = payload.ttlMinutes;
    return [
      "Bookmark Lite · 完成你的注册",
      "",
      "感谢你注册 Bookmark Lite。",
      `你的注册验证码是：${payload.code}`,
      `验证码有效期为 ${minutes} 分钟，请尽快完成注册。`,
      "",
      "为了你的账户安全，请勿将验证码泄露给他人。",
      "如果你没有注册过 Bookmark Lite 账号，请忽略此邮件。",
      "",
      "© 2026 Bookmark Lite · 保留所有权利",
    ].join("\n");
  },
};
