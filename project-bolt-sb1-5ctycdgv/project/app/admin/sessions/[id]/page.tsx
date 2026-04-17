'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { GameSession, Question } from '@/lib/types';
import { Button } from '@/components/ui/button';
import QuestionBuilder from '@/components/admin/QuestionBuilder';
import { ArrowLeft, Gamepad2, Plus, Trash2, CreditCard as Edit, Brain, Sparkles, Puzzle, Zap, Star, Music, Image, Users, Play, Copy, Check, Eye, EyeOff } from 'lucide-react';

const typeIcon: Record<string, any> = {
  multiple_choice: Brain,
  word_guess: Sparkles,
  puzzle: Puzzle,
  memory_game: Zap,
  math_game: Star,
  song_guess: Music,
  image_guess: Image,
};

const typeLabel: Record<string, string> = {
  multiple_choice: 'Pilihan Ganda',
  word_guess: 'Tebak Kata',
  puzzle: 'Puzzle',
  memory_game: 'Memory Game',
  math_game: 'Math Game',
  song_guess: 'Tebak Lagu',
  image_guess: 'Tebak Gambar',
};

export default function SessionDetailPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<GameSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [fetching, setFetching] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) router.push('/dashboard');
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (sessionId) {
      fetchSession();
      fetchQuestions();
    }
  }, [sessionId]);

  const fetchSession = async () => {
    const { data } = await supabase.from('game_sessions').select('*').eq('id', sessionId).maybeSingle();
    setSession(data);
    setFetching(false);
  };

  const fetchQuestions = async () => {
    const { data } = await supabase.from('questions').select('*').eq('session_id', sessionId).order('display_order');
    setQuestions(data || []);
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Hapus soal ini?')) return;
    await supabase.from('questions').delete().eq('id', id);
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const copyCode = () => {
    if (!session?.join_code) return;
    navigator.clipboard.writeText(session.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateStatus = async (status: string) => {
    if (!session) return;
    await supabase.from('game_sessions').update({ status }).eq('id', session.id);
    setSession({ ...session, status: status as any });
  };

  const toggleLeaderboard = async () => {
    if (!session) return;
    setSavingSettings(true);
    const newVal = !session.show_leaderboard;
    await supabase.from('game_sessions').update({ show_leaderboard: newVal }).eq('id', session.id);
    setSession({ ...session, show_leaderboard: newVal });
    setSavingSettings(false);
  };

  if (fetching) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-sky-50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/sessions">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-7 h-7 gradient-rose rounded-lg flex items-center justify-center shrink-0">
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient truncate">{session?.title}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {session?.join_code && (
              <button onClick={copyCode} className="flex items-center gap-1 text-xs bg-sky-50 border border-sky-100 text-sky-700 px-2.5 py-1.5 rounded-lg font-mono hover:bg-sky-100 transition-colors">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {session.join_code}
              </button>
            )}
            {session?.status === 'draft' && (
              <Button size="sm" variant="outline" className="border-amber-200 text-amber-600 hover:bg-amber-50 text-xs"
                onClick={() => updateStatus('waiting')}>
                Buka
              </Button>
            )}
            {session?.status === 'waiting' && (
              <Button size="sm" className="gradient-rose text-white border-0 text-xs hover:opacity-90"
                onClick={() => updateStatus('active')}>
                <Play className="w-3 h-3 mr-1" /> Mulai
              </Button>
            )}
            {session?.status === 'active' && (
              <Link href={`/leaderboard/${sessionId}`}>
                <Button size="sm" variant="outline" className="border-sky-200 text-sky-600 hover:bg-sky-50 text-xs">
                  <Users className="w-3 h-3 mr-1" /> Leaderboard
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">
              Daftar Soal
              <span className="ml-2 text-sm font-normal text-muted-foreground">({questions.length} soal)</span>
            </h2>
            <Button size="sm" className="gradient-rose text-white border-0 hover:opacity-90"
              onClick={() => { setEditQuestion(null); setShowBuilder(true); }}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sky-50 p-8 text-center">
              <Brain className="w-12 h-12 text-sky-200 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Belum ada soal</p>
              <Button size="sm" className="gradient-rose text-white border-0 mt-3 hover:opacity-90"
                onClick={() => setShowBuilder(true)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Soal Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {questions.map((q, i) => {
                const Icon = typeIcon[q.type] || Brain;
                return (
                  <div key={q.id} className="bg-white rounded-xl border border-sky-50 p-4 flex items-center gap-3 shadow-sm game-card-hover">
                    <div className="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-sky-600">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="text-xs text-sky-600 font-medium">{typeLabel[q.type]}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{q.question_text || q.math_expression || 'Memory Game'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-amber-600">{q.points} poin</span>
                        <span className="text-xs text-muted-foreground">{q.time_limit}s</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" className="text-sky-400 hover:bg-sky-50 h-8 w-8 p-0"
                        onClick={() => { setEditQuestion(q); setShowBuilder(true); }}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={() => handleDeleteQuestion(q.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:sticky lg:top-20 lg:h-fit space-y-4">
          {showBuilder ? (
            <div className="bg-white rounded-2xl border border-sky-50 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">{editQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}</h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground"
                  onClick={() => { setShowBuilder(false); setEditQuestion(null); }}>
                  Batal
                </Button>
              </div>
              <QuestionBuilder
                sessionId={sessionId}
                editQuestion={editQuestion}
                onSaved={() => { setShowBuilder(false); setEditQuestion(null); fetchQuestions(); }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-sky-50 p-6 shadow-sm text-center">
              <div className="gradient-soft rounded-xl p-6 mb-4">
                <Gamepad2 className="w-10 h-10 text-sky-400 mx-auto mb-2 animate-float" />
                <h3 className="font-semibold text-sm">Siap Bermain?</h3>
                <p className="text-xs text-muted-foreground mt-1">Tambahkan soal lalu bagikan kode ke peserta</p>
              </div>
              {session?.join_code && (
                <div className="bg-sky-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-muted-foreground mb-1">Kode Game</p>
                  <p className="text-3xl font-black text-sky-600 font-mono tracking-widest">{session.join_code}</p>
                  <p className="text-xs text-muted-foreground mt-1">Bagikan ke peserta!</p>
                </div>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-sky-50 p-4 shadow-sm">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              Pengaturan Tampilan
            </h3>
            <button
              onClick={toggleLeaderboard}
              disabled={savingSettings}
              className="w-full flex items-center justify-between p-3 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"
            >
              <div className="text-left">
                <p className="text-sm font-medium">Tampilkan Leaderboard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {session?.show_leaderboard
                    ? 'Peserta dapat melihat peringkat real-time'
                    : 'Leaderboard disembunyikan dari peserta'}
                </p>
              </div>
              <div className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-3 ${
                session?.show_leaderboard ? 'bg-sky-600' : 'bg-gray-300'
              } ${savingSettings ? 'opacity-50' : ''}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  session?.show_leaderboard ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </div>
            </button>
            <div className="mt-2 flex items-center gap-2">
              {session?.show_leaderboard ? (
                <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  <Eye className="w-3 h-3" />
                  Leaderboard aktif
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full">
                  <EyeOff className="w-3 h-3" />
                  Leaderboard disembunyikan
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
