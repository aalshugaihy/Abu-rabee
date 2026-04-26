import { Inbox } from 'lucide-react';
import { ReactNode } from 'react';

export default function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
        <Inbox size={28} />
      </div>
      <p className="text-slate-500 font-medium">{title}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
