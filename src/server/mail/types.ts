/**
 * 邮件模块核心类型
 *
 * @description 定义邮件传输对象与模板抽象，与具体传输实现（Resend）和业务模板解耦
 */

/**
 * 一封待发送的邮件
 *
 * @description 与传输层对接的最小消息结构，传输层据此调用 SDK 发送
 */
export type MailMessage = {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text: string;
};

/**
 * 邮件发送结果
 */
export type MailSendResult = {
  success: boolean;
  messageId?: string;
};

/**
 * 邮件模板抽象
 *
 * @description 每个业务模板实现该接口，提供主题与正文渲染；Payload 为模板所需数据
 * @template P - 模板渲染所需的负载数据类型
 */
export interface MailTemplate<P = unknown> {
  /** 模板名，用于注册表索引与日志 */
  readonly name: string;
  /** 计算邮件主题 */
  buildSubject(payload: P): string;
  /** 渲染 HTML 正文 */
  buildHtml(payload: P): string;
  /** 渲染纯文本正文 */
  buildText(payload: P): string;
}

/**
 * 模板负载映射表
 *
 * @description 以模板名为键、负载类型为值的映射，用于 sendTemplate 的类型推断。
 * 在 templates/registry.ts 中通过声明合并补充条目，即可获得编译期类型安全。
 *
 * @example
 * declare module "./types" {
 *   interface MailTemplatePayloadMap {
 *     "password-reset": { resetUrl: string; ttlMinutes: number };
 *     "login-code": { code: string; ttlMinutes: number };
 *   }
 * }
 */
export interface MailTemplatePayloadMap {
  // 默认兜底，未注册的模板名退化为 unknown
  [name: string]: unknown;
}
