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
  { label: 'Boards', href: '/boards' },
  { label: 'Bottle Openers', href: '/bottle-openers' },
  { label: 'Apparel', href: '/#apparel' },
  { label: 'Create Your Own', href: '/templates', cta: true },
  { label: 'Cart', href: '/cart' },
];

