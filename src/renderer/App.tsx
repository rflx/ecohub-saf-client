import { useMemo, useState } from 'react';

import { AppLayout } from './components/layout/AppLayout';
import { ApiEnvironmentsPage } from './pages/ApiEnvironmentsPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { LogsPage } from './pages/LogsPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { SettingsPage } from './pages/SettingsPage';
import { TopicsPage } from './pages/TopicsPage';
import { AppPage, NavigationItem } from './models';

const navigationItems: NavigationItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'profiles', label: 'Profile' },
  { id: 'api-environments', label: 'API Environments' },
  { id: 'topics', label: 'Kafka Topics' },
  { id: 'events', label: 'JSON Events' },
  { id: 'logs', label: 'Logs' },
  { id: 'settings', label: 'Einstellungen' },
];

export function App() {
  const [activePage, setActivePage] = useState<AppPage>('dashboard');

  const pageTitle = useMemo(() => {
    return navigationItems.find((item) => item.id === activePage)?.label ?? 'EcoHub SAF Client';
  }, [activePage]);

  return (
    <AppLayout
      activePage={activePage}
      navigationItems={navigationItems}
      pageTitle={pageTitle}
      onNavigate={setActivePage}
    >
      {activePage === 'dashboard' && <DashboardPage />}
      {activePage === 'profiles' && <ProfilesPage />}
      {activePage === 'api-environments' && <ApiEnvironmentsPage />}
      {activePage === 'topics' && <TopicsPage />}
      {activePage === 'events' && <EventsPage />}
      {activePage === 'logs' && <LogsPage />}
      {activePage === 'settings' && <SettingsPage />}
    </AppLayout>
  );
}
