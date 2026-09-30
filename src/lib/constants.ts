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

/**
 * 热门书签统计窗口（天）
 * PRD 将热门书签定义为「最近 7 天访问次数」排序，窗口取值与产品口径保持一致
 */
export const HOT_VISIT_WINDOW_DAYS = 7;

/**
 * 公共书签访问防刷窗口（毫秒）
 * 同一浏览器（visitorKey）对同一书签在 60 秒内最多计 1 次访问，
 * 取 1 分钟用于过滤快速连点与页面刷新造成的重复上报，比 IP 维度限制更宽松以兼容共享网络
 */
export const BOOKMARK_VISIT_DEDUP_WINDOW_MS = 60 * 1000;

/**
 * 随机发现默认批量大小
 * 随机发现视图以列表形式一次展示一批随机书签，PRD 定义每批 15 个；
 * 服务端随机接口与页面 SSR 初选共用该值，保证首屏与「再来一批」数量一致
 */
export const DEFAULT_RANDOM_BATCH_SIZE = 15;

/**
 * 随机发现排除列表的最大长度
 * 客户端把最近展示过的书签 ID 作为排除条件回传，上限 30 约等于最近两批（15×2），
 * 在「短时间内尽量不重复」与「候选池留足新鲜面孔」之间取平衡；服务端 zod 校验
 * 与客户端截断共用该值，避免两端阈值脱节
 */
export const MAX_RANDOM_EXCLUDE_IDS = 30;
