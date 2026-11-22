export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorDetail {
  path?: string;
  message: string;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorPayload;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  uptime: number;
  timestamp: string;
  database: {
    connected: boolean;
    state: string;
  };
}

export type UserRole = 'admin' | 'viewer';

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface Team {
  _id: string;
  name: string;
  shortName: string;
  country: string;
  logo?: string;
  founded?: number;
  stadium?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamPayload {
  name: string;
  shortName: string;
  country: string;
  logo?: string;
  founded?: number;
  stadium?: string;
  description?: string;
}

export type UpdateTeamPayload = Partial<CreateTeamPayload>;

export const LEAGUE_TYPES = ['league', 'cup', 'tournament', 'friendly'] as const;
export type LeagueType = (typeof LEAGUE_TYPES)[number];

export interface League {
  _id: string;
  name: string;
  country: string;
  logo?: string;
  type: LeagueType;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  _id: string;
  league: string;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeagueWithSeasons extends League {
  seasons: Season[];
}

export interface CreateLeaguePayload {
  name: string;
  country: string;
  logo?: string;
  type: LeagueType;
}

export type UpdateLeaguePayload = Partial<CreateLeaguePayload>;

export interface CreateSeasonPayload {
  name: string;
  startDate: string;
  endDate: string;
  current?: boolean;
}

export type UpdateSeasonPayload = Partial<CreateSeasonPayload>;

export const MATCH_STATUSES = [
  'scheduled',
  'live',
  'halftime',
  'finished',
  'postponed',
  'cancelled',
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export interface PopulatedTeam {
  _id: string;
  name: string;
  shortName: string;
  country?: string;
  logo?: string;
}

export interface PopulatedLeague {
  _id: string;
  name: string;
  country: string;
  logo?: string;
  type: LeagueType;
}

export interface PopulatedSeason {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

export const SIMULATION_STATUSES = [
  'idle',
  'running',
  'paused',
  'completed',
] as const;
export type SimulationStatus = (typeof SIMULATION_STATUSES)[number];

export interface SimulationConfig {
  matchDuration: number;
  eventFrequency: number;
  goalProbability: number;
  cardProbability: number;
  substitutionProbability: number;
}

export interface SimulationStepPreview {
  stepId: string;
  kind: 'kickoff' | 'event' | 'halftime' | 'second_half' | 'fulltime';
  minute: number;
  addedTime: number;
  eventType?: MatchEventType;
  description?: string;
}

export interface Match {
  _id: string;
  league: PopulatedLeague;
  season: PopulatedSeason;
  homeTeam: PopulatedTeam;
  awayTeam: PopulatedTeam;
  kickoff: string;
  venue?: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  minute: number;
  round?: string;
  isSimulation?: boolean;
  simulationStatus?: SimulationStatus;
  simulationSpeed?: number;
  simulationSeed?: string;
  simulationStartedAt?: string;
  simulationElapsedSeconds?: number;
  simulationConfig?: SimulationConfig;
  createdAt: string;
  updatedAt: string;
}

export interface SimulationState {
  matchId: string;
  isSimulation: boolean;
  simulationStatus: SimulationStatus;
  simulationSpeed: number;
  simulationSeed: string | null;
  simulationStartedAt: string | null;
  simulationElapsedSeconds: number;
  simulationConfig: SimulationConfig;
  progress: {
    executedSteps: number;
    totalSteps: number;
    nextStep: SimulationStepPreview | null;
  };
  match: Match;
}

export interface CreateMatchPayload {
  league: string;
  season: string;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  venue?: string;
  status?: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  round?: string;
  isSimulation?: boolean;
  simulationSpeed?: number;
  simulationSeed?: string;
  simulationConfig?: SimulationConfig;
}

export type UpdateMatchPayload = Partial<CreateMatchPayload>;

export const MATCH_EVENT_TYPES = [
  'goal',
  'own_goal',
  'penalty',
  'yellow_card',
  'red_card',
  'substitution',
  'injury',
  'var',
  'other',
] as const;
export type MatchEventType = (typeof MATCH_EVENT_TYPES)[number];

export interface MatchEvent {
  _id: string;
  match: string;
  team: PopulatedTeam;
  type: MatchEventType;
  minute: number;
  addedTime: number;
  player?: string;
  playerIn?: string;
  playerOut?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMatchEventPayload {
  team: string;
  type: MatchEventType;
  minute: number;
  addedTime?: number;
  player?: string;
  playerIn?: string;
  playerOut?: string;
  description?: string;
}

export type UpdateMatchEventPayload = Partial<CreateMatchEventPayload>;

export interface MatchEventMutationResponse {
  success: true;
  data: MatchEvent;
  score: {
    homeScore: number;
    awayScore: number;
  };
}

export interface StandingRow {
  position: number;
  team: {
    _id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface LeagueStandingsResponse {
  league: {
    _id: string;
    name: string;
    country: string;
    type: LeagueType;
  };
  season: {
    _id: string;
    name: string;
    startDate: string;
    endDate: string;
    current: boolean;
  } | null;
  standings: StandingRow[];
}

export interface DashboardOverview {
  counts: {
    teams: number;
    leagues: number;
    matches: number;
    liveMatches: number;
    upcomingMatches: number;
    finishedMatches: number;
  };
  liveMatches: Match[];
  upcomingMatches: Match[];
  recentResults: Match[];
}
