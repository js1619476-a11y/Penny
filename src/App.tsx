import { useEffect, useMemo, useState } from 'react';
import { Menu, Plus } from 'lucide-react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from './firebase/config';
import {
  contributeToGoalDoc,
  deleteBudgetDoc,
  deleteGoalDoc,
  deleteTransactionDoc,
  ensureUserProfile,
  saveBudgetDoc,
  saveGoalDoc,
  saveTransactionDoc,
  subscribeBudgets,
  subscribeGoals,
  subscribeTransactions,
  subscribeUserProfile,
  updateProfileCurrency,
} from './firebase/pennyDb';
import type {
  Budget,
  CategoryId,
  CurrencyCode,
  SavingsGoal,
  Transaction,
  TransactionFilters,
  UserProfile,
  ViewId,
} from './types/finance';
import {
  computeAllTimeBalance,
  computeBudgetProgress,
  computeCategoryBreakdown,
  computeGoalProgress,
  computeMonthlySummary,
  computeSixMonthTrend,
  filterTransactions,
  formatMonthLabel,
  generatePlainInsights,
  getAvailableMonths,
  getCurrentDateString,
  getCurrentMonthKey,
} from './utils/finance';
import {
  contributeLocalGoal,
  loadLocalFinanceState,
  readGuestModeFlag,
  removeLocalBudget,
  removeLocalGoal,
  removeLocalTransaction,
  saveLocalFinanceState,
  upsertLocalBudget,
  upsertLocalGoal,
  upsertLocalTransaction,
  writeGuestModeFlag,
  type LocalFinanceState,
} from './utils/localStore';
import { Sidebar } from './components/Sidebar';
import { SignInScreen } from './components/SignInScreen';
import { OverviewView } from './components/OverviewView';
import { TransactionsView } from './components/TransactionsView';
import { BudgetsView } from './components/BudgetsView';
import { GoalsView } from './components/GoalsView';
import { InsightsView } from './components/InsightsView';
import { TransactionModal } from './components/TransactionModal';
import { BudgetModal } from './components/BudgetModal';
import { GoalModal } from './components/GoalModal';
import { ContributeGoalModal } from './components/ContributeGoalModal';

const VIEW_TITLES: Record<ViewId, string> = {
  overview: 'Overview',
  transactions: 'Transactions',
  budgets: 'Budgets',
  goals: 'Savings Goals',
  insights: 'Insights',
};

