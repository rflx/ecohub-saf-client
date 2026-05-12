import { ReactNode } from 'react';

import { AppPage, NavigationItem } from '../../models';
import { Sidebar } from './Sidebar';

type AppLayoutProps = {
  activePage: AppPage;
  children: ReactNode;
  navigationItems: NavigationItem[];
  pageTitle: string;
  onNavigate: (page: AppPage) => void;
};

export function AppLayout({
  activePage,
  children,
  navigationItems,
  pageTitle,
  onNavigate,
}: AppLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} items={navigationItems} onNavigate={onNavigate} />
      <main className="main-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">EcoHub SAF Client</p>
            <h1>{pageTitle}</h1>
          </div>
          <div className="connection-pill">
            <span className="status-dot status-dot--offline" />
            Offline
          </div>
        </header>
        <section className="content-area">{children}</section>
      </main>
    </div>
  );
}
