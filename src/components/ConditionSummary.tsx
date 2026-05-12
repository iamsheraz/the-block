import type { Vehicle } from '../types';

type ConditionSummaryProps = {
  vehicle: Pick<Vehicle, 'ai_summary' | 'condition_report' | 'damage_notes'>;
};

export function ConditionSummary({ vehicle }: ConditionSummaryProps) {
  const aiSummary = vehicle.ai_summary?.trim();
  const hasAi = Boolean(aiSummary);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-white">
          {hasAi ? <ChatBubbleIcon /> : <ClipboardIcon />}
        </span>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
          {hasAi ? '💬 AI summary' : '📋 Condition snapshot'}
        </p>
      </div>
      <p className="mt-2.5 text-[14px] leading-relaxed text-slate-700">
        {hasAi ? aiSummary : buildFallback(vehicle)}
      </p>
    </div>
  );
}

function buildFallback(vehicle: Pick<Vehicle, 'condition_report' | 'damage_notes'>): string {
  const report = vehicle.condition_report?.trim() || 'Condition details not recorded.';
  const count = vehicle.damage_notes.length;
  const damageLine =
    count === 0
      ? 'No damage notes on file.'
      : `${count} damage ${count === 1 ? 'note' : 'notes'} flagged — review the inspection notes for specifics.`;
  return `${report} ${damageLine}`;
}

function ChatBubbleIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}
