import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import type { SavingsGoal } from '../types/finance';
import { validateGoalInput, type ValidationErrors } from '../utils/finance';

interface GoalModalProps {
  isOpen: boolean;
  initialGoal?: SavingsGoal | null;
  onClose: () => void;
  onSave: (data: Omit<SavingsGoal, 'id'>, existingId?: string) => void;
}

const GOAL_COLORS = [
  { label: 'Calm Teal', value: '#0D9488' },
  { label: 'Warm Violet', value: '#7C3AED' },
  { label: 'Sky Blue', value: '#0284C7' },
  { label: 'Fresh Emerald', value: '#059669' },
  { label: 'Amber Gold', value: '#D97706' },
];

export function GoalModal({
  isOpen,
  initialGoal,
  onClose,
  onSave,
}: GoalModalProps) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('2027-06-01');
  const [note, setNote] = useState('');
  const [color, setColor] = useState('#0D9488');
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!isOpen) return;
    if (initialGoal) {
      setName(initialGoal.name);
      setTargetAmount(String(initialGoal.targetAmount));
      setCurrentAmount(String(initialGoal.currentAmount));
      setTargetDate(initialGoal.targetDate);
      setNote(initialGoal.note ?? '');
      setColor(initialGoal.color);
    } else {
      setName('');
      setTargetAmount('');
      setCurrentAmount('0');
      setTargetDate('2027-06-01');
      setNote('');
      setColor('#0D9488');
    }
    setErrors({});
  }, [isOpen, initialGoal]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validationErrors = validateGoalInput({
      name,
      targetAmount,
      currentAmount,
      targetDate,
      note,
    });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    onSave(
      {
        name: name.trim(),
        targetAmount: Math.round(Number(targetAmount) * 100) / 100,
        currentAmount: Math.round(Number(currentAmount || '0') * 100) / 100,
        targetDate,
        note: note.trim() || undefined,
        color,
      },
      initialGoal?.id
    );
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 id="goal-modal-title" className="text-lg font-display font-bold text-slate-900">
            {initialGoal ? 'Edit Savings Goal' : 'Create a Savings Goal'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close savings goal dialog"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div>
            <label
              htmlFor="goal-name"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              What are you saving for?
            </label>
            <input
              id="goal-name"
              type="text"
              maxLength={100}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
              placeholder="e.g., Rainy Day Fund or Family Trip"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
            {errors.name && (
              <p role="alert" className="text-xs text-rose-600 mt-1">
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="goal-target"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Target Amount
              </label>
              <input
                id="goal-target"
                type="number"
                step="1"
                min="1"
                value={targetAmount}
                onChange={(e) => {
                  setTargetAmount(e.target.value);
                  if (errors.targetAmount) setErrors((p) => ({ ...p, targetAmount: '' }));
                }}
                placeholder="1000"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
              {errors.targetAmount && (
                <p role="alert" className="text-xs text-rose-600 mt-1">
                  {errors.targetAmount}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="goal-current"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Saved So Far
              </label>
              <input
                id="goal-current"
                type="number"
                step="1"
                min="0"
                value={currentAmount}
                onChange={(e) => {
                  setCurrentAmount(e.target.value);
                  if (errors.currentAmount) setErrors((p) => ({ ...p, currentAmount: '' }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
              {errors.currentAmount && (
                <p role="alert" className="text-xs text-rose-600 mt-1">
                  {errors.currentAmount}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="goal-date"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Target Date
              </label>
              <input
                id="goal-date"
                type="date"
                value={targetDate}
                onChange={(e) => {
                  setTargetDate(e.target.value);
                  if (errors.targetDate) setErrors((p) => ({ ...p, targetDate: '' }));
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              />
              {errors.targetDate && (
                <p role="alert" className="text-xs text-rose-600 mt-1">
                  {errors.targetDate}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="goal-color"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Accent Color
              </label>
              <select
                id="goal-color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                {GOAL_COLORS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="goal-note"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Why this matters (optional)
            </label>
            <input
              id="goal-note"
              type="text"
              maxLength={240}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (errors.note) setErrors((p) => ({ ...p, note: '' }));
              }}
              placeholder="A friendly reminder to stay motivated"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
            {errors.note && (
              <p role="alert" className="text-xs text-rose-600 mt-1">
                {errors.note}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors whitespace-nowrap"
            >
              {initialGoal ? 'Save Changes' : 'Create Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
