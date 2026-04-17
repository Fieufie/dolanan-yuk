'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { GameSession, LeaderboardEntry } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { Trophy, ArrowLeft, Crown, Star, Medal, RefreshCw, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LeaderboardPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { user } = useAuth();
  const [session, setSession] = useState<GameSession | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const fetchLeaderboard = async () => {
    const { data: sessionData } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();
    setSession(sessionData);

    const { data } = await supabase
      .from('participant_sessions')
      .select('*, profiles(username, full_name, avatar_url)')
      .eq('session_id', sessionId)
      .order('total_score', { ascending: false });

    if (data) {
      const board = data.map((entry: any, i) => ({
        user_id: entry.user_id,
        username: entry.profiles?.full_name || entry.profiles?.username || 'Peserta',
        avatar_url: entry.profiles?.avatar_url,
        total_score: entry.total_score || 0,
        rank: i + 1,
        completed: entry.completed,
      }));
      setLeaderboard(board);
    }
    setLoading(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel(`leaderboard-${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'participant_sessions',
        filter: `session_id=eq.${sessionId}`,
      }, () => fetchLeaderboard())
      .subscribe();

    const interval = setInterval(fetchLeaderboard, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [sessionId]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200';
    if (rank === 2) return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return 'bg-white border-sky-50';
  };

  const myRank = leaderboard.find((e) => e.user_id === user?.id);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-sky-50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 gradient-rose rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient">Leaderboard</span>
          </div>
          <button onClick={fetchLeaderboard} className="text-muted-foreground hover:text-sky-600 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5">
        <div className="gradient-rose rounded-2xl p-5 text-white text-center mb-5 shadow-md">
          <Trophy className="w-10 h-10 mx-auto mb-2 animate-float" />
          <h1 className="text-xl font-bold">{session?.title}</h1>
          <p className="text-white/70 text-xs mt-1">{leaderboard.length} peserta</p>
          <p className="text-white/50 text-xs mt-0.5">
            Update: {lastUpdated.toLocaleTimeString('id-ID')}
          </p>
        </div>

        {myRank && (
          <div className="bg-sky-50 border-2 border-sky-300 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 gradient-rose rounded-full flex items-center justify-center text-white font-bold shrink-0">
              #{myRank.rank}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Posisi Kamu</p>
              <p className="text-muted-foreground text-xs">{myRank.username}</p>
            </div>
            <div className="flex items-center gap-1 text-amber-600">
              <Star className="w-4 h-4" />
              <span className="font-black text-lg">{myRank.total_score}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-50 p-10 text-center">
            <Trophy className="w-12 h-12 text-sky-200 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Belum ada peserta</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.user_id}
                className={`rounded-xl border p-4 flex items-center gap-3 transition-all ${getRankBg(entry.rank)} ${
                  entry.user_id === user?.id ? 'ring-2 ring-sky-300' : ''
                }`}
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="w-10 h-10 rounded-full gradient-rose flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {(entry.username?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {entry.username}
                    {entry.user_id === user?.id && (
                      <span className="ml-1.5 text-xs text-sky-600 font-normal">(kamu)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.completed ? 'Selesai' : 'Sedang bermain...'}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span className="font-black text-base text-amber-600">{entry.total_score}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
