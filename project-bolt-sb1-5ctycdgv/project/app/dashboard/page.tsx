'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { GameSession, ParticipantSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gamepad2, Plus, Trophy, Clock, Users, Crown, LogOut, Search, Play, Star, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [mySessions, setMySessions] = useState<GameSession[]>([]);
  const [myHistory, setMyHistory] = useState<ParticipantSession[]>([]);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [loading, user, router]);

  useEffect(() => {
    if (profile?.role === 'admin') fetchAdminSessions();
    else if (profile?.role === 'participant') fetchHistory();
  }, [profile]);

  const fetchAdminSessions = async () => {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('admin_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(6);
    setMySessions(data || []);
  };

  const fetchHistory = async () => {
    const { data } = await supabase
      .from('participant_sessions')
      .select('*, game_sessions(title, status)')
      .eq('user_id', user?.id)
      .order('joined_at', { ascending: false })
      .limit(6);
    setMyHistory(data || []);
  };

  const handleJoinGame = async () => {
    if (!joinCode.trim()) return;
    setJoinLoading(true);
    setJoinError('');

    const { data: session } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('join_code', joinCode.toUpperCase())
      .in('status', ['waiting', 'active'])
      .maybeSingle();

    if (!session) {
      setJoinError('Kode game tidak ditemukan atau sudah berakhir.');
      setJoinLoading(false);
      return;
    }

    const { error } = await supabase.from('participant_sessions').upsert({
      session_id: session.id,
      user_id: user?.id,
    }, { onConflict: 'session_id,user_id' });

    if (!error) {
      router.push(`/game/${session.id}`);
    }
    setJoinLoading(false);
  };

  const statusColor = (status: string) => {
    if (status === 'active') return 'bg-green-100 text-green-700';
    if (status === 'waiting') return 'bg-amber-100 text-amber-700';
    if (status === 'completed') return 'bg-gray-100 text-gray-600';
    return 'bg-sky-50 text-sky-600';
  };

  const statusLabel = (status: string) => {
    if (status === 'active') return 'Berlangsung';
    if (status === 'waiting') return 'Menunggu';
    if (status === 'completed') return 'Selesai';
    return 'Draft';
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-soft flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-sky-200 border-t-sky-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-sky-50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-rose rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gradient">DolananYuk!</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-7 h-7 gradient-rose rounded-full flex items-center justify-center text-white text-xs font-bold">
                {profile?.full_name?.[0] || profile?.username?.[0] || '?'}
              </div>
              <span className="font-medium text-foreground">{profile?.full_name || profile?.username}</span>
              {profile?.role === 'admin' && (
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">Admin</span>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <div className="gradient-rose rounded-2xl p-5 text-white">
          <p className="text-white/70 text-sm">Selamat datang kembali,</p>
          <h1 className="text-2xl font-bold mt-0.5">{profile?.full_name || profile?.username} 👋</h1>
          <p className="text-white/80 text-sm mt-1">
            {profile?.role === 'admin' ? 'Kelola game dan buat soal seru!' : 'Bergabung game dan raih skor tertinggi!'}
          </p>
        </div>

        {profile?.role === 'admin' ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Plus, label: 'Buat Session', href: '/admin/sessions/new', color: 'gradient-rose text-white' },
                { icon: Crown, label: 'Turnamen', href: '/admin/tournaments', color: 'bg-amber-100 text-amber-700' },
                { icon: Trophy, label: 'Semua Session', href: '/admin/sessions', color: 'bg-sky-100 text-sky-700' },
                { icon: Users, label: 'Leaderboard', href: '/admin/sessions', color: 'bg-green-100 text-green-700' },
              ].map((item) => (
                <Link key={item.label} href={item.href}>
                  <div className={`${item.color} rounded-xl p-4 text-center game-card-hover cursor-pointer`}>
                    <item.icon className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">Game Session Saya</h2>
                <Link href="/admin/sessions">
                  <Button variant="ghost" size="sm" className="text-sky-600 text-xs">
                    Lihat Semua <ChevronRight className="w-3 h-3 ml-0.5" />
                  </Button>
                </Link>
              </div>
              {mySessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-sky-50 p-8 text-center">
                  <Gamepad2 className="w-12 h-12 text-sky-200 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Belum ada game session</p>
                  <Link href="/admin/sessions/new">
                    <Button size="sm" className="gradient-rose text-white border-0 mt-3">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Buat Sekarang
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {mySessions.map((session) => (
                    <div key={session.id} className="bg-white rounded-xl border border-sky-50 p-4 flex items-center justify-between game-card-hover">
                      <div>
                        <h3 className="font-semibold text-sm">{session.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(session.status)}`}>
                            {statusLabel(session.status)}
                          </span>
                          {session.join_code && (
                            <span className="text-xs text-muted-foreground font-mono bg-gray-50 px-1.5 py-0.5 rounded">
                              {session.join_code}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/sessions/${session.id}`}>
                          <Button size="sm" variant="ghost" className="text-sky-600 hover:bg-sky-50">
                            <Play className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-sky-50 p-5 shadow-sm">
              <h2 className="font-bold mb-3 flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-600" />
                Bergabung Game
              </h2>
              <div className="flex gap-2">
                <Input
                  placeholder="Masukkan kode game (misal: ABC123)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="border-sky-100 focus-visible:ring-sky-300 font-mono text-center tracking-widest uppercase"
                  maxLength={6}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinGame()}
                />
                <Button
                  onClick={handleJoinGame}
                  disabled={joinLoading || !joinCode.trim()}
                  className="gradient-rose text-white border-0 hover:opacity-90 shrink-0"
                >
                  {joinLoading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Gabung'
                  )}
                </Button>
              </div>
              {joinError && (
                <p className="text-red-500 text-xs mt-2">{joinError}</p>
              )}
            </div>

            <div>
              <h2 className="font-bold text-lg mb-3">Riwayat Game</h2>
              {myHistory.length === 0 ? (
                <div className="bg-white rounded-2xl border border-sky-50 p-8 text-center">
                  <Trophy className="w-12 h-12 text-sky-200 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Belum ada riwayat game</p>
                  <p className="text-muted-foreground text-xs mt-1">Masukkan kode game untuk mulai bermain!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myHistory.map((history: any) => (
                    <div key={history.id} className="bg-white rounded-xl border border-sky-50 p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-sm">{history.game_sessions?.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-medium text-amber-600">{history.total_score} poin</span>
                          {history.rank && (
                            <span className="text-xs text-muted-foreground">Rank #{history.rank}</span>
                          )}
                        </div>
                      </div>
                      {history.game_sessions?.status === 'active' && (
                        <Link href={`/game/${history.session_id}`}>
                          <Button size="sm" className="gradient-rose text-white border-0 text-xs">
                            Lanjut
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
