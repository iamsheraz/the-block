type ConditionBadgeProps = {
  grade: number;
};

export function ConditionBadge({ grade }: ConditionBadgeProps) {
  return (
    <div
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-sm font-bold text-slate-900 ring-1 ring-slate-200 tabular-nums backdrop-blur"
      aria-label={`Condition grade ${grade.toFixed(1)} out of 5`}
    >
      {grade.toFixed(1)}
    </div>
  );
}
