import { AppPage, NavigationItem } from '../../models';

type SidebarProps = {
  activePage: AppPage;
  items: NavigationItem[];
  onNavigate: (page: AppPage) => void;
};

export function Sidebar({ activePage, items, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">E</div>
        <div>
          <strong>EcoHub</strong>
          <span>SAF Client</span>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Hauptnavigation">
        {items.map((item) => (
          <button
            className={item.id === activePage ? 'nav-item nav-item--active' : 'nav-item'}
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
