'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Harap masukkan email dan kata sandi.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setErrorMsg(
          error.message ||
            'Kombinasi email atau kata sandi tidak cocok. Pastikan akun sudah didaftarkan di Neon.'
        );
        setLoading(false);
        return;
      }

      // Berhasil login
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(
        err.message || 'Terjadi gangguan saat menghubungi server autentikasi.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center p-4 bg-[#F8FAFC] dark:bg-black transition-colors duration-300">
      {/* Tombol Tema Melayang */}
      <ThemeToggle />

      {/* Background Glow / Subtle Accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#00A2E9]/10 dark:bg-[#00A2E9]/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#005596]/15 dark:bg-[#005596]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card Login */}
        <div className="w-full rounded-2xl bg-white dark:bg-zinc-950 p-7 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-zinc-800 transition-all duration-200">
          {/* Header & Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-[#E0F2FE] dark:bg-zinc-900 border border-[#00A2E9]/30 dark:border-zinc-800 text-[#005596] dark:text-[#00A2E9] shadow-sm mb-3">
              <span className="text-2xl font-black tracking-tighter">
                i<span className="text-[#00A2E9]">+</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#005596] dark:text-white tracking-tight">
              PLN ICON PLUS
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-[#0A2540] dark:text-zinc-300 mt-1">
              Sistem Penjadwalan & Rotasi Lembur Tim
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
              Divisi Multimedia & Operasional
            </p>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex-1 font-medium leading-relaxed">
                {errorMsg}
              </div>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
              >
                Email Personil / Admin
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Mail className="size-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A2E9] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-zinc-500">
                  <Lock className="size-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00A2E9] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#005596] hover:bg-[#004275] active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-[#005596]/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Memverifikasi Sesi...</span>
                </>
              ) : (
                <span>Masuk ke Dashboard</span>
              )}
            </button>
          </form>

          {/* Security Notice: Closed Registration Policy */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800/80">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F0F9FF] dark:bg-zinc-900/60 border border-[#BAE6FD]/60 dark:border-zinc-800 text-[#0369A1] dark:text-zinc-400 text-xs leading-relaxed">
              <ShieldCheck className="size-4 shrink-0 text-[#0284C7] dark:text-[#00A2E9] mt-0.5" />
              <div>
                <span className="font-bold text-[#005596] dark:text-zinc-200">
                  Akses Sistem Tertutup (Closed Access):
                </span>{' '}
                Pendaftaran akun baru dikelola secara terpusat oleh Administrator
                langsung melalui database Neon.
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 dark:text-zinc-600 mt-5">
          &copy; 2026 PT PLN Indonesia Comnets Plus (PLN Icon Plus)
        </p>
      </div>
    </div>
  );
}
