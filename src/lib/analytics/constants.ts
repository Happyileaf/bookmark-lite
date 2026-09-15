/** 埋点事件名常量（统一 snake_case，与服务端 event_metrics.event_name 对应） */
export const ANALYTICS_EVENT_NAMES = {
  /** 页面浏览事件（路由变化时客户端 SDK 自动上报） */
  PAGE_VIEW: "page_view",
  /** 书签点击事件（客户端在书签卡片点击时手动上报） */
  BOOKMARK_CLICKED: "bookmark_clicked",
  /** 用户注册完成事件（服务端在注册流程成功后上报） */
  USER_REGISTERED: "user_registered",
  /** 用户登录成功事件（服务端在认证回调中上报） */
  USER_LOGGED_IN: "user_logged_in",
  /** 书签创建事件（服务端在书签服务创建成功后上报） */
  BOOKMARK_CREATED: "bookmark_created",
} as const;

/** 埋点事件名字面量类型（取 ANALYTICS_EVENT_NAMES 全部值的联合） */
export type AnalyticsEventName =
  (typeof ANALYTICS_EVENT_NAMES)[keyof typeof ANALYTICS_EVENT_NAMES];

/**
 * 允许通过 /api/metrics 上报的客户端事件名白名单
 * （服务端业务事件由后端直写数据库，不经过该接口，防止接口被滥用伪造业务数据）
 */
export const CLIENT_ANALYTICS_EVENT_NAMES: readonly string[] = [
  ANALYTICS_EVENT_NAMES.PAGE_VIEW,
  ANALYTICS_EVENT_NAMES.BOOKMARK_CLICKED,
];
