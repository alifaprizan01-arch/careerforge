import { UserProvider } from '../lib/userContext';
import { ThemeProvider } from '../lib/themeContext';
import './globals.css';

export const metadata = {
  title: 'CareerForge',
  description: 'Platform karir berbasis AI — SDGs 8',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
