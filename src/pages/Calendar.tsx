import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import { isSameDay, monthGrid, ymd } from '../lib/datetime';
import { statusToTone, tTaskStatus } from '../lib/format';
import { TaskRecord } from '../data/types';
import type { TranslationKey } from '../i18n/translations';

export default function CalendarPage() {
  const { t, dir, locale } = useLanguage();
  const { tasks } = useData();
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const Prev = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const Next = dir === 'rtl' ? ChevronLeft : ChevronRight;

  const days = useMemo(() => monthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskRecord[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const key = t.dueDate.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks]);

  function go(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  }
  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
  }

  const monthLabel = `${t(`months.${cursor.getMonth()}` as TranslationKey)} ${cursor.getFullYear()}`;

  return (
    <div>
      <PageHeader
        title={t('calendar.title')}
        subtitle={t('calendar.subtitle')}
        actions={
          <div className="flex items-center gap-2">
            <button type="button" className="btn-ghost" onClick={() => go(-1)} aria-label={t('calendar.prev')}>
              <Prev size={16} />
            </button>
            <button type="button" className="btn-secondary" onClick={goToday}>
              {t('calendar.today')}
            </button>
            <button type="button" className="btn-ghost" onClick={() => go(1)} aria-label={t('calendar.next')}>
              <Next size={16} />
            </button>
          </div>
        }
      />

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="text-lg font-extrabold text-slate-900">{monthLabel}</div>
          <div className="text-xs text-slate-500">
            {locale === 'ar' ? 'التواريخ بصيغة YYYY-MM-DD' : 'Dates: YYYY-MM-DD'}
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="px-2 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">
              {t(`wd.${i}` as TranslationKey)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {days.map((d) => {
            const dueTasks = tasksByDay.get(ymd(d)) ?? [];
            const isCurrentMonth = d.getMonth() === cursor.getMonth();
            const isToday = isSameDay(d, today);
            return (
              <div
                key={d.toISOString()}
                className={`min-h-[110px] border-t border-s border-slate-100 p-2 ${
                  isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                }`}
              >
                <div
                  className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full text-[11px] font-bold mb-1 ${
                    isToday ? 'bg-brand-600 text-white px-2' : 'text-slate-700'
                  }`}
                >
                  {d.getDate()}
                </div>
                <ul className="space-y-1">
                  {dueTasks.slice(0, 3).map((task) => (
                    <li key={task.id}>
                      <Link
                        to={`/app/tasks/item/${task.id}`}
                        className={`block truncate text-[11px] font-semibold rounded-md px-1.5 py-0.5 ${
                          task.kind === 'routine' ? 'bg-amber-50 text-amber-800' : 'bg-brand-50 text-brand-800'
                        } hover:opacity-80`}
                        title={task.title}
                      >
                        {task.title}
                      </Link>
                    </li>
                  ))}
                  {dueTasks.length > 3 && (
                    <li className="text-[10px] text-slate-500 px-1">
                      +{dueTasks.length - 3}
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's tasks summary */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h3 className="text-base font-bold text-slate-900 mb-3">{t('calendar.today')}</h3>
          {(tasksByDay.get(ymd(today)) ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">{t('calendar.noTasks')}</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {(tasksByDay.get(ymd(today)) ?? []).map((task) => (
                <li key={task.id}>
                  <Link to={`/app/tasks/item/${task.id}`} className="flex items-center justify-between py-2.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg">
                    <span className="font-semibold text-slate-800 truncate">{task.title}</span>
                    <StatusBadge tone={statusToTone(task.status)}>{tTaskStatus(t, task.status)}</StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
