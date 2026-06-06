import { UserProvider } from '../lib/userContext';
import './globals.css';

export const metadata = {
  title: 'CareerForge',
  description: 'Platform karir berbasis AI — SDGs 8',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}