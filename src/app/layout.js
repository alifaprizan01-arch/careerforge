import './globals.css';

export const metadata = {
  title: 'CareerForge',
  description: 'Welcome to CareerForge',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@600;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      </head>
      <body style={{ margin: 0, padding: 0, boxSizing: 'border-box', backgroundColor: '#F8FAFC', color: '#1E293B', overflowX: 'hidden' }}>
        {children}
      </body>
    </html>
  );
}