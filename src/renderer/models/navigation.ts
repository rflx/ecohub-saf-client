export type AppPage = 'dashboard' | 'profiles' | 'topics' | 'events' | 'logs' | 'settings';

export type NavigationItem = {
  id: AppPage;
  label: string;
};
