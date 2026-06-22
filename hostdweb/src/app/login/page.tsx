'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';

const slideshowImages = [
  '/slideshow/event1.jpg',
  '/slideshow/event2.jpg',
  '/slideshow/event3.jpg',
  '/slideshow/event4.jpg',
  '/slideshow/event5.jpg',
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { signIn, signInWithGoogle, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const waitForProfile = async () => {
    const start = Date.now();
    while ((authLoading || !userProfile) && Date.now() - start < 5000) {
      await new Promise((res) => setTimeout(res, 200));
    }
  };

  const routeOrDeny = () => {
    if (userProfile?.role === 'host' || userProfile?.hostApplication?.status === 'approved') {
      router.push('/dashboard');
    } else {
      setError('Access denied. Only hosts can access this platform.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      await waitForProfile();
      routeOrDeny();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      await waitForProfile();
      routeOrDeny();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Left: Brand + slideshow */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gray-900">
        {slideshowImages.map((image, index) => (
          <div
            key={index}
            className="absolute inset-0 transition-opacity duration-[1500ms] ease-in-out"
            style={{
              opacity: index === currentImageIndex ? 1 : 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-purple/85 via-secondary-rose/70 to-accent-coral/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col justify-between w-full p-12 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md ring-1 ring-white/20 p-[3px]">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white">
                <img src="/icon.png" alt="" className="h-8 w-8 rounded-md" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight">FemVents</span>
          </div>

          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70 mb-3">
              Host Dashboard
            </p>
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
              Run unforgettable events for your community.
            </h1>
            <p className="mt-5 text-base text-white/85 leading-relaxed">
              Tickets, attendees, payouts, and analytics — in one place built for women-led events.
            </p>
            <div className="mt-8 flex gap-2">
              {slideshowImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === currentImageIndex ? 'w-10 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="relative w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10">
        <div
          aria-hidden
          className="absolute top-0 right-0 h-80 w-80 rounded-full bg-femvents-gradient opacity-[0.06] blur-3xl"
        />

        <div className="relative w-full max-w-md z-10">
          {/* Mobile brand */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-femvents-gradient p-[2px] shadow-lg shadow-secondary-rose/20">
              <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-white">
                <img src="/icon.png" alt="" className="h-9 w-9 rounded-md" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
            </div>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-femvents-gradient">
              FemVents Host
            </h1>
          </div>

          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Sign in to manage your events and attendees.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3"
              >
                <AlertCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                <p className="text-sm text-red-700 leading-snug">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-[var(--foreground)]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full h-11 pl-10 pr-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-secondary-rose/40 focus:ring-2 focus:ring-secondary-rose/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-[var(--foreground)]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => alert('Forgot password functionality')}
                  className="text-xs font-medium text-secondary-rose hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:outline-none focus:border-secondary-rose/40 focus:ring-2 focus:ring-secondary-rose/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-xl bg-femvents-gradient text-white text-sm font-semibold shadow-md shadow-secondary-rose/20 hover:shadow-lg hover:shadow-secondary-rose/30 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--border-subtle)]" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[var(--background)] text-[11px] uppercase tracking-wider text-[var(--foreground-muted)]">
                  Or continue with
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full h-11 inline-flex justify-center items-center gap-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition-colors disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--foreground-muted)]">
            New to FemVents?{' '}
            <Link href="/signup" className="font-semibold text-secondary-rose hover:underline">
              Create an account
            </Link>
          </p>

          <p className="mt-8 text-center text-xs text-[var(--foreground-muted)]">
            © {new Date().getFullYear()} FemVents. Empowering women through events.
          </p>
        </div>
      </div>
    </div>
  );
}
