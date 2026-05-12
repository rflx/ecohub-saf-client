import { ProfileSummary, ProfileSwitcher } from '../components/empty';

export function ProfilesPage() {
  return (
    <div className="page-grid">
      <ProfileSwitcher />
      <ProfileSummary />
    </div>
  );
}
