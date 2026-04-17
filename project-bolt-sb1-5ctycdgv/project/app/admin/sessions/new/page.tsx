'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Gamepad2, Save } from 'lucide-react';

export default function NewSessionPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    time_per_question: 30,
    show_leaderboard: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== 'admin') return;
    setLoading(true);
    setError('');

    const { data, error } = await supabase.from('game_sessions').insert({
      title: form.title,
      description: form.description,
      admin_id: user.id,
      time_per_question: form.time_per_question,
      show_leaderboard: form.show_leaderboard,
      status: 'draft',
      join_code: generateCode(),
    }).select().single();

    if (error) {
      setError('Gagal membuat session. Coba lagi.');
    } else {
      router.push(`/admin/sessions/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b border-sky-50 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin/sessions">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 gradient-rose rounded-lg flex items-center justify-center">
              <Gamepad2 className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gradient">Buat Session Baru</span>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl border border-sky-50 p-6 shadow-sm">
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nama Session</Label>
              <Input
                placeholder="Contoh: Kuis Matematika Seru!"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="border-sky-100 focus-visible:ring-sky-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Deskripsi (opsional)</Label>
              <Textarea
                placeholder="Deskripsi singkat tentang game ini..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border-sky-100 focus-visible:ring-sky-300 min-h-[80px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Waktu per Soal (detik)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={form.time_per_question}
                  onChange={(e) => setForm({ ...form, time_per_question: Number(e.target.value) })}
                  className="flex-1 accent-sky-500"
                />
                <span className="text-lg font-bold text-sky-600 w-12 text-center">{form.time_per_question}s</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-sky-50 rounded-xl">
              <div>
                <p className="font-medium text-sm">Tampilkan Leaderboard</p>
                <p className="text-xs text-muted-foreground">Peserta bisa melihat skor real-time</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, show_leaderboard: !form.show_leaderboard })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.show_leaderboard ? 'bg-sky-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.show_leaderboard ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">{error}</div>
            )}

            <Button type="submit" disabled={loading} className="w-full gradient-rose text-white border-0 shadow-md hover:opacity-90">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Membuat...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Buat & Tambah Soal
                </span>
              )}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
