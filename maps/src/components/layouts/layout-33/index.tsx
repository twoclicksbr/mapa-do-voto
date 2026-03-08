import { Helmet } from 'react-helmet-async';
import { Wrapper } from './components/wrapper';
import { LayoutProvider } from './components/context';
import { LoginModalProvider } from '@/components/auth/login-modal-context';

export function Layout33() {
  return (
    <>
      <Helmet>
        <title>Layout 33</title>
      </Helmet>

      <LoginModalProvider>
        <LayoutProvider
          bodyClassName="bg-muted/30 dark:bg-zinc-900"
          style={{
            '--sidebar-width': '310px',
            '--sidebar-header-height': '60px',
            '--header-height': '60px',
            '--header-height-mobile': '60px',
          } as React.CSSProperties}
        >
          <Wrapper />
        </LayoutProvider>
      </LoginModalProvider>
    </>
  );
}
