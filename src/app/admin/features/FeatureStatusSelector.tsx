'use client';

import { useTransition } from 'react';
import { updateFeatureStatus } from './actions';
import type { FeatureStatus } from '@/models/FeatureFlag';
import { EyeOff, FlaskConical, CheckCircle2, Loader2 } from 'lucide-react';

const STATUSES: { value: FeatureStatus; label: string; icon: React.ElementType; activeClass: string; inactiveClass: string }[] = [
  {
    value: 'disabled',
    label: 'Disabled',
    icon: EyeOff,
    activeClass: 'bg-slate-700 text-white border-slate-700',
    inactiveClass: 'bg-white text-slate-500 border-slate-200 hover:border-slate-400',
  },
  {
    value: 'testing',
    label: 'Testing',
    icon: FlaskConical,
    activeClass: 'bg-amber-500 text-white border-amber-500',
    inactiveClass: 'bg-white text-slate-500 border-slate-200 hover:border-amber-400',
  },
  {
    value: 'enabled',
    label: 'Enabled',
    icon: CheckCircle2,
    activeClass: 'bg-brand-primary text-white border-emerald-600',
    inactiveClass: 'bg-white text-slate-500 border-slate-200 hover:border-emerald-400',
  },
];

interface Props {
  flagId: string;
  currentStatus: FeatureStatus;
  canEdit: boolean;
}

export default function FeatureStatusSelector({ flagId, currentStatus, canEdit }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (status: FeatureStatus) => {
    if (!canEdit || status === currentStatus || isPending) return;
    startTransition(async () => {
      const res = await updateFeatureStatus(flagId, status);
      if (res.error) alert(res.error);
    });
  };

  return (
    <div className={`flex items-center rounded-lg border border-slate-200 overflow-hidden ${isPending ? 'opacity-60 pointer-events-none' : ''}`}>
      {isPending && (
        <div className="px-2 flex items-center">
          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
        </div>
      )}
      {STATUSES.map((s, idx) => {
        const Icon = s.icon;
        const isActive = currentStatus === s.value;
        return (
          <button
            key={s.value}
            onClick={() => handleChange(s.value)}
            disabled={!canEdit || isPending}
            title={canEdit ? `Set to ${s.label}` : 'Only owner or super_admin can change this'}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold border transition-all duration-150
              ${idx === 0 ? 'rounded-l-lg' : ''}
              ${idx === STATUSES.length - 1 ? 'rounded-r-lg' : ''}
              ${isActive ? s.activeClass : s.inactiveClass}
              ${!canEdit ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
            `}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0" />
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
