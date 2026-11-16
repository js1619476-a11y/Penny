import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { auth, db } from './config';
import type {
  Budget,
  CategoryId,
  CurrencyCode,
  SavingsGoal,
  Transaction,
  UserProfile,
} from '../types/finance';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

function generateDocId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

function toMillis(ts: unknown): number {
  if (ts instanceof Timestamp) return ts.toMillis();
  return 0;
}

export async function ensureUserProfile(user: User): Promise<UserProfile> {
  const profilePath = `users/${user.uid}`;
  const ref = doc(db, 'users', user.uid);

  const displayName = (user.displayName || user.email?.split('@')[0] || 'Penny User')
    .trim()
    .slice(0, 120);
  const email = (user.email || '').trim().slice(0, 254);
  const photoURL = user.photoURL ? user.photoURL.slice(0, 500) : undefined;

  let existingSnap;
  try {
    existingSnap = await getDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }

  if (!existingSnap.exists()) {
    const newProfile: Record<string, unknown> = {
      uid: user.uid,
      displayName,
      email,
      currency: 'USD',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (photoURL) {
      newProfile.photoURL = photoURL;
    }

    try {
      await setDoc(ref, newProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, profilePath);
    }

    return {
      uid: user.uid,
      displayName,
      email,
      photoURL,
      currency: 'USD',
    };
  }

  const existingData = existingSnap.data();
  const currency: CurrencyCode =
    existingData.currency === 'GBP' || existingData.currency === 'EUR'
      ? existingData.currency
      : 'USD';

  const needsIdentitySync =
    existingData.displayName !== displayName ||
    existingData.email !== email ||
    (photoURL ?? undefined) !== (existingData.photoURL ?? undefined);

  if (needsIdentitySync) {
    const updatePayload: Record<string, unknown> = {
      displayName,
      email,
      updatedAt: serverTimestamp(),
    };
    if (photoURL) {
      updatePayload.photoURL = photoURL;
    } else if ('photoURL' in existingData) {
      updatePayload.photoURL = deleteField();
    }

    try {
      await updateDoc(ref, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, profilePath);
    }
  }

  return {
    uid: user.uid,
    displayName,
    email,
    photoURL,
    currency,
  };
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  return onSnapshot(
    ref,
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      const d = snap.data();
      const currency: CurrencyCode =
        d.currency === 'GBP' || d.currency === 'EUR' ? d.currency : 'USD';
      onData({
        uid: String(d.uid || uid),
        displayName: String(d.displayName || 'Penny User'),
        email: String(d.email || ''),
        photoURL: typeof d.photoURL === 'string' ? d.photoURL : undefined,
        currency,
      });
    },
    (error) => {
      onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch {
        // Error already logged with structured context
      }
    }
  );
}

export function subscribeTransactions(
  uid: string,
  onData: (items: Transaction[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const path = `users/${uid}/transactions`;
  const q = query(collection(db, 'users', uid, 'transactions'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Transaction[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          description: String(d.description || ''),
          amount: Number(d.amount || 0),
          type: d.type === 'income' ? 'income' : 'expense',
          category: d.category as CategoryId,
          date: String(d.date || ''),
          note: typeof d.note === 'string' ? d.note : undefined,
          createdAtMs: toMillis(d.createdAt),
        };
      });
      items.sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0);
      });
      onData(items);
    },
    (error) => {
      onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Error logged
      }
    }
  );
}

export function subscribeBudgets(
  uid: string,
  onData: (items: Budget[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const path = `users/${uid}/budgets`;
  const q = query(collection(db, 'users', uid, 'budgets'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: Budget[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          category: d.category as CategoryId,
          limit: Number(d.limit || 0),
        };
      });
      onData(items);
    },
    (error) => {
      onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Error logged
      }
    }
  );
}

export function subscribeGoals(
  uid: string,
  onData: (items: SavingsGoal[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  const path = `users/${uid}/goals`;
  const q = query(collection(db, 'users', uid, 'goals'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavingsGoal[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: docSnap.id,
          name: String(d.name || ''),
          targetAmount: Number(d.targetAmount || 0),
          currentAmount: Number(d.currentAmount || 0),
          targetDate: String(d.targetDate || ''),
          note: typeof d.note === 'string' ? d.note : undefined,
          color: String(d.color || '#0D9488'),
        };
      });
      onData(items);
    },
    (error) => {
      onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch {
        // Error logged
      }
    }
  );
}

