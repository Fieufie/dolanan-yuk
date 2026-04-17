'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Tournament } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Crown, ArrowLeft, Plus, Play, Trophy, Gamepad2, Users, ChevronRight, CircleCheck as CheckCircle } from 'lucide-react';

const stageLabels: Record<string, string> = {
  qualifying: 'Penyisihan',
  semifinal: 'Semifinal',
  final: 'Final',
};

const stageColors: Record<string, string> = {
  qualifying: 'bg-sky-100 text-sky-700',
  semifinal: 'bg-amber-100 text-amber-700',
  final: 'bg-rose-100 text-rose-700',
};

export default function TournamentsPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'admin')) router.push('/dashboard');
  }, [loading, user, profile, router]);

  useEffect(() => {
    if (user && profile?.role === 'admin') fetchTournaments();
  }, [user, profile]);

  const fetchTournaments = async () => {
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .eq('admin_id', user?.id)
      .order('created_at', { ascending: false });
    setTournaments(data || []);
    setFetching(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    await supabase.from('tournaments').insert({
      title: form.title,
      description: form.description,
      admin_id: user.id,
      status: 'draft',
      current_stage: 'qualifying',
    });
    setForm({ title: '', description: '' });
    setShowForm(false);
    setCreating(false);
    fetchTournaments();
  };

  const advanceStage = async (tournament: Tournament) => {
    const stages = ['qualifying', 'semifinal', 'final'];
    const currentIdx = stages.indexOf(tournament.current_stage);
    if (currentIdx < stages.length - 1) {
      const nextStage = stages[currentIdx + 1];
      await supabase.from('tournaments')
        .update({ current_stage: nextStage, status: 'active' })
        .eq('id', tournament.id);
      fetchTournaments();
    } else {
      await supabase.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
      fetchTournaments();
    }
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
          <div className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 gradient-rose rounded-lg flex items-center justify-center">
              <Crown className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient">Turnamen</span>
          </div>
          <Button size="sm" className="gradient-rose text-white border-0 hover:opacity-90"
            onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Buat Turnamen
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {showForm && (
          <div className="bg-white rounded-2xl border border-sky-50 p-5 shadow-sm">
            <h2 className="font-bold mb-4">Buat Turnamen Baru</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Nama Turnamen</Label>
                <Input
                  placeholder="Turnamen Kuis Seru 2025"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                  className="border-sky-100 focus-visible:ring-sky-300"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Deskripsi (opsional)</Label>
                <Textarea
                  placeholder="Deskripsi turnamen..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="border-sky-100 focus-visible:ring-sky-300 min-h-[70px]"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating} className="gradient-rose text-white border-0 hover:opacity-90">
                  {creating ? 'Membuat...' : 'Buat Turnamen'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Batal</Button>
              </div>
            </form>
          </div>
        )}

        {fetching ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-2 border-sky-200 border-t-sky-500 rounded-full animate-spin mx-auto" />
          </div>
        ) : tournaments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-50 p-12 text-center">
            <Crown className="w-16 h-16 text-sky-200 mx-auto mb-4 animate-float" />
            <h3 className="text-lg font-semibold mb-2">Belum ada turnamen</h3>
            <p className="text-muted-foreground text-sm mb-4">Buat turnamen pertamamu!</p>
            <Button className="gradient-rose text-white border-0" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-1" /> Buat Turnamen
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {tournaments.map((tournament) => (
              <div key={tournament.id} className="bg-white rounded-2xl border border-sky-50 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base">{tournament.title}</h3>
                      {tournament.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    {tournament.description && (
                      <p className="text-sm text-muted-foreground mb-2">{tournament.description}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {['qualifying', 'semifinal', 'final'].map((stage, i) => {
                        const stages = ['qualifying', 'semifinal', 'final'];
                        const currentIdx = stages.indexOf(tournament.current_stage);
                        const isCurrent = tournament.current_stage === stage && tournament.status !== 'completed';
                        const isPast = stages.indexOf(stage) < currentIdx || tournament.status === 'completed';

                        return (
                          <div key={stage} className="flex items-center gap-1">
                            <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border ${
                              isCurrent ? stageColors[stage] + ' border-current' :
                              isPast ? 'bg-green-50 text-green-600 border-green-200' :
                              'bg-gray-50 text-gray-400 border-gray-200'
                            }`}>
                              {isPast && !isCurrent && <CheckCircle className="w-3 h-3" />}
                              {stageLabels[stage]}
                            </div>
                            {i < 2 && <ChevronRight className="w-3 h-3 text-gray-300" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0">
                    {tournament.status !== 'completed' && (
                      <Button size="sm" className="gradient-rose text-white border-0 hover:opacity-90 text-xs"
                        onClick={() => advanceStage(tournament)}>
                        <Play className="w-3 h-3 mr-1" />
                        {tournament.current_stage === 'final' ? 'Selesai' : `Mulai ${stageLabels[tournament.current_stage]}`}
                      </Button>
                    )}
                    <Link href={`/admin/sessions?tournament=${tournament.id}`}>
                      <Button size="sm" variant="outline" className="border-sky-200 text-sky-600 hover:bg-sky-50 text-xs w-full">
                        <Gamepad2 className="w-3 h-3 mr-1" />
                        Sessions
                      </Button>
                    </Link>
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
