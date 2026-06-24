import { UserProvider } from '../lib/userContext';
import { ThemeProvider } from '../lib/themeContext';
import { SidebarProvider } from '../lib/sidebarContext';
import { LanguageProvider } from '../lib/langContext';
import MobileWrapper from './components/MobileWrapper';
import './globals.css';

export const metadata = {
  title: 'SiapKerja.id — Platform Kesiapan Kerja Berbasis AI',
  description: 'Temukan pelatihan, mentor, dan lowongan kerja dalam satu platform. SiapKerja.id membantu Anda membangun karier profesional, mendukung SDGs 8.',
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
                <MobileWrapper>
                  {children}
                </MobileWrapper>
              </LanguageProvider>
            </SidebarProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}