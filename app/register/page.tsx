'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [program, setProgram] = useState('');
  const [batch, setBatch] = useState('');

  // UI state
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
    <div className="fixed overflow-hidden w-full h-full">
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

      <div className="relative z-10 flex items-center justify-center min-h-full py-8 px-4">
        <div className="bg-transparent backdrop-blur-sm border rounded-lg w-full max-w-sm">
          <div className="p-10">
            <Link href="/" className="flex justify-center text-2xl font-bold mb-1 text-center text-orange-500">
              COSMOS-ITS
            </Link>
            <p className="text-sm text-center text-muted-foreground mb-6">Create your student account</p>

            {/* Success state */}
            {success ? (
              <div className="text-center py-4">
                <div className="flex justify-center mb-4">
                  <CheckCircleIcon className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Account created!</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Your student account has been successfully created. You can now sign in.
                </p>
                <Link href="/">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                    Sign in
                  </Button>
                </Link>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Required fields */}
                <div>
                  <Label htmlFor="fullName" className="block text-sm font-medium mb-1">
                    Full Name <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm Password <span className="text-orange-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>

                {/* Optional details collapsible */}
                <button
                  type="button"
                  className="w-full flex items-center justify-between text-xs font-medium text-muted-foreground border border-dashed border-border rounded-md px-3 py-2 hover:border-primary/50 hover:text-foreground transition-colors"
                  onClick={() => setShowOptional((v) => !v)}
                >
                  <span>Academic Details (optional)</span>
                  {showOptional ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
                </button>

                {showOptional && (
                  <div className="space-y-4 pl-1 border-l-2 border-primary/20 ml-1">
                    <div>
                      <Label htmlFor="studentId" className="block text-sm font-medium mb-1">Student ID</Label>
                      <Input
                        id="studentId"
                        type="text"
                        placeholder="e.g. CS-2301"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="department" className="block text-sm font-medium mb-1">Department</Label>
                      <Input
                        id="department"
                        type="text"
                        placeholder="e.g. Computer Science"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="program" className="block text-sm font-medium mb-1">Program</Label>
                      <Input
                        id="program"
                        type="text"
                        placeholder="e.g. BSc Computer Science"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="batch" className="block text-sm font-medium mb-1">Batch</Label>
                      <Input
                        id="batch"
                        type="text"
                        placeholder="e.g. 2023"
                        value={batch}
                        onChange={(e) => setBatch(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {error && (
                  <div className="px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
                    ⚠ {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating account…</>
                  ) : (
                    'Create account'
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground pt-1">
                  Already have an account?{' '}
                  <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium">
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
