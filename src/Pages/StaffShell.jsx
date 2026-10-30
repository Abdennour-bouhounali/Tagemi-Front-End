import { API_BASE_URL } from '../config/environment';
import React, { useContext, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Globe, ChevronLeft, BookOpen } from 'lucide-react';
import { AppContext } from '../Context/AppContext';
import { ToastProvider, Sheet, SheetAction, Button, cx } from '../Components/ui';
import { ROLE_NAMES, staffHome, staffMoreLinks, staffTabs } from '../utils/staffNav';

const apiUrl = API_BASE_URL;

const STAFF_RULES = [
  'الالتزام بالمواعيد والحضور الفعّال طوال فترة الحملة.',
  'اتباع التعليمات والبروتوكولات المعتمدة من الفريق المسؤول.',
  'التعاون والعمل بروح الفريق لتحقيق أهداف الحملة.',
  'التعامل بمرونة واحترام مع الجمهور والفريق.',
  'الحفاظ على سرية المعلومات والامتناع عن تقديم استشارات غير مخولة.',
];

/**
 * Layout of every staff page: top bar (event + role), content, and the role's
 * tabs — a bottom bar on phones, a side rail from lg up.
 */
export default function StaffShell() {
  const { user, token, setUser, setToken } = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  // A screen can ask for the whole width (the event planning table) via useOutletContext().setWide
  const [wide, setWide] = useState(false);
  const [mustAcceptRules, setMustAcceptRules] = useState(!!location.state?.loggedIn);
  const [accepted, setAccepted] = useState(false);

  const tabs = staffTabs(user);
  const path = location.pathname + location.search;
  const isActive = (tab) => {
    if (tab.to && path === tab.to) return true;
    return (tab.match || []).some((prefix) => location.pathname.startsWith(prefix)) && !location.search.includes('scan=');
  };

  const logout = async () => {
    try {
      await fetch(`${apiUrl}/api/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
    } catch {
      // Logging out locally is enough if the network is down
    }
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    navigate('/login');
  };

  const title = user?.role_id === 1 ? 'لوحة الإدارة' : user?.event?.name || 'مؤسسة تجمي';

  const TabItem = ({ tab, rail }) => {
    const active = isActive(tab);
    const Icon = tab.icon;
    const inner = (
      <>
        <span className={cx('relative flex items-center justify-center rounded-full transition-colors', rail ? 'w-10 h-10' : 'w-14 h-8', active ? 'bg-ink text-white' : 'text-muted')}>
          <Icon className="w-5 h-5" />
          {active && !rail && <span className="absolute -top-2 h-1 w-6 rounded-full bg-rose" aria-hidden="true" />}
        </span>
        <span className={cx('text-[11px] font-semibold leading-none', active ? 'text-ink' : 'text-muted')}>{tab.label}</span>
      </>
    );
    const cls = cx('flex flex-col items-center gap-1 min-w-[4rem] py-2', rail && 'w-full');
    if (tab.key === 'more') {
      return <button type="button" onClick={() => setMoreOpen(true)} className={cls} aria-haspopup="dialog">{inner}</button>;
    }
    return <NavLink to={tab.to} className={cls} aria-current={active ? 'page' : undefined}>{inner}</NavLink>;
  };

  return (
    <ToastProvider>
      <div className="staff-app min-h-screen lg:ps-24" dir="rtl">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-line">
          <div className="mx-auto h-14 px-4 lg:px-8 flex items-center gap-3">
            <Link to={staffHome(user)} className="shrink-0" aria-label="الصفحة الرئيسية">
              <img src="/tagemi_logo.png" alt="" className="h-8 w-auto" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm text-ink truncate leading-tight">{title}</p>
              <p className="text-[11px] text-muted leading-tight">{ROLE_NAMES[user?.role_id]}</p>
            </div>
            <button type="button" onClick={() => setMoreOpen(true)} className="hidden lg:flex items-center gap-2 h-10 px-3 rounded-xl text-sm text-ink hover:bg-ink-faint">
              {user?.name}
            </button>
          </div>
        </header>

        {/* Side rail (desktop) */}
        <nav aria-label="التنقل" className="hidden lg:flex fixed inset-y-0 start-0 z-40 w-24 flex-col items-center gap-2 pt-20 bg-white border-e border-line">
          {tabs.map((tab) => <TabItem key={tab.key} tab={tab} rail />)}
        </nav>

        {user?.event?.is_simulation && (
          <div role="note" className="bg-st-pushed-bg text-st-pushed border-b border-st-pushed/30 px-4 py-2 text-center text-sm font-semibold">
            حدث تدريبي للمحاكاة فقط، البيانات هنا غير حقيقية ولن تعمل في الواقع
          </div>
        )}

        <main className={cx('mx-auto pt-4 lg:pt-6 pb-28 lg:pb-10', wide ? 'max-w-none px-2 lg:px-3' : 'max-w-screen-2xl px-4 lg:px-8')}>
          <Outlet context={{ setWide }} />
        </main>

        {/* Bottom bar (phones, tablets) */}
        <nav aria-label="التنقل" className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line safe-bottom">
          <div className="flex justify-around max-w-md mx-auto">
            {tabs.map((tab) => <TabItem key={tab.key} tab={tab} />)}
          </div>
        </nav>

        {/* More */}
        <Sheet open={moreOpen} onClose={() => setMoreOpen(false)} title={user?.name || 'الحساب'}>
          <p className="text-sm text-muted -mt-1 mb-3">{ROLE_NAMES[user?.role_id]}{user?.event?.name ? `، ${user.event.name}` : ''}</p>
          <div className="divide-y divide-line">
            {staffMoreLinks(user).map((link) => (
              <SheetAction key={link.to} icon={ChevronLeft} onClick={() => { setMoreOpen(false); navigate(link.to); }}>
                {link.label}
              </SheetAction>
            ))}
            <SheetAction icon={BookOpen} onClick={() => { setMoreOpen(false); navigate('/admin/patient-journey'); }}>دليل رحلة المريض</SheetAction>
            <SheetAction icon={Globe} onClick={() => { setMoreOpen(false); navigate('/home'); }}>موقع المؤسسة</SheetAction>
            <SheetAction icon={LogOut} tone="text-red-700" onClick={logout}>تسجيل الخروج</SheetAction>
          </div>
        </Sheet>

        {/* Code of conduct, once after login */}
        <Sheet open={mustAcceptRules} onClose={() => {}} title="ضوابط العمل في الحملة"
          footer={<Button block size="lg" disabled={!accepted} onClick={() => setMustAcceptRules(false)}>ابدأ العمل</Button>}>
          <ol className="space-y-2 text-ink list-decimal ps-5">
            {STAFF_RULES.map((rule) => <li key={rule}>{rule}</li>)}
          </ol>
          <label className="mt-4 flex items-center gap-3 min-h-[3rem] rounded-xl bg-paper px-3">
            <input type="checkbox" className="w-5 h-5 accent-[#101E58]" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span className="font-semibold">سألتزم بهذه الضوابط</span>
          </label>
        </Sheet>
      </div>
    </ToastProvider>
  );
}
