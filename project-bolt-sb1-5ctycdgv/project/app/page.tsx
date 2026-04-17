'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Gamepad2, Star, Trophy, Music, Puzzle, Brain, Zap, Users, Crown, ChevronRight, Sparkles } from 'lucide-react';

const gameTypes = [
  { icon: Brain, label: 'Pilihan Ganda', color: 'bg-sky-100 text-sky-600', desc: 'Uji pengetahuanmu!' },
  { icon: Sparkles, label: 'Tebak Kata', color: 'bg-amber-100 text-amber-600', desc: 'Susun huruf jadi kata' },
  { icon: Puzzle, label: 'Puzzle Gambar', color: 'bg-sky-100 text-sky-600', desc: 'Susun gambar acak' },
  { icon: Zap, label: 'Memory Game', color: 'bg-green-100 text-green-600', desc: 'Ingat semua kartu' },
  { icon: Star, label: 'Math Game', color: 'bg-orange-100 text-orange-600', desc: 'Hitung cepat!' },
  { icon: Music, label: 'Tebak Lagu', color: 'bg-pink-100 text-pink-600', desc: 'Tebak dari potongan lagu' },
];

export default function LandingPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && profile) {
      router.push('/dashboard');
    }
  }, [user, profile, loading, router]);

  return (
    <div className="min-h-screen overflow-hidden relative">
      <div className="absolute inset-0 gradient-soft -z-10" />
      <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 bg-sky-200 rounded-full opacity-20 blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 sm:w-96 sm:h-96 bg-amber-200 rounded-full opacity-20 blur-3xl -z-10 -translate-x-1/3 translate-y-1/3" />

      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 gradient-rose rounded-xl flex items-center justify-center shadow-md shrink-0">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-gradient leading-tight">DolananYuk!</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-sky-700 hover:text-sky-700 hover:bg-sky-50 text-sm px-3">
              Masuk
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="gradient-rose text-white border-0 shadow-md hover:opacity-90 btn-bounce text-sm px-4">
              Daftar
            </Button>
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-4 pt-8 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-full px-3 py-1.5 text-xs sm:text-sm text-sky-700 font-medium mb-5">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Playground Ibu Profesional Banyumas Raya</span>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-4">
          Bermain Lebih Seru<br />
          <span className="text-gradient">Bersama DolananYuk!</span>
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-7 leading-relaxed">
          Yuk, bersenang-senang sambil asah otak, latih fokus, dan tajamkan konsentrasi! Game seru menanti, mainkan bersama teman dan keluarga kapan saja di mana saja.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full gradient-rose text-white border-0 shadow-lg hover:opacity-90 btn-bounce text-base px-8">
              Mulai Bermain
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full border-sky-200 text-sky-700 hover:bg-sky-50 text-base px-8">
              Sudah Punya Akun?
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6">
          <span className="text-gradient">6 Mode Game</span> Seru dan Menantang
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {gameTypes.map((game) => (
            <div key={game.label} className="bg-white rounded-2xl p-4 shadow-sm border border-sky-50 game-card-hover">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${game.color} rounded-xl flex items-center justify-center mb-2.5`}>
                <game.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <h3 className="font-semibold text-sm">{game.label}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{game.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-12">
        <div className="gradient-rose rounded-3xl p-7 sm:p-12 text-white text-center">
          <Crown className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 animate-float" />
          <h2 className="text-xl sm:text-3xl font-bold mb-2">Mode Turnamen</h2>
          <p className="text-white/80 text-sm sm:text-base max-w-xl mx-auto mb-5">
            Dari Penyisihan hingga Final! Kompetisi seru dengan sistem eliminasi, leaderboard real-time, dan semangat juang bersama.
          </p>
          <div className="flex flex-wrap gap-3 justify-center text-sm">
            {['Penyisihan', 'Semifinal', 'Final'].map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
                <span>{stage}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { icon: Users, label: 'Peserta', value: '1.000+' },
            { icon: Trophy, label: 'Game Dimainkan', value: '5.000+' },
            { icon: Star, label: 'Rating', value: '4.9 / 5.0' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-sm border border-sky-50">
              <stat.icon className="w-6 h-6 text-sky-600 mx-auto mb-1.5" />
              <div className="text-lg sm:text-2xl font-bold text-gradient">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center pb-8 text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div className="w-6 h-6 gradient-rose rounded-lg flex items-center justify-center">
            <Gamepad2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-foreground">DolananYuk!</span>
        </div>
        Playground Ibu Profesional Banyumas Raya
      </footer>
    </div>
  );
}
