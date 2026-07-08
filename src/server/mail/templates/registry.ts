import type { MailTemplate, MailTemplatePayloadMap } from "@/server/mail/types";
import {
  passwordResetTemplate,
  type PasswordResetPayload,
} from "./password-reset";

declare module "@/server/mail/types" {
  interface MailTemplatePayloadMap {
    "password-reset": PasswordResetPayload;
  }
}

/**
 * 模板注册表
 *
 * @description 以模板名为键、模板实现为值的注册表。
 * 新增邮件模板时：1) 在 templates/ 下新建文件导出 MailTemplate；
 * 2) 在此对象登记；3) 通过上方 declare module 补充负载类型映射。
 */
export const mailTemplates = {
  "password-reset": passwordResetTemplate,
} satisfies Record<string, MailTemplate>;

export type MailTemplateName = keyof typeof mailTemplates;

export function getMailTemplate(
  name: MailTemplateName,
): MailTemplate<MailTemplatePayloadMap[MailTemplateName]> {
  return mailTemplates[name] as MailTemplate<
    MailTemplatePayloadMap[MailTemplateName]
  >;
}
