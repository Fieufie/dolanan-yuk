'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { GameSession, Question, Answer } from '@/lib/types';
import Timer from '@/components/game/Timer';
import MultipleChoice from '@/components/game/games/MultipleChoice';
import WordGuess from '@/components/game/games/WordGuess';
import MathGame from '@/components/game/games/MathGame';
import SongGuess from '@/components/game/games/SongGuess';
import ImageGuess from '@/components/game/games/ImageGuess';
import MemoryGame from '@/components/game/games/MemoryGame';
import PuzzleGame from '@/components/game/games/PuzzleGame';
import { Gamepad2, Trophy, CircleCheck as CheckCircle, Star, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GamePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [session, setSession] = useState<GameSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [gamePhase, setGamePhase] = useState<'loading' | 'waiting' | 'playing' | 'result'>('loading');
  const [totalScore, setTotalScore] = useState(0);
  const [timerKey, setTimerKey] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (sessionId && user) {
      fetchSession();
      joinSession();
    }
  }, [sessionId, user]);

  const fetchSession = async () => {
    const { data: sessionData } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (!sessionData) {
      router.push('/dashboard');
      return;
    }

    setSession(sessionData);

    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', sessionId)
      .order('display_order');

    setQuestions(questionsData || []);

    const { data: answersData } = await supabase
      .from('answers')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user!.id);

    const existingAnswers = answersData || [];
    setAnswers(existingAnswers);

    const score = existingAnswers.reduce((sum, a) => sum + a.score, 0);
    setTotalScore(score);

    if (sessionData.status === 'active') {
      const nextUnanswered = (questionsData || []).findIndex(
        (q) => !existingAnswers.some((a) => a.question_id === q.id)
      );

      if (nextUnanswered === -1 || nextUnanswered >= (questionsData || []).length) {
        setGamePhase('result');
      } else {
        setCurrentIndex(nextUnanswered);
        setGamePhase('playing');
        setQuestionStartTime(Date.now());
        setTimerKey((k) => k + 1);
      }
    } else if (sessionData.status === 'waiting') {
      setGamePhase('waiting');
    } else if (sessionData.status === 'completed') {
      setGamePhase('result');
    } else {
      setGamePhase('loading');
    }
  };

  const joinSession = async () => {
    await supabase.from('participant_sessions').upsert(
      { session_id: sessionId, user_id: user!.id },
      { onConflict: 'session_id,user_id' }
    );
  };

  const handleAnswer = useCallback(async (answerValue: string, timeTaken: number) => {
    const question = questions[currentIndex];
    if (!question || !user) return;

    const alreadyAnswered = answers.some((a) => a.question_id === question.id);
    if (alreadyAnswered) return;

    let isCorrect = false;
    if (question.type === 'multiple_choice' || question.type === 'song_guess' || question.type === 'image_guess') {
      isCorrect = answerValue.toLowerCase() === (question.correct_answer || '').toLowerCase();
    } else if (question.type === 'word_guess') {
      isCorrect = answerValue.toUpperCase() === (question.correct_answer || '').toUpperCase();
    } else if (question.type === 'math_game') {
      isCorrect = answerValue.trim() === (question.correct_answer || '').trim();
    } else if (question.type === 'puzzle' || question.type === 'memory_game') {
      isCorrect = answerValue === 'solved' || answerValue === 'completed';
    }

    const maxTime = question.time_limit || 30;
    const timeBonus = Math.max(0, Math.floor(((maxTime - timeTaken) / maxTime) * 50));
    const score = isCorrect ? question.points + timeBonus : 0;

    const newAnswer: Partial<Answer> = {
      session_id: sessionId,
      question_id: question.id,
      user_id: user.id,
      answer_value: answerValue,
      is_correct: isCorrect,
      time_taken: timeTaken,
      score,
    };

    await supabase.from('answers').upsert(newAnswer, { onConflict: 'question_id,user_id' });

    const updatedAnswers = [...answers, newAnswer as Answer];
    setAnswers(updatedAnswers);
    setTotalScore((prev) => prev + score);

    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        setGamePhase('result');
        finishSession();
      } else {
        setCurrentIndex(nextIndex);
        setQuestionStartTime(Date.now());
        setTimerKey((k) => k + 1);
      }
    }, 1500);
  }, [questions, currentIndex, answers, user, sessionId]);

  const handleTimeExpire = useCallback(() => {
    handleAnswer('', 9999);
  }, [handleAnswer]);

  const finishSession = async () => {
    await supabase.from('participant_sessions').update({
      completed: true,
      completed_at: new Date().toISOString(),
    }).eq('session_id', sessionId).eq('user_id', user!.id);
  };

  if (loading || gamePhase === 'loading') {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Memuat game...</p>
        </div>
      </div>
    );
  }

  if (gamePhase === 'waiting') {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 gradient-rose rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse shadow-lg">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{session?.title}</h1>
          <p className="text-muted-foreground mb-6">Menunggu Game Master memulai game...</p>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-2 h-2 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <Button variant="ghost" className="mt-6 text-muted-foreground" onClick={() => window.location.reload()}>
            Refresh Status
          </Button>
        </div>
      </div>
    );
  }

  if (gamePhase === 'result') {
    const correctCount = answers.filter((a) => a.is_correct).length;
    const accuracy = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-3xl shadow-xl border border-sky-50 overflow-hidden">
            <div className="gradient-rose p-8 text-white text-center">
              <Trophy className="w-14 h-14 mx-auto mb-3 animate-float" />
              <h1 className="text-2xl font-bold">Game Selesai!</h1>
              <p className="text-white/70 text-sm mt-1">{session?.title}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-5xl font-black text-gradient">{totalScore}</div>
                <div className="text-muted-foreground text-sm">Total Poin</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <div className="font-bold text-green-700">{correctCount}/{questions.length}</div>
                  <div className="text-xs text-muted-foreground">Benar</div>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <div className="font-bold text-amber-600">{accuracy}%</div>
                  <div className="text-xs text-muted-foreground">Akurasi</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {session?.show_leaderboard && (
                  <Link href={`/leaderboard/${sessionId}`} className="block">
                    <Button className="w-full gradient-rose text-white border-0 hover:opacity-90">
                      <Users className="w-4 h-4 mr-2" />
                      Lihat Leaderboard
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard" className="block">
                  <Button variant="outline" className="w-full border-sky-200 text-sky-600">
                    Kembali ke Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  if (!currentQuestion) return null;

  const answeredCount = answers.length;
  const progressPct = (answeredCount / questions.length) * 100;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-sky-50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 gradient-rose rounded-lg flex items-center justify-center">
                <Gamepad2 className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm text-gradient truncate max-w-[150px]">{session?.title}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-600">
                <Star className="w-3.5 h-3.5" />
                <span className="font-bold text-sm">{totalScore}</span>
              </div>
              <span className="text-xs text-muted-foreground bg-sky-50 px-2 py-0.5 rounded-full">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
          <div className="h-1.5 bg-sky-100 rounded-full overflow-hidden">
            <div className="h-full gradient-rose rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        <div className="bg-white rounded-2xl border border-sky-50 shadow-sm p-5 mb-4">
          <Timer
            key={timerKey}
            duration={currentQuestion.time_limit || session?.time_per_question || 30}
            onExpire={handleTimeExpire}
          />
        </div>

        <div className="bg-white rounded-2xl border border-sky-50 shadow-sm p-5">
          {currentQuestion.type === 'multiple_choice' && (
            <MultipleChoice question={currentQuestion} onAnswer={handleAnswer} startTime={questionStartTime} />
          )}
          {currentQuestion.type === 'word_guess' && (
            <WordGuess question={currentQuestion} onAnswer={handleAnswer} startTime={questionStartTime} />
          )}
          {currentQuestion.type === 'math_game' && (
            <MathGame question={currentQuestion} onAnswer={handleAnswer} startTime={questionStartTime} />
          )}
          {currentQuestion.type === 'song_guess' && (
            <SongGuess question={currentQuestion} onAnswer={handleAnswer} startTime={questionStartTime} />
          )}
          {currentQuestion.type === 'image_guess' && (
            <ImageGuess question={currentQuestion} onAnswer={handleAnswer} startTime={questionStartTime} />
          )}
          {currentQuestion.type === 'memory_game' && (
            <MemoryGame question={currentQuestion} onAnswer={handleAnswer} startTime={questionStartTime} />
          )}
          {currentQuestion.type === 'puzzle' && (
            <PuzzleGame question={currentQuestion} onAnswer={handleAnswer} startTime={questionStartTime} />
          )}
        </div>
      </main>
    </div>
  );
}