export default function App() {
  const currentMonthKey = getCurrentMonthKey();
  const currentDateStr = getCurrentDateString();

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1' || params.get('guest') === '1') {
        return true;
      }
    }
    return readGuestModeFlag();
  });
  const [localState, setLocalState] = useState<LocalFinanceState>(() =>
    loadLocalFinanceState()
  );
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [activeView, setActiveView] = useState<ViewId>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthKey);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const [txFilters, setTxFilters] = useState<Omit<TransactionFilters, 'monthKey'>>({
    search: '',
    type: 'all',
    category: 'all',
  });

  // Modal state
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);

  // Persist guest local finance state whenever it changes
  useEffect(() => {
    saveLocalFinanceState(localState);
  }, [localState]);

  // Complete Google redirect sign-in if returning from mobile/popup-blocked redirect
  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setAuthError(
          `Sign-in is not authorized for "${host}" yet. Add "${host}" under Firebase Console -> Authentication -> Settings -> Authorized domains, or click "Open without signing in".`
        );
      } else if (!msg.includes('popup-closed-by-user')) {
        setAuthError('Could not complete Google Sign-In. You can still open Penny without signing in.');
      }
    });
  }, []);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) {
        setIsGuestMode(false);
        writeGuestModeFlag(false);
      } else {
        setUserProfile(null);
        setTransactions([]);
        setBudgets([]);
        setGoals([]);
        setDataLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Initialize user profile and attach Firestore listeners once authenticated
  useEffect(() => {
    if (!authReady || !authUser) return;

    let cancelled = false;
    let unsubProfile: (() => void) | undefined;
    let unsubTx: (() => void) | undefined;
    let unsubBudgets: (() => void) | undefined;
    let unsubGoals: (() => void) | undefined;

    const uid = authUser.uid;
    setDataLoading(true);
    setErrorBanner(null);

    ensureUserProfile(authUser)
      .then((initialProfile) => {
        if (cancelled) return;
        setUserProfile(initialProfile);

        const handleSubError = (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('Quota exceeded')) {
            setErrorBanner('Firestore daily free quota exceeded. Quota resets tomorrow.');
          } else {
            setErrorBanner('Unable to sync with Firestore right now. Please try again.');
          }
        };

        unsubProfile = subscribeUserProfile(
          uid,
          (profile) => {
            if (profile) setUserProfile(profile);
          },
          handleSubError
        );

        unsubTx = subscribeTransactions(
          uid,
          (items) => {
            setTransactions(items);
            setDataLoading(false);
          },
          handleSubError
        );

        unsubBudgets = subscribeBudgets(
          uid,
          (items) => setBudgets(items),
          handleSubError
        );

        unsubGoals = subscribeGoals(
          uid,
          (items) => setGoals(items),
          handleSubError
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setDataLoading(false);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Quota exceeded')) {
          setErrorBanner('Firestore daily free quota exceeded. Quota resets tomorrow.');
        } else {
          setErrorBanner('Could not load your profile from Firestore. Please refresh or sign in again.');
        }
      });

    return () => {
      cancelled = true;
      unsubProfile?.();
      unsubTx?.();
      unsubBudgets?.();
      unsubGoals?.();
    };
  }, [authReady, authUser]);

  useEffect(() => {
    if (!statusNotice) return;
    const timer = window.setTimeout(() => setStatusNotice(null), 3500);
    return () => window.clearTimeout(timer);
  }, [statusNotice]);

  const activeTransactions = authUser ? transactions : localState.transactions;
  const activeBudgets = authUser ? budgets : localState.budgets;
  const activeGoals = authUser ? goals : localState.goals;
  const currency: CurrencyCode = authUser
    ? userProfile?.currency ?? 'USD'
    : localState.currency;

  const availableMonths = useMemo(
    () => getAvailableMonths(activeTransactions, currentMonthKey),
    [activeTransactions, currentMonthKey]
  );

  const fullFilters: TransactionFilters = useMemo(
    () => ({ ...txFilters, monthKey: selectedMonth }),
    [txFilters, selectedMonth]
  );

  const monthScopedTransactions = useMemo(
    () =>
      filterTransactions(activeTransactions, {
        monthKey: selectedMonth,
        search: '',
        type: 'all',
        category: 'all',
      }),
    [activeTransactions, selectedMonth]
  );

  const filteredTransactions = useMemo(
    () => filterTransactions(activeTransactions, fullFilters),
    [activeTransactions, fullFilters]
  );

  const allTimeBalance = useMemo(
    () => computeAllTimeBalance(activeTransactions),
    [activeTransactions]
  );

  const monthlySummary = useMemo(
    () => computeMonthlySummary(activeTransactions, selectedMonth),
    [activeTransactions, selectedMonth]
  );

  const categoryBreakdown = useMemo(
    () => computeCategoryBreakdown(activeTransactions, selectedMonth),
    [activeTransactions, selectedMonth]
  );

  const budgetProgress = useMemo(
    () =>
      computeBudgetProgress(
        activeBudgets,
        activeTransactions,
        selectedMonth === 'all' ? currentMonthKey : selectedMonth
      ),
    [activeBudgets, activeTransactions, selectedMonth, currentMonthKey]
  );

  const goalProgress = useMemo(
    () => activeGoals.map(computeGoalProgress),
    [activeGoals]
  );

  const sixMonthTrend = useMemo(
    () =>
      computeSixMonthTrend(
        activeTransactions,
        selectedMonth === 'all' ? currentMonthKey : selectedMonth
      ),
    [activeTransactions, selectedMonth, currentMonthKey]
  );

  const insights = useMemo(
    () =>
      generatePlainInsights(
        activeTransactions,
        activeBudgets,
        activeGoals,
        selectedMonth,
        currency
      ),
    [activeTransactions, activeBudgets, activeGoals, selectedMonth, currency]
  );

  // Auth and guest handlers
  const handleContinueGuest = () => {
    setAuthError(null);
    setErrorBanner(null);
    setIsGuestMode(true);
    writeGuestModeFlag(true);
    setActiveView('overview');
    setSelectedMonth(getCurrentMonthKey());
  };

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setActiveView('overview');
      setSelectedMonth(getCurrentMonthKey());
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (
        msg.includes('popup-blocked') ||
        msg.includes('operation-not-supported-in-this-environment')
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          setAuthError('Your browser blocked the sign-in popup. Please allow popups or click "Open without signing in".');
        }
      } else if (msg.includes('popup-closed-by-user')) {
        setAuthError('Sign-in was canceled before finishing. You can try again or open without signing in.');
      } else if (msg.includes('unauthorized-domain')) {
        const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
        setAuthError(
          `Sign-in is not authorized for "${host}" yet. Add "${host}" under Firebase Console -> Authentication -> Settings -> Authorized domains, or click "Open without signing in".`
        );
      } else {
        setAuthError('Could not sign in with Google right now. You can try again or open without signing in.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    if (!authUser) {
      setIsGuestMode(false);
      writeGuestModeFlag(false);
      setStatusNotice(null);
      setErrorBanner(null);
      setActiveView('overview');
      return;
    }
    try {
      await signOut(auth);
      setIsGuestMode(false);
      writeGuestModeFlag(false);
      setStatusNotice(null);
      setErrorBanner(null);
      setActiveView('overview');
    } catch {
      setErrorBanner('Could not sign out cleanly. Please refresh the page.');
    }
  };

  // Persistence mutation handlers (Firestore when signed in, local browser storage in guest mode)
  const handleSaveTransaction = async (
    payload: Omit<Transaction, 'id' | 'createdAtMs'>,
    existingId?: string
  ) => {
    setErrorBanner(null);
    if (!authUser) {
      setLocalState((prev) => upsertLocalTransaction(prev, payload, existingId));
      setStatusNotice(existingId ? 'Transaction updated.' : 'Transaction saved on this device.');
      return;
    }
    try {
      await saveTransactionDoc(authUser.uid, payload, existingId);
      setStatusNotice(existingId ? 'Transaction updated.' : 'Transaction saved.');
    } catch {
      setErrorBanner('Could not save transaction to Firestore.');
    }
  };

  const handleDeleteTransaction = async (tx: Transaction) => {
    setErrorBanner(null);
    if (!authUser) {
      setLocalState((prev) => removeLocalTransaction(prev, tx.id));
      setStatusNotice(`Removed "${tx.description}".`);
      return;
    }
    try {
      await deleteTransactionDoc(authUser.uid, tx.id);
      setStatusNotice(`Removed "${tx.description}".`);
    } catch {
      setErrorBanner('Could not remove transaction from Firestore.');
    }
  };

  const handleSaveBudget = async (
    category: CategoryId,
    limit: number,
    existingId?: string
  ) => {
    setErrorBanner(null);
    if (!authUser) {
      setLocalState((prev) => upsertLocalBudget(prev, category, limit, existingId));
      setStatusNotice(existingId ? 'Budget updated.' : 'Monthly budget saved on this device.');
      return;
    }
    try {
      await saveBudgetDoc(authUser.uid, category, limit, existingId);
      setStatusNotice(existingId ? 'Budget updated.' : 'Monthly budget saved.');
    } catch {
      setErrorBanner('Could not save budget to Firestore.');
    }
  };

  const handleDeleteBudget = async (budget: Budget) => {
    setErrorBanner(null);
    if (!authUser) {
      setLocalState((prev) => removeLocalBudget(prev, budget.id));
      setStatusNotice('Budget removed.');
      return;
    }
    try {
      await deleteBudgetDoc(authUser.uid, budget.id);
      setStatusNotice('Budget removed.');
    } catch {
      setErrorBanner('Could not remove budget from Firestore.');
    }
  };

  const handleSaveGoal = async (
    payload: Omit<SavingsGoal, 'id'>,
    existingId?: string
  ) => {
    setErrorBanner(null);
    if (!authUser) {
      setLocalState((prev) => upsertLocalGoal(prev, payload, existingId));
      setStatusNotice(existingId ? 'Savings goal updated.' : 'Savings goal created on this device.');
      return;
    }
    try {
      await saveGoalDoc(authUser.uid, payload, existingId);
      setStatusNotice(existingId ? 'Savings goal updated.' : 'Savings goal created.');
    } catch {
      setErrorBanner('Could not save savings goal to Firestore.');
    }
  };

  const handleDeleteGoal = async (goal: SavingsGoal) => {
    setErrorBanner(null);
    if (!authUser) {
      setLocalState((prev) => removeLocalGoal(prev, goal.id));
      setStatusNotice(`Removed goal "${goal.name}".`);
      return;
    }
    try {
      await deleteGoalDoc(authUser.uid, goal.id);
      setStatusNotice(`Removed goal "${goal.name}".`);
    } catch {
      setErrorBanner('Could not remove savings goal from Firestore.');
    }
  };

  const handleContributeGoal = async (
    goalId: string,
    amount: number,
    alsoLogTransaction: boolean
  ) => {
    const targetGoal = activeGoals.find((g) => g.id === goalId);
    if (!targetGoal) return;
    setErrorBanner(null);
    if (!authUser) {
      setLocalState((prev) =>
        contributeLocalGoal(prev, goalId, amount, alsoLogTransaction, currentDateStr)
      );
      setStatusNotice(`Added savings to "${targetGoal.name}".`);
      return;
    }
    try {
      await contributeToGoalDoc(
        authUser.uid,
        targetGoal,
        amount,
        alsoLogTransaction,
        currentDateStr
      );
      setStatusNotice(`Added savings to "${targetGoal.name}".`);
    } catch {
      setErrorBanner('Could not update savings goal in Firestore.');
    }
  };

  const handleCurrencyChange = async (nextCurrency: CurrencyCode) => {
    setErrorBanner(null);
    if (!authUser) {
      setLocalState((prev) => ({ ...prev, currency: nextCurrency }));
      return;
    }
    try {
      await updateProfileCurrency(authUser.uid, nextCurrency);
    } catch {
      setErrorBanner('Could not update currency preference.');
    }
  };

  if (!authReady && !isGuestMode) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white font-display font-bold text-xl flex items-center justify-center mx-auto">
            P
          </div>
          <p className="text-sm text-slate-600">Loading Penny...</p>
        </div>
      </div>
    );
  }

  if (!authUser && !isGuestMode) {
    return (
      <SignInScreen
        onSignIn={handleGoogleSignIn}
        onContinueGuest={handleContinueGuest}
        isSigningIn={isSigningIn}
        errorMessage={authError}
      />
    );
  }

  const activeProfile: UserProfile = authUser
    ? userProfile ?? {
        uid: authUser.uid,
        displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Penny User',
        email: authUser.email || '',
        photoURL: authUser.photoURL || undefined,
        currency: 'USD',
      }
    : {
        uid: 'guest-device',
        displayName: 'Guest',
        email: 'Saved on this device',
        currency: localState.currency,
      };

  const userFirstName = activeProfile.displayName.split(' ')[0] || 'Guest';

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        userProfile={activeProfile}
        isGuestMode={!authUser}
        isSigningIn={isSigningIn}
        onSignIn={handleGoogleSignIn}
        onCurrencyChange={handleCurrencyChange}
        onSignOut={handleSignOut}
        isOpenMobile={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Clean Fluent Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-8 py-3">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open account and settings menu"
                className="lg:hidden p-2 -ml-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <Menu className="w-5 h-5" aria-hidden="true" />
              </button>
              <span className="lg:hidden w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white font-display font-bold text-sm shrink-0">
                P
              </span>
              <h1 className="text-lg sm:text-xl font-display font-bold text-slate-900 whitespace-nowrap">
                {VIEW_TITLES[activeView]}
              </h1>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 ml-auto shrink-0">
              <select
                aria-label="Select month to view"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
                <option value="all">All Time</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setEditingTx(null);
                  setTxModalOpen(true);
                }}
                aria-label="Add Transaction"
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add Transaction</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto">
            {errorBanner && (
              <div
                role="alert"
                className="mb-5 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm font-medium text-rose-800 flex items-center justify-between"
              >
                <span>{errorBanner}</span>
                <button
                  type="button"
                  onClick={() => setErrorBanner(null)}
                  className="text-xs text-rose-700 hover:underline ml-4"
                >
                  Dismiss
                </button>
              </div>
            )}

            {statusNotice && (
              <div
                role="status"
                aria-live="polite"
                className="mb-5 px-4 py-2.5 rounded-xl bg-teal-50 border border-teal-200 text-xs sm:text-sm font-medium text-teal-900 flex items-center justify-between"
              >
                <span>{statusNotice}</span>
                <button
                  type="button"
                  onClick={() => setStatusNotice(null)}
                  className="text-xs text-teal-700 hover:underline ml-4"
                >
                  Dismiss
                </button>
              </div>
            )}

            {dataLoading && authUser ? (
              <div className="space-y-4" aria-busy="true" aria-label="Loading your profile">
                <div className="h-44 rounded-2xl bg-white border border-slate-200 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ) : (
              <>
                {activeView === 'overview' && (
                  <OverviewView
                    monthKey={selectedMonth}
                    currency={currency}
                    userFirstName={userFirstName}
                    allTimeBalance={allTimeBalance}
                    summary={monthlySummary}
                    recentTransactions={monthScopedTransactions}
                    categoryBreakdown={categoryBreakdown}
                    budgetProgress={budgetProgress}
                    goalProgress={goalProgress}
                    insights={insights}
                    onNavigate={setActiveView}
                    onAddTransaction={() => {
                      setEditingTx(null);
                      setTxModalOpen(true);
                    }}
                    onContributeGoal={(goalId) => {
                      const found = activeGoals.find((g) => g.id === goalId);
                      if (found) setContributingGoal(found);
                    }}
                  />
                )}

                {activeView === 'transactions' && (
                  <TransactionsView
                    transactions={filteredTransactions}
                    allTransactionsCount={activeTransactions.length}
                    filters={fullFilters}
                    currency={currency}
                    onFiltersChange={(next) => {
                      setSelectedMonth(next.monthKey);
                      setTxFilters({
                        search: next.search,
                        type: next.type,
                        category: next.category,
                      });
                    }}
                    onAddTransaction={() => {
                      setEditingTx(null);
                      setTxModalOpen(true);
                    }}
                    onEditTransaction={(tx) => {
                      setEditingTx(tx);
                      setTxModalOpen(true);
                    }}
                    onDeleteTransaction={handleDeleteTransaction}
                  />
                )}

                {activeView === 'budgets' && (
                  <BudgetsView
                    monthKey={selectedMonth}
                    currency={currency}
                    items={budgetProgress}
                    onAddBudget={() => {
                      setEditingBudget(null);
                      setBudgetModalOpen(true);
                    }}
                    onEditBudget={(b) => {
                      setEditingBudget(b);
                      setBudgetModalOpen(true);
                    }}
                    onDeleteBudget={handleDeleteBudget}
                  />
                )}

                {activeView === 'goals' && (
                  <GoalsView
                    currency={currency}
                    items={goalProgress}
                    onCreateGoal={() => {
                      setEditingGoal(null);
                      setGoalModalOpen(true);
                    }}
                    onEditGoal={(g) => {
                      setEditingGoal(g);
                      setGoalModalOpen(true);
                    }}
                    onDeleteGoal={handleDeleteGoal}
                    onContribute={(g) => setContributingGoal(g)}
                  />
                )}

                {activeView === 'insights' && (
                  <InsightsView
                    monthKey={selectedMonth}
                    currency={currency}
                    summary={monthlySummary}
                    categoryBreakdown={categoryBreakdown}
                    sixMonthTrend={sixMonthTrend}
                    monthTransactions={monthScopedTransactions}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={txModalOpen}
        initialTransaction={editingTx}
        defaultDate={currentDateStr}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
      />

      <BudgetModal
        isOpen={budgetModalOpen}
        initialBudget={editingBudget}
        existingCategories={activeBudgets.map((b) => b.category)}
        onClose={() => {
          setBudgetModalOpen(false);
          setEditingBudget(null);
        }}
        onSave={handleSaveBudget}
      />

      <GoalModal
        isOpen={goalModalOpen}
        initialGoal={editingGoal}
        onClose={() => {
          setGoalModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
      />

      <ContributeGoalModal
        goal={contributingGoal}
        currency={currency}
        onClose={() => setContributingGoal(null)}
        onContribute={handleContributeGoal}
      />
    </div>
  );
}
