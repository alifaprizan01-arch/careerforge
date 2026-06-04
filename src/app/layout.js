export const metadata = {
  title: 'CareerForge',
  description: 'Welcome to CareerForge',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}