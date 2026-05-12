type ConditionHeroProps = {
  grade: number;
};

export function interpretGrade(grade: number): string {
  if (grade >= 4.5) return 'Excellent';
  if (grade >= 3.5) return 'Above Average';
  if (grade >= 2.5) return 'Average';
  if (grade >= 1.5) return 'Below Average';
  return 'Poor';
}

export function ConditionHero({ grade }: ConditionHeroProps) {
  const interpretation = interpretGrade(grade);
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Condition grade
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-900 text-2xl font-bold text-white tabular-nums"
          aria-label={`Condition grade ${grade.toFixed(1)} out of 5`}
        >
          {grade.toFixed(1)}
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{interpretation}</p>
          <p className="text-xs text-slate-500">Out of 5.0 · industry scale</p>
        </div>
      </div>
    </div>
  );
}
