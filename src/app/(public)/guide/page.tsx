"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  AppWindow,
  Bot,
  Check,
  Copy,
  Database,
  Download,
  KeyRound,
  MousePointerClick,
  PlugZap,
  RotateCcw,
  Settings2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

const MCP_CONFIG = `{
  "mcpServers": {
    "bookmark-lite": {
      "command": "npx",
      "args": ["-y", "bookmark-lite-mcp"],
      "env": {
        "API_TOKEN": "bml-xxxxxxxx"
      }
    }
  }
}`;

const trustPoints: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "本地授权" },
  { icon: RotateCcw, label: "随时撤销" },
  { icon: Database, label: "数据归你" },
];

const featureCards: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: MousePointerClick,
    title: "快速收藏",
    desc: "点击浏览器插件图标，当前网页会带着标题、摘要与来源一起进入 Bookmark Lite。",
  },
  {
    icon: PlugZap,
    title: "连接工具",
    desc: "通过 MCP，让 AI 助手读取、整理与检索你的书签资料库。",
  },
];

const statCards: { value: string; label: string }[] = [
  { value: "1 点", label: "完成收藏" },
  { value: "4 步", label: "接入路径" },
  { value: "2 类", label: "核心入口" },
];

const extensionSteps: { title: string; desc: string }[] = [
  { title: "安装浏览器插件", desc: "在浏览器扩展商店安装 Bookmark Lite 浏览器插件。" },
  { title: "点击收藏", desc: "打开想保存的网页，点击浏览器插件按钮即可。" },
  { title: "自动打标", desc: "Bookmark Lite 根据内容生成标签，减少手动分类。" },
  { title: "多端同步", desc: "电脑、平板和手机都能找回收藏。" },
];

const mcpSteps: { title: string; desc: string }[] = [
  { title: "复制配置", desc: "在账号设置里复制 MCP 服务配置。" },
  { title: "连接客户端", desc: "粘贴到支持 MCP 的 AI 助手或工具中。" },
  { title: "授权访问", desc: "按需授予读取、整理或检索权限。" },
  { title: "发起检索", desc: "让 AI 查找资料、归纳主题或生成清单。" },
];

