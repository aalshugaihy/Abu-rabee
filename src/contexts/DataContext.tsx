import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { ActivityAction, ActivityEntity, ActivityLog, Comment, Committee, RequestRecord, TaskDependency, TaskRecord } from '../data/types';
import { seedCommittees, seedRequests, seedTasks } from '../data/seed';
import { api, apiAvailable } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from './AuthContext';

type DataContextValue = {
  committees: Committee[];
  requests: RequestRecord[];
  tasks: TaskRecord[];
  activity: ActivityLog[];
  comments: Comment[];
  dependencies: TaskDependency[];
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
  addDependency: (taskId: string, dependsOnId: string) => { ok: true } | { ok: false; reason: 'cycle' | 'self' | 'duplicate' };
  removeDependency: (id: string) => void;
  remoteMode: boolean;
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
  const { user } = useAuth();
  // Remote mode = API is configured AND user is signed in. Otherwise we stay
  // on the existing localStorage-backed flow that ships with the app.
  const remoteMode = apiAvailable && !!user;

  const [committees, setCommittees] = useState<Committee[]>(() => load(STORAGE_KEYS.committees, seedCommittees));
  const [requests, setRequests] = useState<RequestRecord[]>(() => load(STORAGE_KEYS.requests, seedRequests));
  const [tasks, setTasks] = useState<TaskRecord[]>(() => load(STORAGE_KEYS.tasks, seedTasks));
  const [activity, setActivity] = useState<ActivityLog[]>(() => load(STORAGE_KEYS.activity, [] as ActivityLog[]));
  const [comments, setComments] = useState<Comment[]>(() => load(STORAGE_KEYS.comments, [] as Comment[]));
  const [dependencies, setDependencies] = useState<TaskDependency[]>(() =>
    load(STORAGE_KEYS.dependencies, [] as TaskDependency[])
  );

  // Persist locally only when we are NOT in remote mode — in remote mode the
  // server is the source of truth, and local cache would just become stale.
  useEffect(() => {
    if (!remoteMode) save(STORAGE_KEYS.committees, committees);
  }, [committees, remoteMode]);
  useEffect(() => {
    if (!remoteMode) save(STORAGE_KEYS.requests, requests);
  }, [requests, remoteMode]);
  useEffect(() => {
    if (!remoteMode) save(STORAGE_KEYS.tasks, tasks);
  }, [tasks, remoteMode]);
  useEffect(() => {
    if (!remoteMode) save(STORAGE_KEYS.activity, activity);
  }, [activity, remoteMode]);
  useEffect(() => {
    if (!remoteMode) save(STORAGE_KEYS.comments, comments);
  }, [comments, remoteMode]);
  useEffect(() => {
    if (!remoteMode) save(STORAGE_KEYS.dependencies, dependencies);
  }, [dependencies, remoteMode]);

  // ---- Remote refetchers ----------------------------------------------------
  const refetchAll = useCallback(async () => {
    if (!remoteMode) return;
    try {
      const [c, r, t, act, com] = await Promise.all([
        api.get<Committee[]>('/api/committees'),
        api.get<RequestRecord[]>('/api/requests'),
        api.get<TaskRecord[]>('/api/tasks'),
        api.get<ActivityLog[]>('/api/activity?limit=200'),
        api.get<Comment[]>('/api/comments'),
      ]);
      setCommittees(c);
      setRequests(r);
      setTasks(t);
      setActivity(act);
      setComments(com);
    } catch {
      // Likely 401 — stay on the cached state.
    }
  }, [remoteMode]);

  const refetchEntity = useCallback(
    async (entity: 'committee' | 'request' | 'task' | 'comment' | 'activity') => {
      if (!remoteMode) return;
      try {
        if (entity === 'committee') setCommittees(await api.get<Committee[]>('/api/committees'));
        else if (entity === 'request') setRequests(await api.get<RequestRecord[]>('/api/requests'));
        else if (entity === 'task') setTasks(await api.get<TaskRecord[]>('/api/tasks'));
        else if (entity === 'comment') setComments(await api.get<Comment[]>('/api/comments'));
        else if (entity === 'activity') setActivity(await api.get<ActivityLog[]>('/api/activity?limit=200'));
      } catch {
        /* ignore */
      }
    },
    [remoteMode]
  );

  // Initial load when remote mode flips on.
  useEffect(() => {
    if (remoteMode) refetchAll();
  }, [remoteMode, refetchAll]);

  // Realtime: refetch on broadcast.
  const refetchRef = useRef(refetchEntity);
  refetchRef.current = refetchEntity;
  useEffect(() => {
    if (!remoteMode) return;
    const socket = getSocket();
    return socket.onChange(({ entity }) => {
      const e = entity as 'committee' | 'request' | 'task' | 'comment' | 'activity';
      refetchRef.current(e);
      refetchRef.current('activity');
    });
  }, [remoteMode]);

  // ---- Local activity logging (only when offline) ---------------------------
  const log = useCallback(
    (entity: ActivityEntity, action: ActivityAction, entityId: string, label?: string) => {
      if (remoteMode) return;
      setActivity((prev) => {
        const entry: ActivityLog = {
          id: newActivityId(),
          at: new Date().toISOString(),
          entity,
          action,
          entityId,
          label,
        };
        return [entry, ...prev].slice(0, ACTIVITY_LIMIT);
      });
    },
    [remoteMode]
  );

  // ---- Mutations ------------------------------------------------------------
  // Pattern: optimistic local update first, then async API call. On API error
  // we revert the local change. Socket events keep us in sync afterwards.

  const addCommittee = useCallback(
    (c: Omit<Committee, 'id'> & { id?: string }) => {
      const id = c.id ?? nextId('CMT', committees);
      const now = new Date().toISOString();
      const next: Committee = { ...(c as Committee), id, createdAt: now, updatedAt: now };
      setCommittees((prev) => [next, ...prev]);
      log('committee', 'create', id, next.name);
      if (remoteMode) {
        api.post<Committee>('/api/committees', next).catch(() => {
          setCommittees((prev) => prev.filter((x) => x.id !== id));
        });
      }
    },
    [committees, remoteMode, log]
  );

  const updateCommittee = useCallback(
    (id: string, patch: Partial<Committee>) => {
      let prevSnapshot: Committee | undefined;
      setCommittees((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          prevSnapshot = it;
          return { ...it, ...patch, updatedAt: new Date().toISOString() };
        })
      );
      log('committee', 'update', id, patch.name);
      if (remoteMode) {
        api.patch<Committee>(`/api/committees/${id}`, patch).catch(() => {
          if (prevSnapshot) {
            const snap = prevSnapshot;
            setCommittees((prev) => prev.map((x) => (x.id === id ? snap : x)));
          }
        });
      }
    },
    [remoteMode, log]
  );

  const removeCommittee = useCallback(
    (id: string) => {
      let snap: Committee | undefined;
      setCommittees((prev) => {
        snap = prev.find((x) => x.id === id);
        return prev.filter((x) => x.id !== id);
      });
      if (snap) log('committee', 'delete', id, snap.name);
      if (remoteMode) {
        api.del(`/api/committees/${id}`).catch(() => {
          if (snap) {
            const restore = snap;
            setCommittees((prev) => [restore, ...prev]);
          }
        });
      }
    },
    [remoteMode, log]
  );

  const addRequest = useCallback(
    (r: Omit<RequestRecord, 'id'> & { id?: string }) => {
      const year = new Date().getFullYear();
      const id = r.id ?? `REQ-${year}-${String(requests.length + 1).padStart(3, '0')}`;
      const now = new Date().toISOString();
      const next: RequestRecord = { ...(r as RequestRecord), id, createdAt: now, updatedAt: now };
      setRequests((prev) => [next, ...prev]);
      log('request', 'create', id, next.name);
      if (remoteMode) {
        api.post<RequestRecord>('/api/requests', next).catch(() => {
          setRequests((prev) => prev.filter((x) => x.id !== id));
        });
      }
    },
    [requests.length, remoteMode, log]
  );

  const updateRequest = useCallback(
    (id: string, patch: Partial<RequestRecord>) => {
      let snap: RequestRecord | undefined;
      setRequests((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          snap = it;
          return { ...it, ...patch, updatedAt: new Date().toISOString() };
        })
      );
      log('request', 'update', id, patch.name);
      if (remoteMode) {
        api.patch(`/api/requests/${id}`, patch).catch(() => {
          if (snap) {
            const restore = snap;
            setRequests((prev) => prev.map((x) => (x.id === id ? restore : x)));
          }
        });
      }
    },
    [remoteMode, log]
  );

  const removeRequest = useCallback(
    (id: string) => {
      let snap: RequestRecord | undefined;
      setRequests((prev) => {
        snap = prev.find((x) => x.id === id);
        return prev.filter((x) => x.id !== id);
      });
      if (snap) log('request', 'delete', id, snap.name);
      if (remoteMode) {
        api.del(`/api/requests/${id}`).catch(() => {
          if (snap) {
            const restore = snap;
            setRequests((prev) => [restore, ...prev]);
          }
        });
      }
    },
    [remoteMode, log]
  );

  const addTask = useCallback(
    (t: Omit<TaskRecord, 'id'> & { id?: string }) => {
      const prefix = t.kind === 'routine' ? 'TSK-R' : 'TSK-T';
      const id = t.id ?? nextId(prefix, tasks);
      const now = new Date().toISOString();
      const next: TaskRecord = { ...(t as TaskRecord), id, createdAt: now, updatedAt: now };
      setTasks((prev) => [next, ...prev]);
      log('task', 'create', id, next.title);
      if (remoteMode) {
        api.post<TaskRecord>('/api/tasks', next).catch(() => {
          setTasks((prev) => prev.filter((x) => x.id !== id));
        });
      }
    },
    [tasks, remoteMode, log]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<TaskRecord>) => {
      let snap: TaskRecord | undefined;
      setTasks((prev) =>
        prev.map((it) => {
          if (it.id !== id) return it;
          snap = it;
          return { ...it, ...patch, updatedAt: new Date().toISOString() };
        })
      );
      log('task', 'update', id, patch.title);
      if (remoteMode) {
        api.patch(`/api/tasks/${id}`, patch).catch(() => {
          if (snap) {
            const restore = snap;
            setTasks((prev) => prev.map((x) => (x.id === id ? restore : x)));
          }
        });
      }
    },
    [remoteMode, log]
  );

  const removeTask = useCallback(
    (id: string) => {
      let snap: TaskRecord | undefined;
      setTasks((prev) => {
        snap = prev.find((x) => x.id === id);
        return prev.filter((x) => x.id !== id);
      });
      if (snap) log('task', 'delete', id, snap.title);
      if (remoteMode) {
        api.del(`/api/tasks/${id}`).catch(() => {
          if (snap) {
            const restore = snap;
            setTasks((prev) => [restore, ...prev]);
          }
        });
      }
    },
    [remoteMode, log]
  );

  const addComment = useCallback(
    (c: Omit<Comment, 'id' | 'at'>) => {
      const tempId = `CMT-MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const next: Comment = { ...c, id: tempId, at: new Date().toISOString() };
      setComments((prev) => [next, ...prev]);
      if (remoteMode) {
        api
          .post<Comment>('/api/comments', { entity: c.entity, entityId: c.entityId, text: c.text })
          .then((created) => {
            setComments((prev) => prev.map((m) => (m.id === tempId ? created : m)));
          })
          .catch(() => {
            setComments((prev) => prev.filter((m) => m.id !== tempId));
          });
      }
    },
    [remoteMode]
  );

  const removeComment = useCallback(
    (id: string) => {
      let snap: Comment | undefined;
      setComments((prev) => {
        snap = prev.find((m) => m.id === id);
        return prev.filter((m) => m.id !== id);
      });
      if (remoteMode) {
        api.del(`/api/comments/${id}`).catch(() => {
          if (snap) {
            const restore = snap;
            setComments((prev) => [restore, ...prev]);
          }
        });
      }
    },
    [remoteMode]
  );

  const addDependency = useCallback(
    (taskId: string, dependsOnId: string) => {
      if (taskId === dependsOnId) return { ok: false, reason: 'self' as const };
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
      if (remoteMode) {
        api
          .post<{ id: string }>(`/api/tasks/${taskId}/dependencies`, { dependsOnId })
          .then((dep) => {
            setDependencies((prev) => prev.map((d) => (d.id === id ? { id: dep.id, taskId, dependsOnId } : d)));
          })
          .catch(() => {
            setDependencies((prev) => prev.filter((d) => d.id !== id));
          });
      }
      return { ok: true as const };
    },
    [dependencies, remoteMode]
  );

  const removeDependency = useCallback(
    (id: string) => {
      let snap: TaskDependency | undefined;
      setDependencies((prev) => {
        snap = prev.find((d) => d.id === id);
        return prev.filter((d) => d.id !== id);
      });
      if (remoteMode && snap) {
        api.del(`/api/tasks/${snap.taskId}/dependencies/${id}`).catch(() => {
          if (snap) {
            const restore = snap;
            setDependencies((prev) => [restore, ...prev]);
          }
        });
      }
    },
    [remoteMode]
  );

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
      remoteMode,
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
      remoteMode,
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
