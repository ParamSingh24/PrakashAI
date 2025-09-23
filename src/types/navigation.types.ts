export interface NavItem {
  id: string;
  name: string;
  icon: string; // Lucide React icon name
  path: string;
  description?: string;
  badge?: number; // For notifications
}

export interface UserInfo {
  name: string;
  initials: string;
  avatar?: string;
}

export interface NavigationState {
  isMobileMenuOpen: boolean;
  activeRoute: string;
}
