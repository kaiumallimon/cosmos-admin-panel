'use client';

import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/auth";
import { EyeIcon, EyeOffIcon, Loader2, MailIcon, LockIcon, ShieldCheckIcon, AlertTriangleIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot password dialog
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setForgotSent(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setForgotLoading(false);
    }
  };

  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // Verify with the server before trusting local Zustand state (avoids
    // stale-persisted-state redirect loops where localStorage says "logged in"
    // but the access-token cookie has already expired).
    const checkServer = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!res.ok) return; // not authenticated — stay on login page
        const data = await res.json();
        if (data?.user?.role === 'admin') {
          router.replace('/admin');
        } else if (data?.user) {
          router.replace('/user');
        }
      } catch {
        // network error — stay on login page
      }
    };
    checkServer();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success("Login successful!");
        if (result.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/user');
        }
      } else {
        toast.error("Login failed. " + result.error);
      }
    } catch (error) {
      toast.error("Login failed. " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-hidden w-full h-full">
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
        opacity={1}
        gap={12}
        radius={1.3}
        colorLightVar="--color-orange-500"
        glowColorLightVar="--color-orange-500"
        colorDarkVar="--color-orange-500"
        glowColorDarkVar="--color-orange-500"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={2}
        speedScale={2}
      />

      <div className="relative z-10 flex items-center justify-center h-full px-4 py-8">
        <div className="w-full max-w-[420px] bg-background/60 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl shadow-black/10">
          <div className="p-6 sm:p-10">
            {/* Logo & heading */}
            <div className="mb-8 text-center">
              <Link
                href="/"
                className="inline-block text-2xl sm:text-3xl font-extrabold tracking-tight text-orange-500 hover:text-orange-600 transition-colors"
              >
                COSMOS-ITS
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to your account
              </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="email"
                    id="email"
                    className="pl-9 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => { setForgotOpen(true); setForgotSent(false); setForgotEmail(''); }}
                    className="text-xs text-muted-foreground hover:text-orange-500 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="pl-9 pr-10 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword
                      ? <EyeOffIcon className="h-4 w-4" />
                      : <EyeIcon className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-lg transition-colors mt-1"
              >
                {loading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</>
                  : "Sign in"
                }
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-1">
                Don&apos;t have an account?{' '}
                <Link href="/register" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                  Sign up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={(open) => {
        if (!open) { setForgotOpen(false); setForgotSent(false); setForgotEmail(''); }
      }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-orange-500" />
              Reset your password
            </DialogTitle>
            <DialogDescription>
              {forgotSent
                ? 'Check your inbox for the reset link.'
                : "Enter your account email and we'll send you a secure reset link that expires in 3 minutes."}
            </DialogDescription>
          </DialogHeader>

          {forgotSent ? (
            <div className="py-4">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-start gap-3">
                <ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p className="font-medium mb-1">Email sent successfully!</p>
                  <p>If <strong>{forgotEmail}</strong> is registered, you&apos;ll receive a password reset link shortly.</p>
                </div>
              </div>
              <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <AlertTriangleIcon className="h-4 w-4 shrink-0" />
                <p className="text-xs">The link expires in <strong>3 minutes</strong>. Check your spam folder if you don&apos;t see it.</p>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-sm font-medium">Email address</Label>
                <div className="relative">
                  <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9 h-10"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                    disabled={forgotLoading}
                    autoFocus
                  />
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
                <ShieldCheckIcon className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">A secure reset link will be emailed to you. It expires in <strong>3 minutes</strong> and can only be used once.</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setForgotOpen(false)}>
              {forgotSent ? 'Close' : 'Cancel'}
            </Button>
            {!forgotSent && (
              <Button
                onClick={handleForgotPassword}
                disabled={forgotLoading || !forgotEmail.trim()}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {forgotLoading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending…</>
                  : <><MailIcon className="h-4 w-4 mr-2" />Send Reset Link</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}