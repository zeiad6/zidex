/* ------------------------------------------------------------------ *
 * Routes — one list that the navbar, the mobile menu, the footer and the
 * home index all read. A section cannot exist without a way to reach it,
 * and a route cannot exist without a label in both languages.
 * ------------------------------------------------------------------ */

export type RouteId =
  | 'home'
  | 'solutions'
  | 'programs'
  | 'store'
  | 'accounting'
  | 'trial'
  | 'journal'
  | 'about'
  | 'contact'

export type RouteMeta = {
  id: RouteId
  path: string
  label: { ar: string; en: string }
  short: { ar: string; en: string }
  /** Two-digit page number, used by the home index and the section rules. */
  index: string
  /** Shown in the floating bar on desktop. Home is reached through the logo. */
  primary: boolean
}

export const routes: RouteMeta[] = [
  { id: 'home', path: '/', label: { ar: 'الرئيسية', en: 'Home' }, short: { ar: 'الرئيسية', en: 'Home' }, index: '00', primary: false },
  { id: 'solutions', path: '/solutions', label: { ar: 'الحلول', en: 'Solutions' }, short: { ar: 'الحلول', en: 'Solutions' }, index: '01', primary: true },
  { id: 'programs', path: '/programs', label: { ar: 'البرامج', en: 'Programs' }, short: { ar: 'البرامج', en: 'Programs' }, index: '02', primary: true },
  { id: 'store', path: '/store', label: { ar: 'المتجر', en: 'Store' }, short: { ar: 'المتجر', en: 'Store' }, index: '03', primary: true },
  { id: 'accounting', path: '/accounting', label: { ar: 'الأنظمة المحاسبية', en: 'Accounting' }, short: { ar: 'المحاسبة', en: 'Accounting' }, index: '04', primary: true },
  { id: 'trial', path: '/trial', label: { ar: 'التجربة المجانية', en: 'Free trial' }, short: { ar: 'التجربة', en: 'Trial' }, index: '05', primary: false },
  { id: 'journal', path: '/journal', label: { ar: 'المقالات', en: 'Journal' }, short: { ar: 'المقالات', en: 'Journal' }, index: '06', primary: true },
  { id: 'about', path: '/about', label: { ar: 'عن المنظومة', en: 'About' }, short: { ar: 'عن', en: 'About' }, index: '07', primary: true },
  { id: 'contact', path: '/contact', label: { ar: 'تواصل', en: 'Contact' }, short: { ar: 'تواصل', en: 'Contact' }, index: '08', primary: false },
]

export const primaryRoutes = routes.filter((route) => route.primary)

export function routeById(id: RouteId): RouteMeta {
  return routes.find((route) => route.id === id) ?? routes[0]
}
