'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface TokenValidation {
  valid: boolean;
  email?: string;
  error?: string;
  expiresAt?: number;
}

function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValidation, setTokenValidation] = useState<TokenValidation>({ valid: false });
  const [validatingToken, setValidatingToken] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No reset token provided');
      setValidatingToken(false);
      return;
    }

    // Validate token on mount
    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      setValidatingToken(true);
      const response = await fetch(`/api/reset-password?token=${encodeURIComponent(token!)}`);
      const data = await response.json();

      setTokenValidation(data);
      if (!data.valid) {
        setError(data.error || 'Invalid or expired reset token');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      setError('Failed to validate reset token');
      setTokenValidation({ valid: false });
    } finally {
      setValidatingToken(false);
    }
  };

  const validatePassword = () => {
    if (newPassword.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    if (newPassword !== confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setError('An error occurred while resetting your password');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthLevel = () => {
    if (newPassword.length === 0) return 0;
    if (newPassword.length < 6) return 1;
    if (newPassword.length < 8) return 2;
    return 3;
  };

  const strengthLevel = getStrengthLevel();
  const strengthLabels = ['', 'Too short', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-destructive', 'bg-yellow-500', 'bg-green-500'];
  const strengthTextColors = ['text-muted-foreground', 'text-destructive', 'text-yellow-500', 'text-green-500'];

  // Loading state while validating token
  if (validatingToken) {
    return (
      <div className="fixed overflow-hidden w-full h-full">
        <DottedGlowBackground
          className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
          opacity={1} gap={12} radius={1.3}
          colorLightVar="--color-orange-500" glowColorLightVar="--color-orange-500"
          colorDarkVar="--color-orange-500" glowColorDarkVar="--color-orange-500"
          backgroundOpacity={0} speedMin={0.3} speedMax={2} speedScale={2}
        />
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="bg-transparent backdrop-blur-sm border rounded-lg p-12 text-center min-w-[300px]">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-lg font-semibold mb-2">Validating Reset Link</h2>
            <p className="text-sm text-muted-foreground">Please wait while we verify your reset token…</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state for invalid token
  if (!tokenValidation.valid) {
    return (
      <div className="fixed overflow-hidden w-full h-full">
        <DottedGlowBackground
          className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
          opacity={1} gap={12} radius={1.3}
          colorLightVar="--color-orange-500" glowColorLightVar="--color-orange-500"
          colorDarkVar="--color-orange-500" glowColorDarkVar="--color-orange-500"
          backgroundOpacity={0} speedMin={0.3} speedMax={2} speedScale={2}
        />
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="bg-transparent backdrop-blur-sm border rounded-lg p-12 text-center min-w-[300px] max-w-sm w-full">
            <div className="h-14 w-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Invalid Reset Link</h2>
            <p className="text-sm text-muted-foreground mb-2">{error}</p>
            <p className="text-xs text-muted-foreground mb-6">
              Reset links expire after 3 minutes for security reasons.
            </p>
            <Link href="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="fixed overflow-hidden w-full h-full">
        <DottedGlowBackground
          className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
          opacity={1} gap={12} radius={1.3}
          colorLightVar="--color-orange-500" glowColorLightVar="--color-orange-500"
          colorDarkVar="--color-orange-500" glowColorDarkVar="--color-orange-500"
          backgroundOpacity={0} speedMin={0.3} speedMax={2} speedScale={2}
        />
        <div className="relative z-10 flex items-center justify-center h-full px-4">
          <div className="bg-transparent backdrop-blur-sm border rounded-lg p-12 text-center min-w-[300px] max-w-sm w-full">
            <div className="h-14 w-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-7 w-7 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Password Reset Successfully</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Your password has been updated. You can now log in with your new password.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Redirecting to login in a few seconds…
            </p>
            <Link href="/login">
              <Button className="w-full">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main reset form
  return (
    <div className="fixed overflow-hidden w-full h-full">
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
        opacity={1} gap={12} radius={1.3}
        colorLightVar="--color-orange-500" glowColorLightVar="--color-orange-500"
        colorDarkVar="--color-orange-500" glowColorDarkVar="--color-orange-500"
        backgroundOpacity={0} speedMin={0.3} speedMax={2} speedScale={2}
      />

      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="bg-transparent backdrop-blur-sm border rounded-lg w-full max-w-sm">
          <div className="p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <Link href="/" className="inline-block text-2xl font-bold text-primary mb-4">
                COSMOS-ITS
              </Link>
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Setting new password for{" "}
                <span className="text-foreground font-medium">{tokenValidation.email}</span>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* New Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      className="pr-10"
                      required
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {/* Strength bar */}
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((lvl) => (
                        <div
                          key={lvl}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            strengthLevel >= lvl ? strengthColors[strengthLevel] : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    {newPassword.length > 0 && (
                      <p className={`text-xs ${strengthTextColors[strengthLevel]}`}>
                        {strengthLabels[strengthLevel]} — {newPassword.length} characters
                      </p>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      className="pr-10"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {confirmPassword && (
                    <p className={`text-xs flex items-center gap-1.5 ${newPassword === confirmPassword ? 'text-green-500' : 'text-destructive'}`}>
                      <span className={`h-1.5 w-1.5 rounded-full inline-block ${newPassword === confirmPassword ? 'bg-green-500' : 'bg-destructive'}`} />
                      {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Resetting Password…
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>

            <div className="mt-5 text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                ← Back to Login
              </Link>
            </div>

            {/* Security notice */}
            <div className="mt-6 p-3 bg-muted/50 border border-border rounded-md flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-0.5">
                <p className="font-medium text-foreground">Security Notice</p>
                <p>This reset link expires in 3 minutes.</p>
                <p>Choose a strong, unique password.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="fixed overflow-hidden w-full h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}