import {
  Download,
  LockKeyhole,
  MousePointerClick,
  PanelTop,
  PlugZap,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { CopyConfigButton } from "@/components/guide/copy-config-button";

export const dynamic = "force-dynamic";

const MCP_CONFIG = `{
  "mcpServers": {
    "bookmark-lite": {
      "command": "npx",
      "args": ["-y", "bookmark-lite-mcp"],
      "env": {
        "LINKFLOW_TOKEN": "linkflow_xxxxxxxx"
      }
    }
  }
}`;

export const metadata = {
  title: "使用指南 · Bookmark Lite",
};

export default function GuidePage() {
  return (
    <div className="guide-page h-full w-full overflow-y-auto">
      <section className="relative mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-20">
        <div className="flex min-w-0 flex-col justify-center">
          <h1 className="bm-font-display max-w-2xl text-[34px] font-extrabold leading-[1.18] tracking-[-0.025em] sm:text-[42px] lg:text-[46px]">
            接入工作流
          </h1>
          <p className="mt-6 max-w-2xl text-[16px] leading-[1.75] sm:text-[17px]">
            把收藏接入你的工作流。浏览器插件负责快速收藏网页，MCP
            负责把 Bookmark Lite
            连接到 AI 助手和自动化流程，让灵感从保存到整理都更顺手。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#extension"
              className="inline-flex h-11 items-center justify-center rounded-[var(--bm-radius-md)] px-5 text-[15px] font-semibold whitespace-nowrap transition-[background-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 active:translate-y-px"
              style={{
                backgroundColor: "var(--bm-color-primary)",
                color: "var(--bm-color-text-on-primary)",
                outlineColor: "var(--bm-color-border-focus)",
              }}
            >
              看浏览器插件
            </a>
            <a
              href="#mcp"
              className="inline-flex h-11 items-center justify-center rounded-[var(--bm-radius-md)] border px-5 text-[15px] font-semibold whitespace-nowrap transition-[background-color,border-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 active:translate-y-px"
              style={{
                borderColor: "var(--bm-color-border)",
                color: "var(--bm-color-text)",
                backgroundColor: "var(--bm-color-surface)",
                outlineColor: "var(--bm-color-border-focus)",
              }}
            >
              看 MCP
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="信任说明">
            {["本地授权", "随时撤销", "数据归你"].map((t) => (
              <span
                key={t}
                className="inline-flex h-8 items-center justify-center rounded-[var(--bm-radius-full)] border px-3 text-[13px] whitespace-nowrap"
                style={{
                  borderColor: "var(--bm-color-border)",
                  backgroundColor: "var(--bm-color-surface)",
                  color: "var(--bm-color-text-secondary)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="bm-mint-glow absolute inset-0 -z-10 rounded-[var(--bm-radius-lg)] opacity-80" />
          <div
            className="grid gap-4 rounded-[var(--bm-radius-lg)] border p-4 sm:p-5"
            style={{
              borderColor: "var(--bm-color-border)",
              backgroundColor: "var(--bm-color-bg-subtle)",
            }}
          >
            <FeatureCard
              icon={<MousePointerClick className="h-5 w-5" aria-hidden="true" />}
              title="快速收藏"
              desc="点击浏览器插件图标，当前网页会带着标题、摘要与来源一起进入 Bookmark Lite。"
            />
            <FeatureCard
              icon={<Workflow className="h-5 w-5" aria-hidden="true" />}
              title="连接工具"
              desc="通过 MCP，让 AI 助手读取、整理与检索你的书签资料库。"
            />
            <div className="grid grid-cols-3 gap-3">
              {[
                { n: "1 点", l: "完成收藏" },
                { n: "4 步", l: "接入路径" },
                { n: "2 类", l: "核心入口" },
              ].map((s) => (
                <div
                  key={s.l}
                  className="rounded-[var(--bm-radius-md)] border p-3 text-center"
                  style={{
                    borderColor: "var(--bm-color-border)",
                    backgroundColor: "var(--bm-color-surface)",
                  }}
                >
                  <p
                    className="text-[18px] font-bold"
                    style={{ color: "var(--bm-color-primary)" }}
                  >
                    {s.n}
                  </p>
                  <p
                    className="mt-1 text-[12px]"
                    style={{ color: "var(--bm-color-text-muted)" }}
                  >
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10"
        aria-labelledby="quickstart-title"
      >
        <div className="mb-8 max-w-2xl">
          <h2
            id="quickstart-title"
            className="bm-font-display text-[28px] font-bold tracking-[-0.015em]"
          >
            快速开始
          </h2>
          <p className="mt-3 text-[15px] leading-6">
            按你的使用场景选择路径：先把网页收进来，再把收藏接到 AI
            与自动化流程里。
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <article id="extension" className="bm-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="bm-font-display text-[22px] font-bold tracking-[-0.01em]">
                  浏览器插件
                </h3>
                <p className="mt-2 text-[15px] leading-6">
                  适合日常浏览、资料收集和灵感捕捉。
                </p>
              </div>
              <IconBadge>
                <PanelTop className="h-5 w-5" aria-hidden="true" />
              </IconBadge>
            </div>
            <ol className="mt-6 grid gap-3">
              <Step n={1} title="安装浏览器插件" desc="在浏览器扩展商店安装 Bookmark Lite 浏览器插件。" />
              <Step n={2} title="点击收藏" desc="打开想保存的网页，点击浏览器插件按钮即可。" />
              <Step n={3} title="自动打标" desc="Bookmark Lite 根据内容生成标签，减少手动分类。" />
              <Step n={4} title="多端同步" desc="电脑、平板和手机都能找回收藏。" />
            </ol>
          </article>

          <article id="mcp" className="bm-card p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="bm-font-display text-[22px] font-bold tracking-[-0.01em]">
                  MCP 连接
                </h3>
                <p className="mt-2 text-[15px] leading-6">
                  适合开发者、研究者和自动化工作流。
                </p>
              </div>
              <IconBadge>
                <PlugZap className="h-5 w-5" aria-hidden="true" />
              </IconBadge>
            </div>
            <ol className="mt-6 grid gap-3">
              <Step n={1} title="复制配置" desc="在账号设置里复制 MCP 服务配置。" />
              <Step n={2} title="连接客户端" desc="粘贴到支持 MCP 的 AI 助手或工具中。" />
              <Step n={3} title="授权访问" desc="按需授予读取、整理或检索权限。" />
              <Step n={4} title="发起检索" desc="让 AI 查找资料、归纳主题或生成清单。" />
            </ol>
          </article>
        </div>
      </section>

      <section
        className="mx-auto grid max-w-7xl gap-6 px-6 py-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10"
        aria-labelledby="ext-install-title"
      >
        <div className="bm-card p-5 sm:p-6">
          <h2
            id="ext-install-title"
            className="bm-font-display text-[28px] font-bold tracking-[-0.015em]"
          >
            安装浏览器插件
          </h2>
          <p className="mt-3 text-[15px] leading-6">
            下载 Bookmark Lite
            浏览器插件，装好后在工具栏点击图标即可开始收藏。
          </p>
          <div className="mt-6 grid gap-3">
            <a
              href="/downloads/bookmark-lite-extension.zip"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--bm-radius-md)] px-5 text-[15px] font-semibold whitespace-nowrap transition-[background-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 active:translate-y-px"
              style={{
                backgroundColor: "var(--bm-color-primary)",
                color: "var(--bm-color-text-on-primary)",
                outlineColor: "var(--bm-color-border-focus)",
              }}
            >
              <Download className="h-5 w-5" aria-hidden="true" />
              下载 Bookmark Lite 浏览器插件
            </a>
            <TipLine
              icon={<MousePointerClick className="h-5 w-5" aria-hidden="true" />}
            >
              装好后点击工具栏图标，一键收藏当前页。
            </TipLine>
            <TipLine icon={<Settings2 className="h-5 w-5" aria-hidden="true" />}>
              在浏览器插件设置里登录账号，开启自动标签与快捷键。
            </TipLine>
          </div>
        </div>

        <div
          className="rounded-[var(--bm-radius-lg)] border p-4 sm:p-5"
          style={{
            borderColor: "var(--bm-color-border)",
            backgroundColor: "var(--bm-color-bg-subtle)",
          }}
        >
          <div className="border-b pb-3" style={{ borderColor: "var(--bm-color-border)" }}>
            <p className="text-[15px] font-semibold">各浏览器安装方式</p>
          </div>
          <ol className="mt-4 grid gap-3">
            <BrowserStep
              n={1}
              title="Chrome / Edge"
              desc={
                <>
                  打开{" "}
                  <code
                    className="rounded px-1"
                    style={{ backgroundColor: "var(--bm-color-bg-muted)" }}
                  >
                    chrome://extensions
                  </code>
                  ，开启「开发者模式」，拖入下载的压缩包即可安装。
                </>
              }
            />
            <BrowserStep
              n={2}
              title="Firefox"
              desc={
                <>
                  进入{" "}
                  <code
                    className="rounded px-1"
                    style={{ backgroundColor: "var(--bm-color-bg-muted)" }}
                  >
                    about:addons
                  </code>
                  ，选择「从文件安装附加组件」，选择下载的文件。
                </>
              }
            />
            <BrowserStep
              n={3}
              title="登录授权"
              desc="安装后点击工具栏 Bookmark Lite 图标，登录账号即可开始收藏。"
            />
          </ol>
          <p className="mt-4 text-[13px] leading-5" style={{ color: "var(--bm-color-text-muted)" }}>
            提示：若浏览器提示风险，确认来源为 Bookmark Lite 官方下载后选择「继续安装」。
          </p>
        </div>
      </section>

      <section
        className="mx-auto grid max-w-7xl gap-6 px-6 py-12 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-10"
        aria-labelledby="config-title"
      >
        <div className="bm-card p-5 sm:p-6">
          <h2
            id="config-title"
            className="bm-font-display text-[28px] font-bold tracking-[-0.015em]"
          >
            MCP 配置
          </h2>
          <p className="mt-3 text-[15px] leading-6">
            把示例配置粘贴到客户端后，AI
            就能在你的授权范围内读取、整理和检索 Bookmark Lite 收藏。
          </p>
          <div className="mt-6 grid gap-3">
            <TipLine icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}>
              令牌仅在你的设备与授权客户端中使用。
            </TipLine>
            <TipLine icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}>
              任何时候都可以在 Bookmark Lite 撤销授权。
            </TipLine>
            <TipLine icon={<LockKeyhole className="h-5 w-5" aria-hidden="true" />}>
              数据归属清晰，不会变成公共知识库。
            </TipLine>
          </div>
        </div>

        <div
          className="rounded-[var(--bm-radius-lg)] border p-4 sm:p-5"
          style={{
            borderColor: "var(--bm-color-border)",
            backgroundColor: "var(--bm-color-bg-subtle)",
          }}
        >
          <div
            className="flex items-center justify-between gap-4 border-b pb-3"
            style={{ borderColor: "var(--bm-color-border)" }}
          >
            <p className="text-[15px] font-semibold">配置示例</p>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-7 items-center justify-center rounded-[var(--bm-radius-full)] px-3 text-[12px] whitespace-nowrap"
                style={{
                  backgroundColor: "var(--bm-color-primary-softer)",
                  color: "var(--bm-color-primary)",
                }}
              >
                仅作展示
              </span>
              <CopyConfigButton targetId="mcp-config-code" />
            </div>
          </div>
          <pre
            className="mt-4 overflow-x-auto rounded-[var(--bm-radius-md)] border p-4 text-[13px] leading-6"
            style={{
              borderColor: "var(--bm-color-border)",
              backgroundColor: "var(--bm-color-surface)",
              color: "var(--bm-color-text-secondary)",
            }}
          >
            <code id="mcp-config-code">{MCP_CONFIG}</code>
          </pre>
          <p className="mt-4 text-[13px] leading-5" style={{ color: "var(--bm-color-text-muted)" }}>
            提示：真实令牌只在登录后的账号设置中生成，请勿在公开页面分享。
          </p>
        </div>
      </section>

      <section
        id="help"
        className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-10"
        aria-labelledby="help-title"
      >
        <h2
          id="help-title"
          className="bm-font-display text-[28px] font-bold tracking-[-0.015em]"
        >
          常见问题
        </h2>
        <div
          className="mt-8 max-w-3xl divide-y"
          style={{ borderColor: "var(--bm-color-border)" }}
        >
          <QA
            q="浏览器插件收藏时没反应怎么办？"
            a="刷新当前网页，并确认浏览器插件已登录同一个 Bookmark Lite 账号；若仍无效，重新安装浏览器插件再试一次。"
          />
          <QA
            q="自动生成的标签不准确？"
            a="手动调整一次标签后，Bookmark Lite 会学习你的偏好，后续相似内容的标签会更贴近你的习惯。"
          />
          <QA
            q="MCP 连接失败如何排查？"
            a="检查访问令牌是否过期，并确认客户端已启用 MCP；令牌可在 Bookmark Lite 账号设置中重新生成。"
          />
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-6 py-12 pb-16 sm:px-8 lg:px-10 lg:pb-20"
        aria-labelledby="cta-title"
      >
        <div
          className="rounded-[var(--bm-radius-lg)] border p-6 sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8"
          style={{
            borderColor: "var(--bm-color-border)",
            backgroundColor: "var(--bm-color-primary-softer)",
          }}
        >
          <div className="min-w-0">
            <h2
              id="cta-title"
              className="bm-font-display text-[28px] font-bold tracking-[-0.015em]"
            >
              准备就绪
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-6">
              登录后安装浏览器插件、复制 MCP
              配置，让收藏从浏览器流向你的知识工作台。
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <a
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-[var(--bm-radius-md)] px-5 text-[15px] font-semibold whitespace-nowrap transition-[background-color,transform] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 active:translate-y-px"
              style={{
                backgroundColor: "var(--bm-color-primary)",
                color: "var(--bm-color-text-on-primary)",
                outlineColor: "var(--bm-color-border-focus)",
              }}
            >
              开始使用
            </a>
          </div>
        </div>
      </section>

      <footer
        className="border-t"
        style={{ borderColor: "var(--bm-color-border)", backgroundColor: "var(--bm-color-bg)" }}
      >
        <div
          className="mx-auto flex max-w-7xl px-6 py-6 text-[13px] sm:px-8 lg:px-10"
          style={{ color: "var(--bm-color-text-muted)" }}
        >
          <p>© 2026 Bookmark Lite · 保留所有权利</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="bm-card p-5">
      <div className="flex items-start gap-4">
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--bm-radius-md)]"
          style={{
            backgroundColor: "var(--bm-color-primary-softer)",
            color: "var(--bm-color-primary)",
          }}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="bm-font-display text-[22px] font-bold tracking-[-0.01em]">
            {title}
          </h2>
          <p className="mt-2 text-[15px] leading-6">{desc}</p>
        </div>
      </div>
    </div>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--bm-radius-md)]"
      style={{
        backgroundColor: "var(--bm-color-primary-softer)",
        color: "var(--bm-color-primary)",
      }}
    >
      {children}
    </span>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li
      className="flex gap-3 rounded-[var(--bm-radius-md)] border p-3"
      style={{
        borderColor: "var(--bm-color-border)",
        backgroundColor: "var(--bm-color-bg-subtle)",
      }}
    >
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--bm-radius-full)] text-[13px] font-bold"
        style={{
          backgroundColor: "var(--bm-color-primary)",
          color: "var(--bm-color-text-on-primary)",
        }}
      >
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-[13px] leading-5">{desc}</p>
      </div>
    </li>
  );
}

