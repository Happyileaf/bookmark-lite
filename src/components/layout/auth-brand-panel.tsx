import Image from "next/image";

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

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function AuthBrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#f8fafb] lg:flex dark:bg-[#0c1513]">
      <div className="relative z-10 px-16 py-10" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-lg px-16 pb-16">
        <div className="mb-12 flex items-center gap-3">
          <Image
            src="/logo_assets/logo_export.png"
            alt="Bookmark Lite"
            width={64}
            height={64}
            className="h-16 w-16"
          />
          <span
            className="text-[38px] font-extrabold tracking-tight text-[#0d9488]"
            style={{ letterSpacing: "-0.02em" }}
          >
            Bookmark Lite
          </span>
        </div>

        <h1
          className="mb-5 text-[34px] font-extrabold leading-[1.2] text-[#0f1f1c] dark:text-[#e8f3ef]"
          style={{ letterSpacing: "-0.02em" }}
        >
          连接信息，轻点收藏
        </h1>
        <p className="mb-12 text-[15px] font-medium leading-[1.65] text-[#4b5c58] dark:text-[#a9bcb6]">
          你看到的每一个网页、灵感或工具，都可以一键保存，并自动变得清晰、有序、可随时回到。
        </p>

        <ul className="space-y-6">
          {VALUE_POINTS.map((point) => (
            <li key={point.title} className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0d9488] text-white">
                <CheckIcon />
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-[#0f1f1c] dark:text-[#e8f3ef]">
                  {point.title}
                </p>
                <p className="truncate text-[12px] text-[#4b5c58] dark:text-[#a9bcb6]">
                  {point.desc}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-[13px] italic text-[#7a8a86] dark:text-[#7d9089]">
          从信息过载中，重新掌控你的注意力。
        </p>
      </div>

      <div className="relative z-10 px-16 py-8">
        <p className="text-[12px] text-[#7a8a86] dark:text-[#7d9089]">
          © 2026 Bookmark Lite · 保留所有权利
        </p>
      </div>
    </aside>
  );
}
