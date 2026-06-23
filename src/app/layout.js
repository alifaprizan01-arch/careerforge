import { UserProvider } from '../lib/userContext';
import { ThemeProvider } from '../lib/themeContext';
import { SidebarProvider } from '../lib/sidebarContext';
import { LanguageProvider } from '../lib/langContext';
import './globals.css';

export const metadata = {
  title: 'SiapKerja.id',
  description: 'Platform karir berbasis AI — SDGs 8',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <UserProvider>
            <SidebarProvider>
              <LanguageProvider>
                {children}
              </LanguageProvider>
            </SidebarProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}