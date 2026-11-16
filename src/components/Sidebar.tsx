import {
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Target,
  TrendingUp,
  LogOut,
  X,
} from 'lucide-react';
import type { CurrencyCode, UserProfile, ViewId } from '../types/finance';

interface SidebarProps {
  activeView: ViewId;
  onSelectView: (view: ViewId) => void;
  userProfile: UserProfile;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onSignOut: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const NAV_ITEMS: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ReceiptText },
  { id: 'budgets', label: 'Budgets', icon: PieChart },
  { id: 'goals', label: 'Savings Goals', icon: Target },
  { id: 'insights', label: 'Insights', icon: TrendingUp },
];

export function Sidebar({
  activeView,
  onSelectView,
  userProfile,
  onCurrencyChange,
  onSignOut,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const handleNav = (id: ViewId) => {
    onSelectView(id);
    onCloseMobile();
  };

  const initials = userProfile.displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'P';

  const content = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 px-4 py-6">
      <div className="flex items-center justify-between px-2 mb-8">
        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            handleNav('overview');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-lg"
        >
          <span className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-display font-bold text-lg shadow-xs">
            P
          </span>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900">
            Penny
          </span>
        </a>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNav(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-teal-700' : 'text-slate-400'
                }`}
                aria-hidden="true"
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="pt-5 mt-5 border-t border-slate-200 space-y-4">
        <div>
          <label
            htmlFor="currency-select"
            className="block text-xs font-medium text-slate-500 mb-1.5 px-1"
          >
            Display Currency
          </label>
          <select
            id="currency-select"
            value={userProfile.currency}
            onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <option value="USD">US Dollar ($)</option>
            <option value="GBP">British Pound (£)</option>
            <option value="EUR">Euro (€)</option>
          </select>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2.5 px-1">
            {userProfile.photoURL ? (
              <img
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover shrink-0 bg-slate-100"
              />
            ) : (
              <span className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold flex items-center justify-center shrink-0">
                {initials}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 truncate">
                {userProfile.displayName}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {userProfile.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block shrink-0 sticky top-0 h-screen overflow-y-auto">
        {content}
      </aside>
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
