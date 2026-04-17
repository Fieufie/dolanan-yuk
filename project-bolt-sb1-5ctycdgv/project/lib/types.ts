export type UserRole = 'admin' | 'participant';

export interface Profile {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export type GameSessionStatus = 'draft' | 'waiting' | 'active' | 'completed';
export type TournamentStage = 'qualifying' | 'semifinal' | 'final';
export type QuestionType = 'multiple_choice' | 'word_guess' | 'puzzle' | 'memory_game' | 'math_game' | 'song_guess' | 'image_guess';
export type MediaType = 'audio' | 'video' | 'image';
export type ImageEffect = 'blur' | 'crop' | 'none';

export interface GameSession {
  id: string;
  title: string;
  description?: string;
  admin_id: string;
  tournament_id?: string;
  tournament_stage?: TournamentStage;
  status: GameSessionStatus;
  join_code?: string;
  time_per_question: number;
  show_leaderboard: boolean;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Question {
  id: string;
  session_id: string;
  type: QuestionType;
  question_text?: string;
  options?: string[];
  correct_answer?: string;
  media_url?: string;
  media_type?: MediaType;
  image_url?: string;
  image_effect?: ImageEffect;
  difficulty: number;
  puzzle_pieces: number;
  memory_cards?: MemoryCard[];
  math_expression?: string;
  points: number;
  time_limit: number;
  display_order: number;
  category?: string;
  hint?: string;
  created_at: string;
}

export interface MemoryCard {
  id: string;
  value: string;
  image_url?: string;
}

export interface ParticipantSession {
  id: string;
  session_id: string;
  user_id: string;
  total_score: number;
  rank?: number;
  completed: boolean;
  joined_at: string;
  completed_at?: string;
  profiles?: Profile;
}

export interface Answer {
  id: string;
  session_id: string;
  question_id: string;
  user_id: string;
  answer_value?: string;
  is_correct: boolean;
  time_taken: number;
  score: number;
  submitted_at: string;
}

export interface Tournament {
  id: string;
  title: string;
  description?: string;
  admin_id: string;
  status: 'draft' | 'active' | 'completed';
  current_stage: TournamentStage;
  created_at: string;
  updated_at: string;
}

export interface TournamentParticipant {
  id: string;
  tournament_id: string;
  user_id: string;
  current_stage: TournamentStage | 'eliminated';
  qualifying_score: number;
  semifinal_score: number;
  final_score: number;
  total_score: number;
  final_rank?: number;
  registered_at: string;
  profiles?: Profile;
}

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url?: string;
  total_score: number;
  rank: number;
  completed: boolean;
}
