'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { GameSession } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Gamepad2, Plus, ArrowLeft, Play, CreditCard as Edit, Trash2, Copy, Check, Users, Clock } from 'lucide-react';

export default function AdminSessionsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [fetching, setFetching] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) router.push('/dashboard');
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (user && profile?.role === 'admin') fetchSessions();
  }, [user, profile]);

  const fetchSessions = async () => {
    const { data } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('admin_id', user?.id)
      .order('created_at', { ascending: false });
    setSessions(data || []);
    setFetching(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus session ini?')) return;
    await supabase.from('game_sessions').delete().eq('id', id);
    setSessions(sessions.filter((s) => s.id !== id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('game_sessions').update({ status }).eq('id', id);
    setSessions(sessions.map((s) => s.id === id ? { ...s, status: status as any } : s));
  };

  const statusColor = (status: string) => {
    if (status === 'active') return 'bg-green-100 text-green-700 border-green-200';
    if (status === 'waiting') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'completed') return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-sky-50 text-sky-600 border-sky-100';
  };

  const statusLabel: Record<string, string> = {
    draft: 'Draft',
    waiting: 'Menunggu',
    active: 'Berlangsung',
    completed: 'Selesai',
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-sky-50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 gradient-rose rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient">Game Sessions</span>
          </div>
          <div className="ml-auto">
            <Link href="/admin/sessions/new">
              <Button size="sm" className="gradient-rose text-white border-0 shadow-md">
                <Plus className="w-3.5 h-3.5 mr-1" /> Buat Session
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {fetching ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-50 p-12 text-center">
            <Gamepad2 className="w-16 h-16 text-sky-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum ada session</h3>
            <p className="text-muted-foreground text-sm mb-4">Buat session game pertamamu!</p>
            <Link href="/admin/sessions/new">
              <Button className="gradient-rose text-white border-0">
                <Plus className="w-4 h-4 mr-1" /> Buat Session
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-2xl border border-sky-50 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base truncate">{session.title}</h3>
                    {session.description && (
                      <p className="text-muted-foreground text-sm mt-0.5 truncate">{session.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColor(session.status)}`}>
                        {statusLabel[session.status]}
                      </span>
                      {session.join_code && (
                        <button
                          onClick={() => copyCode(session.join_code!)}
                          className="flex items-center gap-1 text-xs bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full hover:bg-gray-100 font-mono transition-colors"
                        >
                          {copiedCode === session.join_code ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          {session.join_code}
                        </button>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {session.time_per_question}s/soal
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {session.status === 'draft' && (
                      <Button size="sm" variant="ghost" className="text-amber-600 hover:bg-amber-50 text-xs"
                        onClick={() => updateStatus(session.id, 'waiting')}>
                        Buka
                      </Button>
                    )}
                    {session.status === 'waiting' && (
                      <Button size="sm" className="gradient-rose text-white border-0 text-xs hover:opacity-90"
                        onClick={() => updateStatus(session.id, 'active')}>
                        <Play className="w-3 h-3 mr-1" /> Mulai
                      </Button>
                    )}
                    {session.status === 'active' && (
                      <>
                        <Link href={`/leaderboard/${session.id}`}>
                          <Button size="sm" variant="ghost" className="text-sky-600 hover:bg-sky-50 text-xs">
                            <Users className="w-3 h-3 mr-1" /> Board
                          </Button>
                        </Link>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:bg-gray-50 text-xs"
                          onClick={() => updateStatus(session.id, 'completed')}>
                          Akhiri
                        </Button>
                      </>
                    )}
                    <Link href={`/admin/sessions/${session.id}`}>
                      <Button size="sm" variant="ghost" className="text-sky-600 hover:bg-sky-50">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-50"
                      onClick={() => handleDelete(session.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
