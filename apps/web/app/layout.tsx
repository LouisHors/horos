export const metadata = {
  title: "AI Agent Orchestration Platform",
  description: "Visual AI Agent workflow orchestration tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
