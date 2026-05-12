import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatBot from './ChatBot';
import { useEffect } from 'react';

const titles = {
  '/': 'Career Compass — Dashboard',
  '/learn': 'Learning Path — Career Compass',
  '/get-started': 'Get Started — Career Compass',
  '/set-goals': 'Career Goals — Career Compass',
  '/job-search': 'Job Search — Career Compass',
};

export default function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = titles[pathname] || 'Career Compass';
  }, [pathname]);

  return (
    <>
      <Header />
      <main className="main-shell">
        <Outlet />
      </main>
      <Footer />
      <ChatBot pageKey={pathname} />
    </>
  );
}
