import { Outlet } from 'react-router-dom';
import { Header } from './header';
import { useLayout } from './context';

export function Wrapper() {
  const { isMobile } = useLayout();

  return (
    <div className="flex h-screen w-full [&_.container-fluid]:px-5">
      <div className="flex flex-col flex-1 min-w-0 w-full">
        {isMobile && <Header />}
        <main
          className="flex flex-col overflow-hidden flex-1 grow-full transition-all duration-300 pt-(--header-height-mobile) lg:pt-0 py-2.5"
          role="content"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
