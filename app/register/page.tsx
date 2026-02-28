'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  Loader2,
  EyeIcon,
  EyeOffIcon,
  MailIcon,
  LockIcon,
  UserIcon,
  HashIcon,
  BuildingIcon,
  GraduationCapIcon,
  CalendarIcon,
} from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [batch, setBatch] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!fullName.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, string> = { email, password, full_name: fullName };
      if (studentId.trim()) body.student_id = studentId.trim();
      if (department.trim()) body.department = department.trim();
      if (program.trim()) body.program = program.trim();
      if (batch.trim()) body.batch = batch.trim();

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) throw new Error(data.message || 'Email or Student ID already in use.');
        throw new Error(data.message || 'Registration failed. Please try again.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 overflow-y-auto w-full h-full">
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

      <div className="relative z-10 flex items-center justify-center min-h-full py-6 px-4 overflow-y-auto">
        <div className="w-full max-w-[440px] bg-background/60 backdrop-blur-md border border-border/60 rounded-2xl shadow-xl shadow-black/10 my-auto">
          <div className="p-6 sm:p-10">
            {/* Logo & heading */}
            <div className="mb-7 text-center">
              <Link
                href="/"
                className="inline-block text-2xl sm:text-3xl font-extrabold tracking-tight text-orange-500 hover:text-orange-600 transition-colors"
              >
                COSMOS-ITS
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">Create your student account</p>
            </div>

            {success ? (
              <div className="text-center py-6">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">Account created!</h3>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Your student account has been successfully created. You can now sign in.
                </p>
                <Link href="/">
                  <Button className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg">
                    Sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name <span className="text-orange-500">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Your full name"
                      className="pl-9 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={loading}
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email <span className="text-orange-500">*</span>
                  </Label>
                  <div className="relative">
                    <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      className="pl-9 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-orange-500">*</span>
                  </Label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      className="pl-9 pr-10 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password <span className="text-orange-500">*</span>
                  </Label>
                  <div className="relative">
                    <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      className="pl-9 pr-10 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Optional academic details */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2.5 hover:border-orange-500/50 hover:text-foreground transition-colors"
                  onClick={() => setShowOptional((v) => !v)}
                >
                  <span>Academic Details (optional)</span>
                  {showOptional
                    ? <ChevronUpIcon className="h-3.5 w-3.5 shrink-0" />
                    : <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" />
                  }
                </button>

                {showOptional && (
                  <div className="space-y-4 pl-3 border-l-2 border-orange-500/20">
                    <div className="space-y-1.5">
                      <Label htmlFor="studentId" className="text-sm font-medium">Student ID</Label>
                      <div className="relative">
                        <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="studentId"
                          type="text"
                          placeholder="e.g. CS-2301"
                          className="pl-9 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                      <div className="relative">
                        <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="department"
                          type="text"
                          placeholder="e.g. Computer Science"
                          className="pl-9 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="program" className="text-sm font-medium">Program</Label>
                      <div className="relative">
                        <GraduationCapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="program"
                          type="text"
                          placeholder="e.g. BSc Computer Science"
                          className="pl-9 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="batch" className="text-sm font-medium">Batch</Label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          id="batch"
                          type="text"
                          placeholder="e.g. 2023"
                          className="pl-9 h-11 text-sm focus-visible:ring-orange-500/50 focus-visible:border-orange-500"
                          value={batch}
                          onChange={(e) => setBatch(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating account…</>
                    : 'Create account'
                  }
                </Button>

                <p className="text-center text-xs text-muted-foreground pt-1">
                  Already have an account?{' '}
                  <Link href="/" className="text-orange-500 hover:text-orange-600 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