export async function updateProfileCurrency(
  uid: string,
  currency: CurrencyCode
): Promise<void> {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), {
      currency,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveTransactionDoc(
  uid: string,
  payload: Omit<Transaction, 'id' | 'createdAtMs'>,
  existingId?: string
): Promise<void> {
  const docId = existingId || generateDocId('tx');
  const path = `users/${uid}/transactions/${docId}`;
  const ref = doc(db, 'users', uid, 'transactions', docId);

  const sanitizedDesc = payload.description.trim().slice(0, 120);
  const sanitizedNote = payload.note ? payload.note.trim().slice(0, 240) : '';

  if (existingId) {
    const updatePayload: Record<string, unknown> = {
      description: sanitizedDesc,
      amount: payload.amount,
      type: payload.type,
      category: payload.category,
      date: payload.date,
      updatedAt: serverTimestamp(),
    };
    if (sanitizedNote) {
      updatePayload.note = sanitizedNote;
    } else {
      updatePayload.note = deleteField();
    }

    try {
      await updateDoc(ref, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    return;
  }

  const createPayload: Record<string, unknown> = {
    ownerId: uid,
    description: sanitizedDesc,
    amount: payload.amount,
    type: payload.type,
    category: payload.category,
    date: payload.date,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (sanitizedNote) {
    createPayload.note = sanitizedNote;
  }

  try {
    await setDoc(ref, createPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteTransactionDoc(
  uid: string,
  transactionId: string
): Promise<void> {
  const path = `users/${uid}/transactions/${transactionId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'transactions', transactionId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveBudgetDoc(
  uid: string,
  category: CategoryId,
  limit: number,
  existingId?: string
): Promise<void> {
  const docId = existingId || generateDocId('b');
  const path = `users/${uid}/budgets/${docId}`;
  const ref = doc(db, 'users', uid, 'budgets', docId);

  if (existingId) {
    try {
      await updateDoc(ref, {
        category,
        limit,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    return;
  }

  try {
    await setDoc(ref, {
      ownerId: uid,
      category,
      limit,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteBudgetDoc(uid: string, budgetId: string): Promise<void> {
  const path = `users/${uid}/budgets/${budgetId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'budgets', budgetId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveGoalDoc(
  uid: string,
  payload: Omit<SavingsGoal, 'id'>,
  existingId?: string
): Promise<void> {
  const docId = existingId || generateDocId('g');
  const path = `users/${uid}/goals/${docId}`;
  const ref = doc(db, 'users', uid, 'goals', docId);

  const sanitizedName = payload.name.trim().slice(0, 100);
  const sanitizedNote = payload.note ? payload.note.trim().slice(0, 240) : '';

  if (existingId) {
    const updatePayload: Record<string, unknown> = {
      name: sanitizedName,
      targetAmount: payload.targetAmount,
      currentAmount: payload.currentAmount,
      targetDate: payload.targetDate,
      color: payload.color,
      updatedAt: serverTimestamp(),
    };
    if (sanitizedNote) {
      updatePayload.note = sanitizedNote;
    } else {
      updatePayload.note = deleteField();
    }

    try {
      await updateDoc(ref, updatePayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    return;
  }

  const createPayload: Record<string, unknown> = {
    ownerId: uid,
    name: sanitizedName,
    targetAmount: payload.targetAmount,
    currentAmount: payload.currentAmount,
    targetDate: payload.targetDate,
    color: payload.color,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (sanitizedNote) {
    createPayload.note = sanitizedNote;
  }

  try {
    await setDoc(ref, createPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteGoalDoc(uid: string, goalId: string): Promise<void> {
  const path = `users/${uid}/goals/${goalId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'goals', goalId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function contributeToGoalDoc(
  uid: string,
  goal: SavingsGoal,
  amount: number,
  alsoLogTransaction: boolean,
  todayDate: string
): Promise<void> {
  const goalPath = `users/${uid}/goals/${goal.id}`;
  const newAmount = Math.round((goal.currentAmount + amount) * 100) / 100;

  const batch = writeBatch(db);
  batch.update(doc(db, 'users', uid, 'goals', goal.id), {
    currentAmount: newAmount,
    updatedAt: serverTimestamp(),
  });

  if (alsoLogTransaction) {
    const txId = generateDocId('tx_goal');
    batch.set(doc(db, 'users', uid, 'transactions', txId), {
      ownerId: uid,
      description: `Saved for ${goal.name}`.slice(0, 120),
      amount,
      type: 'expense',
      category: 'savings',
      date: todayDate,
      note: 'Goal contribution',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, goalPath);
  }
}
