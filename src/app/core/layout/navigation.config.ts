/** Registered Lucide icon name from `@ng-icons/lucide` (e.g. `lucideHome`). */
export type LucideNavIconName =
  | 'lucideLayoutDashboard'
  | 'lucideClock'
  | 'lucideBuilding2'
  | 'lucideClipboardList'
  | 'lucideFolderKanban'
  | 'lucideReceipt'
  | 'lucideSettings';

export type NavigationItem = {
  label: string;
  route: string;
  icon: LucideNavIconName;
  enabled: boolean;
  comingSoon?: boolean;
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

export const APP_NAVIGATION: NavigationSection[] = [
  {
    label: 'Workspace',
    items: [
      {
        label: 'Dashboard',
        route: '/',
        icon: 'lucideLayoutDashboard',
        enabled: true
      },
      {
        label: 'Time Entries',
        route: '/time-entries',
        icon: 'lucideClock',
        enabled: true
      }
    ]
  },
  {
    label: 'Management',
    items: [
      {
        label: 'Clients',
        route: '/clients',
        icon: 'lucideBuilding2',
        enabled: true
      },
      {
        label: 'Projects',
        route: '/projects',
        icon: 'lucideFolderKanban',
        enabled: true
      },
      {
        label: 'Orders',
        route: '/orders',
        icon: 'lucideClipboardList',
        enabled: true
      },
      {
        label: 'Invoices',
        route: '/invoices',
        icon: 'lucideReceipt',
        enabled: true
      }
    ]
  }
];

export const APP_NAVIGATION_FOOTER: NavigationItem[] = [
  {
    label: 'Settings',
    route: '/settings',
    icon: 'lucideSettings',
    enabled: true
  }
];
