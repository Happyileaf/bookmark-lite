import {
  getFromAddress,
  getMailClient,
  isMailConfigured,
} from "@/server/mail/client";
import type { MailMessage, MailSendResult } from "@/server/mail/types";
import type { MailTemplatePayloadMap } from "@/server/mail/types";
import {
  getMailTemplate,
  type MailTemplateName,
} from "@/server/mail/templates/registry";

export const mailService = {
  /**
   * 发送一封原始邮件
   *
   * @description 通用发送入口，直接与传输层对接；未配置 API Key 时走开发态兜底
   * @param message - 待发送的邮件消息
   * @returns 发送结果，含是否成功与消息 ID
   */
  async send(message: MailMessage): Promise<MailSendResult> {
    const client = getMailClient();
    if (!client) {
      console.error(
        "[mail] RESEND_API_KEY 未配置，邮件未发送。收件人：%s · 主题：%s",
        message.to,
        message.subject,
      );
      return {
        success: false,
        error: "邮件服务未配置（缺少 RESEND_API_KEY）",
      };
    }

    const { data, error } = await client.emails.send({
      from: message.from ?? getFromAddress(),
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      console.error("[mail] 邮件发送失败:", error);
      return {
        success: false,
        error: error.message ?? "邮件发送失败",
      };
    }

    return { success: true, messageId: data?.id };
  },

  /**
   * 按模板发送邮件（类型安全）
   *
   * @description 根据模板名从注册表取出模板，用 payload 渲染主题与正文后发送。
   * 模板名与负载类型在编译期绑定，传错负载会触发类型错误。
   * @param name - 模板名
   * @param to - 收件人邮箱
   * @param payload - 模板渲染所需数据
   * @returns 发送结果
   * @template N - 模板名（必须为已注册模板）
   */
  async sendTemplate<N extends MailTemplateName>(
    name: N,
    to: string,
    payload: MailTemplatePayloadMap[N],
  ): Promise<MailSendResult> {
    const template = getMailTemplate(name);
    const message: MailMessage = {
      to,
      subject: template.buildSubject(payload),
      html: template.buildHtml(payload),
      text: template.buildText(payload),
    };
    return this.send(message);
  },

  /**
   * 判断邮件传输是否就绪
   *
   * @description 用于调用方在发送前判断是否处于开发态
   * @returns 已配置 Resend API Key 返回 true
   */
  isConfigured(): boolean {
    return isMailConfigured();
  },
};
