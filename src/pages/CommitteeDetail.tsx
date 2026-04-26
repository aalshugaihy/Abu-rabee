import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import StatusBadge from '../components/StatusBadge';
import ActivityFeed from '../components/ActivityFeed';
import {
  committeeName,
  statusToTone,
  tCommitteeScope,
  tCommitteeType,
  tDept,
  tStatus,
  tTaskStatus,
} from '../lib/format';
import { formatDateTime } from '../lib/datetime';
import { Committee } from '../data/types';

export default function CommitteeDetail() {
  const { id } = useParams();
  const { t, locale, dir } = useLanguage();
  const { committees, tasks, activity, removeCommittee, updateCommittee } = useData();
  const navigate = useNavigate();
  const toast = useToast();
  const Arrow = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const committee = committees.find((c) => c.id === id);
  const [editing, setEditing] = useState(false);

  if (!committee) {
    return (
      <div className="card p-10 text-center">
        <h2 className="text-lg font-bold text-slate-900">{t('common.empty')}</h2>
        <Link to="/app/committees" className="btn-primary mt-4">{t('detail.back')}</Link>
      </div>
    );
  }

  const relatedTasks = tasks.filter((tk) => tk.committeeId === committee.id);
  const logs = activity.filter((a) => a.entity === 'committee' && a.entityId === committee.id);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <Link to="/app/committees" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-semibold">
          <Arrow size={14} /> {t('detail.back')}
        </Link>
      </div>

      <div className="card p-6 mb-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 to-brand-700" />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[11px] text-slate-500">{committee.id}</span>
              <StatusBadge tone={statusToTone(committee.status)}>{tStatus(t, committee.status)}</StatusBadge>
              <span className="badge bg-slate-100 text-slate-700">{tCommitteeScope(t, committee.scope)}</span>
              {committee.type && <span className="badge bg-slate-100 text-slate-700">{tCommitteeType(t, committee.type)}</span>}
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{committeeName(committee, locale)}</h1>
            {committee.organizer && <p className="mt-1 text-sm text-slate-600">{committee.organizer}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEditing(true)}>
              <Pencil size={14} /> {t('action.edit')}
            </button>
            <button
              type="button"
              className="btn-ghost text-rose-600 hover:bg-rose-50"
              onClick={() => {
                if (confirm(t('action.confirmDelete'))) {
                  removeCommittee(committee.id);
                  toast.success(`${committee.id} ${t('action.delete')} ✓`);
                  navigate('/app/committees');
                }
              }}
            >
              <Trash2 size={14} /> {t('action.delete')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title={t('detail.overview')}>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <Field label={t('committees.field.department')} value={tDept(t, committee.department)} />
              <Field label={t('committees.field.representative')} value={committee.representative} />
              <Field label={t('committees.field.head')} value={committee.head} />
              <Field label={t('committees.field.organizer')} value={committee.organizer} />
              <Field label={t('committees.field.startDate')} value={committee.startDate} />
              <Field label={t('committees.field.endDate')} value={committee.endDate} />
              <Field label={t('committees.field.members')} value={committee.members} />
              <Field label={t('committees.field.confidentiality')} value={committee.confidentiality} />
              <Field label={t('detail.createdAt')} value={formatDateTime(committee.createdAt)} />
              <Field label={t('detail.updatedAt')} value={formatDateTime(committee.updatedAt)} />
            </dl>
            {committee.notes && (
              <p className="mt-4 text-sm text-slate-700 leading-relaxed border-t border-slate-100 pt-4">{committee.notes}</p>
            )}
          </SectionCard>

          <SectionCard title={`${t('detail.relatedTasks')} (${relatedTasks.length})`}>
            {relatedTasks.length === 0 ? (
              <p className="text-sm text-slate-500">{t('common.empty')}</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {relatedTasks.map((tk) => (
                  <li key={tk.id}>
                    <Link
                      to={`/app/tasks/item/${tk.id}`}
                      className="flex items-start gap-3 py-3 hover:bg-slate-50 -mx-3 px-3 rounded-xl transition"
                    >
                      <span className="font-mono text-[10px] text-slate-400 mt-1 shrink-0">{tk.id}</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 truncate">{tk.title}</div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <StatusBadge tone={statusToTone(tk.status)}>{tTaskStatus(t, tk.status)}</StatusBadge>
                          {tk.dueDate && <span className="text-[11px] text-slate-500">{tk.dueDate}</span>}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>

        <div className="space-y-6">
          <SectionCard title={t('detail.activity')}>
            <ActivityFeed logs={logs} />
          </SectionCard>
        </div>
      </div>

      {editing && (
        <QuickEdit
          committee={committee}
          onClose={() => setEditing(false)}
          onSave={(patch) => {
            updateCommittee(committee.id, patch);
            toast.success(`${committee.id} ${t('action.save')} ✓`);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-slate-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-slate-800 font-medium">{value === undefined || value === '' ? '—' : value}</dd>
    </div>
  );
}

function QuickEdit({
  committee,
  onClose,
  onSave,
}: {
  committee: Committee;
  onClose: () => void;
  onSave: (patch: Partial<Committee>) => void;
}) {
  const { t } = useLanguage();
  const [notes, setNotes] = useState(committee.notes ?? '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="card max-w-lg w-full p-6 animate-slide-up">
        <h3 className="text-base font-bold text-slate-900 mb-4">{t('action.edit')}</h3>
        <label className="label">{t('committees.field.notes')}</label>
        <textarea className="textarea" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>{t('action.cancel')}</button>
          <button className="btn-primary" onClick={() => onSave({ notes: notes || undefined })}>
            {t('action.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
