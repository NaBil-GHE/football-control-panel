import { cn } from '@/lib/utils';
import type { LeagueType, MatchEventType, MatchStatus } from '@/types/api';

type BadgeTone = 'green' | 'amber' | 'red' | 'slate' | 'blue';

const TONE_STYLES: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  amber: 'bg-amber-50 text-amber-800 border-amber-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-sky-50 text-sky-800 border-sky-200',
};

const MATCH_STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; tone: BadgeTone; pulse?: boolean }
> = {
  scheduled: { label: 'Scheduled', tone: 'blue' },
  live: { label: 'Live', tone: 'green', pulse: true },
  halftime: { label: 'Halftime', tone: 'amber' },
  finished: { label: 'Finished', tone: 'slate' },
  postponed: { label: 'Postponed', tone: 'amber' },
  cancelled: { label: 'Cancelled', tone: 'red' },
};

const LEAGUE_TYPE_LABELS: Record<LeagueType, string> = {
  league: 'League',
  cup: 'Cup',
  tournament: 'Tournament',
  friendly: 'Friendly',
};

const EVENT_TYPE_CONFIG: Record<
  MatchEventType,
  { label: string; tone: BadgeTone }
> = {
  goal: { label: 'Goal', tone: 'green' },
  penalty: { label: 'Penalty', tone: 'green' },
  own_goal: { label: 'Own goal', tone: 'red' },
  yellow_card: { label: 'Yellow card', tone: 'amber' },
  red_card: { label: 'Red card', tone: 'red' },
  substitution: { label: 'Substitution', tone: 'blue' },
  injury: { label: 'Injury', tone: 'amber' },
  var: { label: 'VAR', tone: 'slate' },
  other: { label: 'Other', tone: 'slate' },
};

interface StatusBadgeProps {
  label?: string;
  tone?: BadgeTone;
  pulse?: boolean;
  matchStatus?: MatchStatus;
  leagueType?: LeagueType;
  eventType?: MatchEventType;
  className?: string;
}

export function StatusBadge({
  label,
  tone = 'slate',
  pulse = false,
  matchStatus,
  leagueType,
  eventType,
  className,
}: StatusBadgeProps) {
  let resolvedLabel = label || '';
  let resolvedTone: BadgeTone = tone;
  let resolvedPulse = pulse;

  if (matchStatus) {
    const cfg = MATCH_STATUS_CONFIG[matchStatus];
    resolvedLabel = cfg.label;
    resolvedTone = cfg.tone;
    resolvedPulse = Boolean(cfg.pulse);
  } else if (leagueType) {
    resolvedLabel = LEAGUE_TYPE_LABELS[leagueType];
    resolvedTone = leagueType === 'league' ? 'green' : 'slate';
  } else if (eventType) {
    const cfg = EVENT_TYPE_CONFIG[eventType];
    resolvedLabel = cfg.label;
    resolvedTone = cfg.tone;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        TONE_STYLES[resolvedTone],
        className,
      )}
    >
      {resolvedPulse && (
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
      )}
      {resolvedLabel}
    </span>
  );
}
