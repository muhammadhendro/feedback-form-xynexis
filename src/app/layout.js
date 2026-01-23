import "./globals.css";

export const metadata = {
  title: "Feedback Form - Webinar Series | 2025",
  description: "Share your experience with us. Webinar Series 2025 Feedback Form.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
