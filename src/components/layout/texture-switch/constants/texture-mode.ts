/**
 * 背景纹理模式枚举
 */
export enum TextureModeEnum {
  /**
   * 无纹理（纯色基线）
   */
  None = "None",
  /**
   * 细点阵（索引卡打孔隐喻）
   */
  Dots = "Dots",
  /**
   * 细网格线（档案格纸隐喻）
   */
  Grid = "Grid",
  /**
   * 噪点颗粒（纸张纤维质感）
   */
  Noise = "Noise",
}

/**
 * 背景纹理模式名称Map
 */
export const TextureModeLabelMap = {
  /**
   * 无纹理
   */
  [TextureModeEnum.None]: "无纹理",
  /**
   * 细点阵
   */
  [TextureModeEnum.Dots]: "细点阵",
  /**
   * 细网格线
   */
  [TextureModeEnum.Grid]: "细网格线",
  /**
   * 噪点颗粒
   */
  [TextureModeEnum.Noise]: "噪点颗粒",
};

/**
 * 背景纹理模式选项数据源
 */
export const TextureModeOptions = [
  {
    label: TextureModeLabelMap[TextureModeEnum.None],
    value: TextureModeEnum.None,
  },
  {
    label: TextureModeLabelMap[TextureModeEnum.Dots],
    value: TextureModeEnum.Dots,
  },
  {
    label: TextureModeLabelMap[TextureModeEnum.Grid],
    value: TextureModeEnum.Grid,
  },
  {
    label: TextureModeLabelMap[TextureModeEnum.Noise],
    value: TextureModeEnum.Noise,
  },
];

/**
 * 纹理模式对应的预览色板修饰类名（None 仅用基础色板，无需修饰类）
 */
export const TextureModeSwatchClassMap: Record<TextureModeEnum, string> = {
  [TextureModeEnum.None]: "",
  [TextureModeEnum.Dots]: "texture-swatch-dots",
  [TextureModeEnum.Grid]: "texture-swatch-grid",
  [TextureModeEnum.Noise]: "texture-swatch-noise",
};

/** 背景纹理偏好 Cookie 名称 */
export const TEXTURE_COOKIE_NAME = "texture";

/** 背景纹理偏好 Cookie 有效期（秒），一年 */
export const TEXTURE_COOKIE_MAX_AGE = 31536000;

/** 默认背景纹理模式：细点阵，与根布局防闪烁内联脚本的回退值保持一致 */
export const DEFAULT_TEXTURE_MODE = TextureModeEnum.Dots;
