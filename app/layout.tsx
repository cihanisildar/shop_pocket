// Root layout - The [locale] layout handles html/body tags, fonts, providers, and locale-specific setup
// This root layout just passes through children
// Note: In Next.js App Router, the root layout must return children directly when using nested layouts
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
