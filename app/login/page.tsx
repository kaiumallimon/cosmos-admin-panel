'use client';

import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { Label } from "@radix-ui/react-label";
import { EyeIcon, EyeOffIcon, Loader2, MailIcon, LockIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isUserAuthenticated = useAuthStore((state) => state.isUserAuthenticated);

  useEffect(() => {
    try {
      if (isAuthenticated()) {
        router.push('/admin');
      } else if (isUserAuthenticated()) {
        router.push('/user');
      }
    } catch (e) {
      console.warn('Auth redirect check failed', e);
    }
  }, [isAuthenticated, isUserAuthenticated, router]);

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
                  <Link
                    href="/reset-password"
                    className="text-xs text-muted-foreground hover:text-orange-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
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
    </div>
  );
}