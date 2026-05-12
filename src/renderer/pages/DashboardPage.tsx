import {
  ConnectionStatusPanel,
  JsonEventViewer,
  KafkaTopicList,
  LogViewer,
  ProfileSummary,
} from '../components/empty';

export function DashboardPage() {
  return (
    <div className="page-grid page-grid--dashboard">
      <ProfileSummary />
      <ConnectionStatusPanel />
      <KafkaTopicList />
      <JsonEventViewer />
      <LogViewer />
    </div>
  );
}
