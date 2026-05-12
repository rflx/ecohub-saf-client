export type AppPage = 'dashboard' | 'profiles' | 'api-environments' | 'topics' | 'events' | 'logs' | 'settings';

export type NavigationItem = {
  id: AppPage;
  label: string;
};
