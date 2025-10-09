export type NavItem = {
  label: string;
  href: string;
  auth?: 'any' | 'authed' | 'guest';
  cta?: boolean;
  desktopOnly?: boolean;
  mobileOnly?: boolean;
};

export const mainNav: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'Info', href: '/info' },
  { label: 'Contact', href: '/contact' },
  { label: 'Create Your Own', href: '/templates', cta: true },
  { label: 'Cart', href: '/cart' },
];
