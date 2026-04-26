import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { ActivityAction, ActivityEntity, ActivityLog, Comment, Committee, RequestRecord, TaskDependency, TaskRecord } from '../data/types';
import { seedCommittees, seedRequests, seedTasks } from '../data/seed';

type DataContextValue = {
  committees: Committee[];
  requests: RequestRecord[];
  tasks: TaskRecord[];
  activity: ActivityLog[];
  comments: Comment[];
  addCommittee: (c: Omit<Committee, 'id'> & { id?: string }) => void;
  updateCommittee: (id: string, patch: Partial<Committee>) => void;
  removeCommittee: (id: string) => void;
  addRequest: (r: Omit<RequestRecord, 'id'> & { id?: string }) => void;
  updateRequest: (id: string, patch: Partial<RequestRecord>) => void;
  removeRequest: (id: string) => void;
  addTask: (t: Omit<TaskRecord, 'id'> & { id?: string }) => void;
  updateTask: (id: string, patch: Partial<TaskRecord>) => void;
  removeTask: (id: string) => void;
  addComment: (c: Omit<Comment, 'id' | 'at'>) => void;
  removeComment: (id: string) => void;
  dependencies: TaskDependency[];
  addDependency: (taskId: string, dependsOnId: string) => { ok: true } | { ok: false; reason: 'cycle' | 'self' | 'duplicate' };
  removeDependency: (id: string) => void;
  resetAll: () => void;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  committees: 'abu-rabee.committees',
  requests: 'abu-rabee.requests',
  tasks: 'abu-rabee.tasks',
  activity: 'abu-rabee.activity',
  comments: 'abu-rabee.comments',
  dependencies: 'abu-rabee.dependencies',
} as const;

const ACTIVITY_LIMIT = 200;

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

