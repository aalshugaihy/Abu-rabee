import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Committee, RequestRecord, TaskRecord } from '../data/types';
import { seedCommittees, seedRequests, seedTasks } from '../data/seed';

type DataContextValue = {
  committees: Committee[];
  requests: RequestRecord[];
  tasks: TaskRecord[];
  addCommittee: (c: Omit<Committee, 'id'> & { id?: string }) => void;
  updateCommittee: (id: string, patch: Partial<Committee>) => void;
  removeCommittee: (id: string) => void;
  addRequest: (r: Omit<RequestRecord, 'id'> & { id?: string }) => void;
  updateRequest: (id: string, patch: Partial<RequestRecord>) => void;
  removeRequest: (id: string) => void;
  addTask: (t: Omit<TaskRecord, 'id'> & { id?: string }) => void;
  updateTask: (id: string, patch: Partial<TaskRecord>) => void;
  removeTask: (id: string) => void;
  resetAll: () => void;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  committees: 'abu-rabee.committees',
  requests: 'abu-rabee.requests',
  tasks: 'abu-rabee.tasks',
} as const;

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function nextId(prefix: string, items: { id: string }[]): string {
  let n = items.length + 1;
  let candidate = `${prefix}-${String(n).padStart(3, '0')}`;
  const used = new Set(items.map((i) => i.id));
  while (used.has(candidate)) {
    n += 1;
    candidate = `${prefix}-${String(n).padStart(3, '0')}`;
  }
  return candidate;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [committees, setCommittees] = useState<Committee[]>(() => load(STORAGE_KEYS.committees, seedCommittees));
  const [requests, setRequests] = useState<RequestRecord[]>(() => load(STORAGE_KEYS.requests, seedRequests));
  const [tasks, setTasks] = useState<TaskRecord[]>(() => load(STORAGE_KEYS.tasks, seedTasks));

  useEffect(() => save(STORAGE_KEYS.committees, committees), [committees]);
  useEffect(() => save(STORAGE_KEYS.requests, requests), [requests]);
  useEffect(() => save(STORAGE_KEYS.tasks, tasks), [tasks]);

  const addCommittee = useCallback((c: Omit<Committee, 'id'> & { id?: string }) => {
    setCommittees((prev) => [{ ...c, id: c.id ?? nextId('CMT', prev) } as Committee, ...prev]);
  }, []);
  const updateCommittee = useCallback((id: string, patch: Partial<Committee>) => {
    setCommittees((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);
  const removeCommittee = useCallback((id: string) => {
    setCommittees((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const addRequest = useCallback((r: Omit<RequestRecord, 'id'> & { id?: string }) => {
    setRequests((prev) => {
      const year = new Date().getFullYear();
      const fallbackId = r.id ?? `REQ-${year}-${String(prev.length + 1).padStart(3, '0')}`;
      return [{ ...r, id: fallbackId } as RequestRecord, ...prev];
    });
  }, []);
  const updateRequest = useCallback((id: string, patch: Partial<RequestRecord>) => {
    setRequests((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);
  const removeRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const addTask = useCallback((t: Omit<TaskRecord, 'id'> & { id?: string }) => {
    setTasks((prev) => {
      const prefix = t.kind === 'routine' ? 'TSK-R' : 'TSK-T';
      const id = t.id ?? nextId(prefix, prev);
      return [{ ...t, id } as TaskRecord, ...prev];
    });
  }, []);
  const updateTask = useCallback((id: string, patch: Partial<TaskRecord>) => {
    setTasks((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);
  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setCommittees(seedCommittees);
    setRequests(seedRequests);
    setTasks(seedTasks);
  }, []);

  const value = useMemo(
    () => ({
      committees,
      requests,
      tasks,
      addCommittee,
      updateCommittee,
      removeCommittee,
      addRequest,
      updateRequest,
      removeRequest,
      addTask,
      updateTask,
      removeTask,
      resetAll,
    }),
    [
      committees,
      requests,
      tasks,
      addCommittee,
      updateCommittee,
      removeCommittee,
      addRequest,
      updateRequest,
      removeRequest,
      addTask,
      updateTask,
      removeTask,
      resetAll,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