function BrowserStep({
  n,
  title,
  desc,
}: {
  n: number;
  title: string;
  desc: React.ReactNode;
}) {
  return (
    <li
      className="flex gap-3 rounded-[var(--bm-radius-md)] border p-3"
      style={{
        borderColor: "var(--bm-color-border)",
        backgroundColor: "var(--bm-color-surface)",
      }}
    >
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--bm-radius-full)] text-[13px] font-bold"
        style={{
          backgroundColor: "var(--bm-color-primary)",
          color: "var(--bm-color-text-on-primary)",
        }}
      >
        {n}
      </span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-[13px] leading-5">{desc}</p>
      </div>
    </li>
  );
}

function TipLine({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="mt-0.5 inline-flex h-5 w-5 shrink-0"
        style={{ color: "var(--bm-color-primary)" }}
      >
        {icon}
      </span>
      <p className="text-[14px] leading-6">{children}</p>
    </div>
  );
}

function QA({ q, a }: { q: string; a: string }) {
  return (
    <div className="py-5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span
          className="bm-font-display mt-0.5 text-[15px] font-bold"
          style={{ color: "var(--bm-color-primary)" }}
        >
          Q
        </span>
        <h3 className="text-[16px] font-semibold leading-7">{q}</h3>
      </div>
      <div className="mt-2 flex items-start gap-3">
        <span
          className="bm-font-display mt-0.5 text-[15px] font-bold"
          style={{ color: "var(--bm-color-text-muted)" }}
        >
          A
        </span>
        <p className="text-[15px] leading-7">{a}</p>
      </div>
    </div>
  );
}
