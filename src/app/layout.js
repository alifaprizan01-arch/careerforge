import { UserProvider } from '../lib/userContext';
import { ThemeProvider } from '../lib/themeContext';
import { SidebarProvider } from '../lib/sidebarContext';
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
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}