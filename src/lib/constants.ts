export const APP_SCOPE_KEY = "APP";
export const DEFAULT_PAGE_SIZE = 30;
export const MAX_PAGE_SIZE = 100;

/** 密码最小长度（客户端预校验与服务端 zod 校验共用的唯一来源） */
export const PASSWORD_MIN_LENGTH = 8;

export const TRASH_RETENTION_OPTIONS = [7, 30, 90, 3650] as const;
export const AUDIT_RETENTION_OPTIONS = [30, 90, 180, 365] as const;

export const THEME_OPTIONS = ["light", "dark", "system"] as const;

/** 打开侧边抽屉的全局事件名（顶部栏按钮与页面内抽屉解耦通信，同一时刻页面仅挂载一个抽屉）。 */
export const OPEN_SIDE_DRAWER_EVENT = "side-drawer:open";
