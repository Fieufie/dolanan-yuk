'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Gamepad2, Eye, EyeOff, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', username: '', fullName: '', role: 'participant' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        username: form.username,
        full_name: form.fullName,
        role: form.role,
      });

      if (profileError) {
        setError('Gagal membuat profil. Username mungkin sudah digunakan.');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-soft flex items-center justify-center p-4">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-200 rounded-full opacity-20 blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-200 rounded-full opacity-20 blur-3xl -z-10" />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 gradient-rose rounded-xl flex items-center justify-center shadow-md">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">DolananYuk!</span>
          </Link>
          <p className="text-muted-foreground mt-2 text-sm">Buat akun baru kamu</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-sky-50 p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Daftar Sebagai</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'participant', label: 'Peserta', emoji: '🎮' },
                  { value: 'admin', label: 'Game Master', emoji: '👑' },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: role.value })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.role === role.value
                        ? 'border-sky-400 bg-sky-50 text-sky-700'
                        : 'border-gray-200 hover:border-sky-200'
                    }`}
                  >
                    <span className="block text-lg mb-0.5">{role.emoji}</span>
                    {role.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">Nama Lengkap</Label>
              <Input
                id="fullName"
                placeholder="Nama lengkap kamu"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                className="border-sky-100 focus-visible:ring-sky-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-sm font-medium">Username</Label>
              <Input
                id="username"
                placeholder="username_kamu"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                required
                className="border-sky-100 focus-visible:ring-sky-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="border-sky-100 focus-visible:ring-sky-300"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 karakter"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  minLength={6}
                  className="border-sky-100 focus-visible:ring-sky-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-rose text-white border-0 shadow-md hover:opacity-90 btn-bounce"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Daftar Sekarang
                </span>
              )}
            </Button>
          </form>

          <div className="mt-5 pt-5 border-t border-sky-50 text-center text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-sky-600 font-medium hover:text-sky-700">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
