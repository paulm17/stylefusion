import "../global.css";
import "@stylefusion/react/styles.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark">        
      <body>{children}</body>
    </html>
  );
}
