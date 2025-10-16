import "./globals.css";

export const metadata = {
  title: "Relayboard - Data Pipeline Manager",
  description: "CSV → Postgres (staging) → dbt → Slack",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
