
/*
  # Game Platform Schema

  ## Overview
  Complete schema for a web-based game platform with admin/participant roles,
  multiple game types, tournament mode, and real-time leaderboards.

  ## New Tables
  - `profiles` - User profiles extending auth.users with role, username, avatar
  - `game_sessions` - Game rooms created by admins
  - `questions` - All question types (multiple_choice, word_guess, puzzle, memory_game, math_game, song_guess, image_guess)
  - `participant_sessions` - Tracks which users joined which sessions
  - `answers` - User answers with scores and timing
  - `tournaments` - Tournament containers
  - `tournament_participants` - Tracks participants per tournament stage

  ## Security
  - RLS enabled on all tables
  - Admins can manage their own content
  - Participants can read sessions/questions and write their own answers
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'participant')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  current_stage text DEFAULT 'qualifying' CHECK (current_stage IN ('qualifying', 'semifinal', 'final')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active tournaments"
  ON tournaments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert tournaments"
  ON tournaments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update own tournaments"
  ON tournaments FOR UPDATE
  TO authenticated
  USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tournament_id uuid REFERENCES tournaments(id) ON DELETE SET NULL,
  tournament_stage text CHECK (tournament_stage IN ('qualifying', 'semifinal', 'final')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'waiting', 'active', 'completed')),
  join_code text UNIQUE,
  time_per_question integer DEFAULT 30,
  show_leaderboard boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read game sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert game sessions"
  ON game_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update own game sessions"
  ON game_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = admin_id)
  WITH CHECK (auth.uid() = admin_id);

-- Questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('multiple_choice', 'word_guess', 'puzzle', 'memory_game', 'math_game', 'song_guess', 'image_guess')),
  question_text text,
  options jsonb,
  correct_answer text,
  media_url text,
  media_type text CHECK (media_type IN ('audio', 'video', 'image', null)),
  image_url text,
  image_effect text CHECK (image_effect IN ('blur', 'crop', 'none', null)) DEFAULT 'none',
  difficulty integer DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  puzzle_pieces integer DEFAULT 36 CHECK (puzzle_pieces IN (36, 49, 64, 81, 100)),
  memory_cards jsonb,
  math_expression text,
  points integer DEFAULT 100,
  time_limit integer DEFAULT 30,
  display_order integer DEFAULT 0,
  category text,
  hint text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions for active sessions"
  ON questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = questions.session_id
    )
  );

CREATE POLICY "Admins can insert questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = questions.session_id
      AND game_sessions.admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = questions.session_id
      AND game_sessions.admin_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = questions.session_id
      AND game_sessions.admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete questions"
  ON questions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM game_sessions
      WHERE game_sessions.id = questions.session_id
      AND game_sessions.admin_id = auth.uid()
    )
  );

-- Participant sessions table
CREATE TABLE IF NOT EXISTS participant_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_score integer DEFAULT 0,
  rank integer,
  completed boolean DEFAULT false,
  joined_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(session_id, user_id)
);

ALTER TABLE participant_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read participant sessions"
  ON participant_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own participant session"
  ON participant_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participant session"
  ON participant_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer_value text,
  is_correct boolean DEFAULT false,
  time_taken integer DEFAULT 0,
  score integer DEFAULT 0,
  submitted_at timestamptz DEFAULT now(),
  UNIQUE(question_id, user_id)
);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read answers in their sessions"
  ON answers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON answers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Tournament participants
CREATE TABLE IF NOT EXISTS tournament_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_stage text DEFAULT 'qualifying' CHECK (current_stage IN ('qualifying', 'semifinal', 'final', 'eliminated')),
  qualifying_score integer DEFAULT 0,
  semifinal_score integer DEFAULT 0,
  final_score integer DEFAULT 0,
  total_score integer DEFAULT 0,
  final_rank integer,
  registered_at timestamptz DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read tournament participants"
  ON tournament_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own tournament participation"
  ON tournament_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tournament data"
  ON tournament_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for media uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('game-media', 'game-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can read game media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'game-media');

CREATE POLICY "Authenticated users can upload game media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'game-media');

CREATE POLICY "Users can update own uploads"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'game-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to update participant total score
CREATE OR REPLACE FUNCTION update_participant_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE participant_sessions
  SET total_score = (
    SELECT COALESCE(SUM(score), 0)
    FROM answers
    WHERE session_id = NEW.session_id
    AND user_id = NEW.user_id
  )
  WHERE session_id = NEW.session_id
  AND user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trigger_update_participant_score
  AFTER INSERT OR UPDATE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_score();

-- Function to generate join code
CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars))::integer + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
