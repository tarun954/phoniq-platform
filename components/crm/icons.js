function I({children,size=18,className=""}){return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>{children}</svg>}
export const GridIcon=p=><I {...p}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></I>;
export const UsersIcon=p=><I {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></I>;
export const PhoneIcon=p=><I {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.65 2.63a2 2 0 0 1-.45 2.11L8.03 9.74a16 16 0 0 0 6 6l1.28-1.28a2 2 0 0 1 2.11-.45c.85.31 1.73.53 2.63.65A2 2 0 0 1 22 16.92Z"/></I>;
export const CalendarIcon=p=><I {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></I>;
export const BriefcaseIcon=p=><I {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></I>;
export const MessageIcon=p=><I {...p}><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></I>;
export const CheckIcon=p=><I {...p}><path d="m5 12 4 4L19 6"/></I>;
export const TrashIcon=p=><I {...p}><path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6"/></I>;
export const SettingsIcon=p=><I {...p}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/></I>;
export const BellIcon=p=><I {...p}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></I>;
export const SearchIcon=p=><I {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></I>;
export const MenuIcon=p=><I {...p}><path d="M4 6h16M4 12h16M4 18h16"/></I>;
export const XIcon=p=><I {...p}><path d="m6 6 12 12M18 6 6 18"/></I>;
export const ChevronLeftIcon=p=><I {...p}><path d="m15 18-6-6 6-6"/></I>;
export const ChevronRightIcon=p=><I {...p}><path d="m9 18 6-6-6-6"/></I>;
export const LogOutIcon=p=><I {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></I>;
