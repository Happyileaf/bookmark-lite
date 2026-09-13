import Image from "next/image";
import { Check } from "lucide-react";

const VALUE_POINTS = [
  {
    title: "看到即存，不打断思考",
    desc: "一键保存当前页面，灵感随手留住",
  },
  {
    title: "自动整理，而不是手动分类",
    desc: "智能标签与分类，收藏即有序",
  },
  {
    title: "在任何设备上，随时找回灵感",
    desc: "多端实时同步，你的第二大脑入口",
  },
];

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-100 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
      <div className="relative z-10 px-16 py-10" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-lg px-16 pb-16">
        <div className="mb-12 flex items-center gap-3">
          <Image
            src="/logo_assets/logo_export.png"
            alt="Bookmark Lite"
            width={64}
            height={64}
            className="h-16 w-16"
          />
          <span className="text-[38px] font-extrabold tracking-[-0.02em] text-primary">
            Bookmark Lite
          </span>
        </div>

        <h1 className="mb-5 text-[34px] font-extrabold leading-[1.2] tracking-[-0.02em] text-slate-900 dark:text-slate-100">
          连接信息，轻点收藏
        </h1>
        <p className="mb-12 text-[15px] font-medium leading-[1.65] text-slate-500 dark:text-slate-400">
          你看到的每一个网页、灵感或工具，都可以一键保存，并自动变得清晰、有序、可随时回到。
        </p>

        <ul className="space-y-6">
          {VALUE_POINTS.map((point) => (
            <li key={point.title} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                  {point.title}
                </p>
                <p className="truncate text-[12px] text-slate-500 dark:text-slate-400">
                  {point.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-[13px] italic text-slate-400 dark:text-slate-500">
          从信息过载中，重新掌控你的注意力。
        </p>
      </div>

      <div className="relative z-10 px-16 py-8">
        <p className="text-[12px] text-slate-400 dark:text-slate-500">
          © 2026 Bookmark Lite · 保留所有权利
        </p>
      </div>
    </aside>
  );
}

type MobileBrandProps = {
  withIntro?: boolean;
};

export function AuthMobileBrand({ withIntro = true }: MobileBrandProps) {
  return (
    <div className="relative z-10 mb-8 w-full max-w-[420px] lg:hidden">
      <div className="mb-5 flex items-center gap-2.5">
        <Image
          src="/logo_assets/logo_export.png"
          alt="Bookmark Lite"
          width={36}
          height={36}
          className="h-9 w-9 rounded-sm"
        />
        <span className="text-[24px] font-extrabold tracking-[-0.02em] text-primary">
          Bookmark Lite
        </span>
      </div>
      {withIntro ? (
        <>
          <h1 className="mb-2 text-[26px] font-extrabold leading-[1.25] tracking-[-0.02em] text-slate-900 dark:text-slate-100">
            连接信息，轻点收藏
          </h1>
          <p className="text-[15px] leading-[1.6] text-slate-500 dark:text-slate-400">
            你看到的每一个网页、灵感或工具，都可以一键保存，并自动变得清晰、有序、可随时回到。
          </p>
        </>
      ) : null}
    </div>
  );
}

const TRUST_ITEMS = ["免费使用", "无需信用卡", "数据仅属于你"];

export function AuthTrustMarks() {
  return (
    <div className="mt-5 flex items-center justify-center gap-4">
      {TRUST_ITEMS.map((label) => (
        <span
          key={label}
          className="flex items-center gap-1 text-[12px] text-slate-400 dark:text-slate-500"
        >
          <Check className="h-[13px] w-[13px]" strokeWidth={2.5} />
          {label}
        </span>
      ))}
    </div>
  );
}

export function AuthMobileCopyright() {
  return (
    <div className="relative z-10 mt-8 block w-full max-w-[420px] text-center lg:hidden">
      <p className="text-[12px] text-slate-400 dark:text-slate-500">
        © 2026 Bookmark Lite · 保留所有权利
      </p>
    </div>
  );
}