const browserSteps: { title: string; desc: ReactNode }[] = [
  {
    title: "Chrome / Edge",
    desc: (
      <>
        打开{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
          chrome://extensions
        </code>
        ，开启「开发者模式」，拖入下载的压缩包即可安装。
      </>
    ),
  },
  {
    title: "Firefox",
    desc: (
      <>
        进入{" "}
        <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs dark:bg-slate-800">
          about:addons
        </code>
        ，选择「从文件安装附加组件」，选择下载的文件。
      </>
    ),
  },
  {
    title: "登录授权",
    desc: "安装后点击工具栏 Bookmark Lite 图标，登录账号即可开始收藏。",
  },
];

const mcpTips: { icon: LucideIcon; text: string }[] = [
  { icon: KeyRound, text: "令牌仅在你的设备与授权客户端中使用。" },
  { icon: ShieldCheck, text: "任何时候都可以在 Bookmark Lite 撤销授权。" },
  { icon: Database, text: "数据归属清晰，不会变成公共知识库。" },
];

const faqItems: { question: string; answer: string }[] = [
  {
    question: "浏览器插件收藏时没反应怎么办？",
    answer:
      "刷新当前网页，并确认浏览器插件已登录同一个 Bookmark Lite 账号；若仍无效，重新安装浏览器插件再试一次。",
  },
  {
    question: "自动生成的标签不准确？",
    answer:
      "手动调整一次标签后，Bookmark Lite 会学习你的偏好，后续相似内容的标签会更贴近你的习惯。",
  },
  {
    question: "MCP 连接失败如何排查？",
    answer:
      "检查访问令牌是否过期，并确认客户端已启用 MCP；令牌可在 Bookmark Lite 账号设置中重新生成。",
  },
];

export default function GuidePage() {
  useEffect(() => {
    document.title = "使用指南 · Bookmark Lite";
  }, []);

  return (
    <div className="h-full w-full overflow-y-auto bg-white text-foreground dark:bg-[#0b1220]">
      <HeroSection />
      <QuickStartSection />
      <ExtensionSection />
      <McpSection />
      <FaqSection />
      <CtaSection />
      <footer className="border-t border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-xs text-slate-400">© 2026 Bookmark Lite · 保留所有权利</p>
        </div>
      </footer>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16 pt-16">
      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
        <div>
          <h1 className="mb-5 text-4xl font-bold tracking-tight">接入工作流</h1>
          <p className="mb-7 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
            把收藏接入你的工作流。浏览器插件负责快速收藏网页，MCP 负责把 Bookmark Lite
            连接到 AI 助手和自动化流程，让灵感从保存到整理都更顺手。
          </p>
          <div className="mb-7 flex items-center gap-3">
            <a
              href="#extension"
              className="rounded-sm bg-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              接入浏览器插件
            </a>
            <a
              href="#mcp"
              className="rounded-sm border border-slate-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              接入 MCP
            </a>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            {trustPoints.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {featureCards.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="rounded-sm border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="mb-2.5 flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-blue-50 text-primary dark:bg-blue-950">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold">{title}</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
          ))}
          <div className="grid grid-cols-3 gap-4">
            {statCards.map(({ value, label }) => (
              <div
                key={label}
                className="rounded-sm border border-slate-200 bg-white p-4 text-center dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-0.5 text-xl font-bold text-primary">{value}</div>
                <div className="text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickStartSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <h2 className="mb-2 text-2xl font-bold">快速开始</h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
        按你的使用场景选择路径：先把网页收进来，再把收藏接到 AI 与自动化流程里。
      </p>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <PathCard icon={AppWindow} title="浏览器插件" desc="适合日常浏览、资料收集和灵感捕捉。">
          <StepList steps={extensionSteps} />
        </PathCard>
        <PathCard icon={Bot} title="MCP 连接" desc="适合开发者、研究者和自动化工作流。">
          <StepList steps={mcpSteps} />
        </PathCard>
      </div>
    </section>
  );
}

function PathCard({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: LucideIcon;
  title: string;
  desc: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1.5 flex items-center gap-2.5">
        <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <p className="mb-5 text-xs text-slate-400">{desc}</p>
      {children}
    </div>
  );
}

function StepList({ steps }: { steps: { title: string; desc: string }[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex items-start gap-3.5 rounded-sm bg-slate-50 p-3.5 dark:bg-[#111a2e]"
        >
          <StepNumber>{index + 1}</StepNumber>
          <div className="min-w-0">
            <div className="mb-0.5 text-sm font-medium">{step.title}</div>
            <div className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {step.desc}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function StepNumber({ children }: { children: number }) {
  return (
    <span className="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-white">
      {children}
    </span>
  );
}

function ExtensionSection() {
  return (
    <section id="extension" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-16">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-sm border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-xl font-bold">安装浏览器插件</h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            下载 Bookmark Lite 浏览器插件，装好后在工具栏点击图标即可开始收藏。
          </p>
          <a
            href="/downloads/bookmark-lite-extension.zip"
            download
            className="mb-8 inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            下载 Bookmark Lite 浏览器插件
          </a>
          <ul className="flex flex-col gap-3.5">
            <TipLine icon={MousePointerClick}>装好后点击工具栏图标，一键收藏当前页。</TipLine>
            <TipLine icon={Settings2}>
              在浏览器插件设置里登录账号，开启自动标签与快捷键。
            </TipLine>
          </ul>
        </div>
        <div className="rounded-sm border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="mb-5 text-base font-semibold">各浏览器安装方式</h3>
          <ol className="mb-5 flex flex-col gap-3">
            {browserSteps.map((step, index) => (
              <li
                key={step.title}
                className="flex items-start gap-3.5 rounded-sm bg-slate-50 p-3.5 dark:bg-[#111a2e]"
              >
                <StepNumber>{index + 1}</StepNumber>
                <div className="min-w-0">
                  <div className="mb-0.5 text-sm font-medium">{step.title}</div>
                  <div className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                    {step.desc}
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-xs leading-relaxed text-slate-400">
            提示：若浏览器提示风险，确认来源为 Bookmark Lite 官方下载后选择「继续安装」。
          </p>
        </div>
      </div>
    </section>
  );
}

function TipLine({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

function McpSection() {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = codeRef.current?.textContent ?? MCP_CONFIG;

    const finish = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(finish).catch(finish);
      return;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch {
      // ignore
    }
    document.body.removeChild(textarea);
    finish();
  };

  return (
    <section id="mcp" className="mx-auto max-w-6xl scroll-mt-20 px-6 pb-16">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-sm border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-2 text-xl font-bold">MCP 配置</h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            把示例配置粘贴到客户端后，AI 就能在你的授权范围内读取、整理和检索 Bookmark Lite
            收藏。
          </p>
          <ul className="flex flex-col gap-3.5">
            {mcpTips.map(({ icon: Icon, text }) => (
              <TipLine key={text} icon={Icon}>
                {text}
              </TipLine>
            ))}
          </ul>
        </div>
        <div className="rounded-sm border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-base font-semibold">配置示例</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-primary">仅作展示</span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "已复制" : "复制配置"}
                className="flex items-center gap-1 rounded-sm text-xs text-slate-400 transition-colors hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring dark:hover:text-slate-200"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {copied ? "已复制" : "复制"}
              </button>
            </div>
          </div>
          <pre className="mb-4 overflow-x-auto rounded-sm border border-slate-200 bg-slate-50 p-4 font-mono text-[13px] leading-[1.8] text-slate-700 dark:border-[#1e293b] dark:bg-[#111a2e] dark:text-[#cbd5e1]">
            <code ref={codeRef}>{MCP_CONFIG}</code>
          </pre>
          <p className="text-xs leading-relaxed text-slate-400">
            提示：真实令牌只在登录后的账号设置中生成，请勿在公开页面分享。
          </p>
        </div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="mx-auto max-w-3xl px-6 pb-16">
      <h2 className="mb-8 text-2xl font-bold">常见问题</h2>
      <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
        {faqItems.map(({ question, answer }) => (
          <div key={question} className="py-5">
            <div className="mb-2 flex items-baseline gap-3">
              <span className="shrink-0 text-sm font-semibold text-primary">Q</span>
              <span className="text-sm font-medium">{question}</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="shrink-0 text-sm text-slate-400">A</span>
              <span className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {answer}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="flex flex-col gap-5 rounded-sm bg-blue-50 p-8 dark:bg-blue-950 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mb-1.5 text-xl font-bold">准备就绪</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            登录后安装浏览器插件、复制 MCP 配置，让收藏从浏览器流向你的知识工作台。
          </p>
        </div>
        <a
          href="/login"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-sm bg-primary px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:self-auto"
        >
          开始使用
        </a>
      </div>
    </section>
  );
}
