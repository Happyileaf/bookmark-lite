export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-[#fafbfc] dark:bg-slate-900">
      {children}
    </div>
  );
}
