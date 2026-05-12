type ConditionHeroProps = {
  grade: number;
};

const MIN_GRADE = 0;
const MAX_GRADE = 5;

function isInRange(grade: number): boolean {
  return Number.isFinite(grade) && grade >= MIN_GRADE && grade <= MAX_GRADE;
}

export function interpretGrade(grade: number): string {
  if (!isInRange(grade)) return 'Unknown';
  if (grade >= 4.5) return 'Excellent';
  if (grade >= 3.5) return 'Above Average';
  if (grade >= 2.5) return 'Average';
  if (grade >= 1.5) return 'Below Average';
  return 'Poor';
}

export function ConditionHero({ grade }: ConditionHeroProps) {
  const interpretation = interpretGrade(grade);
  const inRange = isInRange(grade);
  const displayGrade = inRange ? grade.toFixed(1) : '—';
  const ariaLabel = inRange
    ? `Condition grade ${displayGrade} out of 5`
    : 'Condition grade unavailable';

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        Condition grade
      </p>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-900 text-2xl font-bold text-white tabular-nums"
          aria-label={ariaLabel}
        >
          {displayGrade}
        </div>
        <div>
          <p className="text-base font-semibold text-slate-900">{interpretation}</p>
          <p className="text-xs text-slate-500">Out of 5.0 · industry scale</p>
        </div>
      </div>
    </div>
  );
}
