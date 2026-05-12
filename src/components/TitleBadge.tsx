import { clsx } from 'clsx';
import type { Vehicle } from '../types';

type TitleBadgeProps = {
  status: Exclude<Vehicle['title_status'], 'clean'>;
};

const LABEL: Record<TitleBadgeProps['status'], string> = {
  salvage: 'Salvage',
  rebuilt: 'Rebuilt',
};

const TONE: Record<TitleBadgeProps['status'], string> = {
  salvage: 'bg-red-600 text-white',
  rebuilt: 'bg-amber-500 text-white',
};

export function TitleBadge({ status }: TitleBadgeProps) {
  return (
    <div
      className={clsx(
        'rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm',
        TONE[status],
      )}
    >
      {LABEL[status]}
    </div>
  );
}