function newActivityId(): string {
  return `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [committees, setCommittees] = useState<Committee[]>(() => load(STORAGE_KEYS.committees, seedCommittees));
  const [requests, setRequests] = useState<RequestRecord[]>(() => load(STORAGE_KEYS.requests, seedRequests));
  const [tasks, setTasks] = useState<TaskRecord[]>(() => load(STORAGE_KEYS.tasks, seedTasks));
  const [activity, setActivity] = useState<ActivityLog[]>(() => load(STORAGE_KEYS.activity, [] as ActivityLog[]));
  const [comments, setComments] = useState<Comment[]>(() => load(STORAGE_KEYS.comments, [] as Comment[]));
  const [dependencies, setDependencies] = useState<TaskDependency[]>(() => load(STORAGE_KEYS.dependencies, [] as TaskDependency[]));

  useEffect(() => save(STORAGE_KEYS.committees, committees), [committees]);
  useEffect(() => save(STORAGE_KEYS.requests, requests), [requests]);
  useEffect(() => save(STORAGE_KEYS.tasks, tasks), [tasks]);
  useEffect(() => save(STORAGE_KEYS.activity, activity), [activity]);
  useEffect(() => save(STORAGE_KEYS.comments, comments), [comments]);
  useEffect(() => save(STORAGE_KEYS.dependencies, dependencies), [dependencies]);

  const log = useCallback((entity: ActivityEntity, action: ActivityAction, entityId: string, label?: string) => {
    setActivity((prev) => {
      const entry: ActivityLog = {
        id: newActivityId(),
        at: new Date().toISOString(),
        entity,
        action,
        entityId,
        label,
      };
      // Keep newest first; cap to ACTIVITY_LIMIT to bound localStorage growth.
      return [entry, ...prev].slice(0, ACTIVITY_LIMIT);
    });
  }, []);

  const addCommittee = useCallback(
    (c: Omit<Committee, 'id'> & { id?: string }) => {
      setCommittees((prev) => {
        const id = c.id ?? nextId('CMT', prev);
        const now = new Date().toISOString();
        const next: Committee = { ...(c as Committee), id, createdAt: now, updatedAt: now };
        log('committee', 'create', id, next.name);
        return [next, ...prev];
      });
    },
    [log]
  );
  const updateCommittee = useCallback(
    (id: string, patch: Partial<Committee>) => {
      setCommittees((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const merged = { ...it, ...patch, updatedAt: new Date().toISOString() };
          log('committee', 'update', id, merged.name);
          return merged;
        })
      );
    },
    [log]
  );
  const removeCommittee = useCallback(
    (id: string) => {
      setCommittees((prev) => {
        const found = prev.find((it) => it.id === id);
        if (found) log('committee', 'delete', id, found.name);
        return prev.filter((it) => it.id !== id);
      });
    },
    [log]
  );

  const addRequest = useCallback(
    (r: Omit<RequestRecord, 'id'> & { id?: string }) => {
      setRequests((prev) => {
        const year = new Date().getFullYear();
        const fallbackId = r.id ?? `REQ-${year}-${String(prev.length + 1).padStart(3, '0')}`;
        const now = new Date().toISOString();
        const next: RequestRecord = { ...(r as RequestRecord), id: fallbackId, createdAt: now, updatedAt: now };
        log('request', 'create', fallbackId, next.name);
        return [next, ...prev];
      });
    },
    [log]
  );
  const updateRequest = useCallback(
    (id: string, patch: Partial<RequestRecord>) => {
      setRequests((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const merged = { ...it, ...patch, updatedAt: new Date().toISOString() };
          log('request', 'update', id, merged.name);
          return merged;
        })
      );
    },
    [log]
  );
  const removeRequest = useCallback(
    (id: string) => {
      setRequests((prev) => {
        const found = prev.find((it) => it.id === id);
        if (found) log('request', 'delete', id, found.name);
        return prev.filter((it) => it.id !== id);
      });
    },
    [log]
  );

  const addTask = useCallback(
    (t: Omit<TaskRecord, 'id'> & { id?: string }) => {
      setTasks((prev) => {
        const prefix = t.kind === 'routine' ? 'TSK-R' : 'TSK-T';
        const id = t.id ?? nextId(prefix, prev);
        const now = new Date().toISOString();
        const next: TaskRecord = { ...(t as TaskRecord), id, createdAt: now, updatedAt: now };
        log('task', 'create', id, next.title);
        return [next, ...prev];
      });
    },
    [log]
  );
  const updateTask = useCallback(
    (id: string, patch: Partial<TaskRecord>) => {
      setTasks((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          const merged = { ...it, ...patch, updatedAt: new Date().toISOString() };
          log('task', 'update', id, merged.title);
          return merged;
        })
      );
    },
    [log]
  );
  const removeTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const found = prev.find((it) => it.id === id);
        if (found) log('task', 'delete', id, found.title);
        return prev.filter((it) => it.id !== id);
      });
    },
    [log]
  );

  const addComment = useCallback((c: Omit<Comment, 'id' | 'at'>) => {
    setComments((prev) => [
      { ...c, id: `CMT-MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`, at: new Date().toISOString() },
      ...prev,
    ]);
  }, []);
  const removeComment = useCallback((id: string) => {
    setComments((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addDependency = useCallback(
    (taskId: string, dependsOnId: string) => {
      if (taskId === dependsOnId) return { ok: false, reason: 'self' as const };
      // Cycle check via DFS over the existing dependency graph.
      const adjacency = new Map<string, string[]>();
      for (const d of dependencies) {
        if (!adjacency.has(d.taskId)) adjacency.set(d.taskId, []);
        adjacency.get(d.taskId)!.push(d.dependsOnId);
      }
      function leadsTo(start: string, target: string, seen = new Set<string>()): boolean {
        if (start === target) return true;
        if (seen.has(start)) return false;
        seen.add(start);
        for (const next of adjacency.get(start) ?? []) {
          if (leadsTo(next, target, seen)) return true;
        }
        return false;
      }
      if (leadsTo(dependsOnId, taskId)) return { ok: false, reason: 'cycle' as const };
      const exists = dependencies.some((d) => d.taskId === taskId && d.dependsOnId === dependsOnId);
      if (exists) return { ok: false, reason: 'duplicate' as const };
      const id = `DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      setDependencies((prev) => [{ id, taskId, dependsOnId }, ...prev]);
      return { ok: true as const };
    },
    [dependencies]
  );

  const removeDependency = useCallback((id: string) => {
    setDependencies((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setCommittees(seedCommittees);
    setRequests(seedRequests);
    setTasks(seedTasks);
    setActivity([]);
    setComments([]);
    setDependencies([]);
  }, []);

  const value = useMemo(
    () => ({
      committees,
      requests,
      tasks,
      activity,
      comments,
      dependencies,
      addCommittee,
      updateCommittee,
      removeCommittee,
      addRequest,
      updateRequest,
      removeRequest,
      addTask,
      updateTask,
      removeTask,
      addComment,
      removeComment,
      addDependency,
      removeDependency,
      resetAll,
    }),
    [
      committees,
      requests,
      tasks,
      activity,
      comments,
      dependencies,
      addCommittee,
      updateCommittee,
      removeCommittee,
      addRequest,
      updateRequest,
      removeRequest,
      addTask,
      updateTask,
      removeTask,
      addComment,
      removeComment,
      addDependency,
      removeDependency,
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
