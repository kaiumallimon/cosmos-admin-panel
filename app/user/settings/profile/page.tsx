'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  UserIcon,
  PhoneIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  SaveIcon,
  ShieldCheckIcon,
  GraduationCapIcon,
  BuildingIcon,
  HashIcon,
  BookOpenIcon,
  PencilIcon,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  gender: string;
  role: string;
  student_id: string;
  department: string;
  batch: string;
  program: string;
  current_trimester: string;
  completed_credits: number;
  cgpa: number;
  avatar_url?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function PasswordInput({
  id,
  placeholder,
  value,
  onChange,
}: {
  id: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        className="pl-9 pr-10 h-10"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSettingsPage() {
  const { initializeAuth } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Editable personal fields ────────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');

  // ── Editable academic fields (only when empty) ──────────────────────────────
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [batch, setBatch] = useState('');
  const [program, setProgram] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password fields ─────────────────────────────────────────────────────────
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  // ── Fetch profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) throw new Error();
        const data: ProfileData = await res.json();
        setProfile(data);
        setFullName(data.full_name || '');
        setPhone(data.phone || '');
        setGender(data.gender || '');
        setStudentId(data.student_id || '');
        setDepartment(data.department || '');
        setBatch(data.batch || '');
        setProgram(data.program || '');
      } catch {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Save profile ────────────────────────────────────────────────────────────
  const handleSaveProfile = async () => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error('Full name must be at least 2 characters');
      return;
    }
    setSavingProfile(true);
    try {
      const body: Record<string, string> = {
        full_name: fullName.trim(),
        phone,
        gender,
      };
      if (!profile?.student_id && studentId) body.student_id = studentId;
      if (!profile?.department && department) body.department = department;
      if (!profile?.batch && batch) body.batch = batch;
      if (!profile?.program && program) body.program = program;

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setProfile(data.profile);
      toast.success('Profile updated successfully');
      await initializeAuth();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPw.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPw !== confirmPw) {
      toast.error('Passwords do not match');
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch('/api/user/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password change failed');
      toast.success('Password changed successfully');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const hasChanges =
    profile &&
    (fullName.trim() !== (profile.full_name || '') ||
      phone !== (profile.phone || '') ||
      gender !== (profile.gender || '') ||
      (!profile.student_id && !!studentId) ||
      (!profile.department && !!department) ||
      (!profile.batch && !!batch) ||
      (!profile.program && !!program));

  const initials = (profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase();

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      <FrostedHeader
        title="Profile Settings"
        subtitle="Manage your personal information and account security"
        onMobileMenuToggle={toggleMobileMenu}
        showSearch={false}
      />

      <div className="flex-1 p-4 md:p-6 space-y-6 max-w-5xl">

        {/* ── Avatar banner ── */}
        {loading ? (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card">
            <Skeleton className="h-16 w-16 rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 p-4 rounded-xl border border-border/60 bg-card">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/30 shrink-0"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold ring-2 ring-primary/30 shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-lg font-semibold truncate">{profile?.full_name || 'Student'}</p>
              <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
              <Badge variant="outline" className="mt-1 text-xs capitalize">{profile?.role}</Badge>
            </div>
          </div>
        )}

        {/* ── Cards grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* ── Personal Information ── */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <PencilIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
                  <CardDescription className="text-xs">Name, phone &amp; gender</CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Email — read only */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email address</Label>
                    <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border/60 bg-muted/40 text-sm text-muted-foreground">
                      <MailIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{profile?.email}</span>
                    </div>
                  </div>

                  {/* Full name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs">Full Name</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="full_name"
                        className="h-10 pl-9"
                        placeholder="Your full name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs">
                      Phone Number{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                      <Input
                        id="phone"
                        className="h-10 pl-9"
                        placeholder="+880 1xxx xxxxxx"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleSaveProfile}
                      disabled={savingProfile || !hasChanges}
                      className="gap-2 h-9"
                    >
                      <SaveIcon className="h-3.5 w-3.5" />
                      {savingProfile ? 'Saving…' : 'Save Changes'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Academic Information ── */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <GraduationCapIcon className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Academic Information</CardTitle>
                  <CardDescription className="text-xs">
                    {profile &&
                    profile.student_id &&
                    profile.department &&
                    profile.batch &&
                    profile.program
                      ? 'Your academic profile (read-only)'
                      : 'Fill in any missing academic details'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {/* Student ID */}
                  <div className="space-y-1.5">
                    <Label htmlFor="student_id" className="text-xs">Student ID</Label>
                    {profile?.student_id ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border/60 bg-muted/40 text-sm text-muted-foreground">
                        <HashIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{profile.student_id}</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <HashIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="student_id"
                          className="h-10 pl-9"
                          placeholder="e.g. 221-15-5678"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <Label htmlFor="department" className="text-xs">Department</Label>
                    {profile?.department ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border/60 bg-muted/40 text-sm text-muted-foreground">
                        <BuildingIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{profile.department}</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <BuildingIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="department"
                          className="h-10 pl-9"
                          placeholder="e.g. CSE"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Program */}
                  <div className="space-y-1.5">
                    <Label htmlFor="program" className="text-xs">Program</Label>
                    {profile?.program ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border/60 bg-muted/40 text-sm text-muted-foreground">
                        <BookOpenIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{profile.program}</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <BookOpenIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="program"
                          className="h-10 pl-9"
                          placeholder="e.g. B.Sc in CSE"
                          value={program}
                          onChange={(e) => setProgram(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Batch */}
                  <div className="space-y-1.5">
                    <Label htmlFor="batch" className="text-xs">Batch</Label>
                    {profile?.batch ? (
                      <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-border/60 bg-muted/40 text-sm text-muted-foreground">
                        <GraduationCapIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{profile.batch}</span>
                      </div>
                    ) : (
                      <div className="relative">
                        <GraduationCapIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                          id="batch"
                          className="h-10 pl-9"
                          placeholder="e.g. 60"
                          value={batch}
                          onChange={(e) => setBatch(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {profile &&
                    (!profile.student_id ||
                      !profile.department ||
                      !profile.batch ||
                      !profile.program) && (
                      <div className="pt-1 flex justify-end">
                        <Button
                          size="sm"
                          onClick={handleSaveProfile}
                          disabled={savingProfile || !hasChanges}
                          className="gap-2 h-9"
                        >
                          <SaveIcon className="h-3.5 w-3.5" />
                          {savingProfile ? 'Saving…' : 'Save Changes'}
                        </Button>
                      </div>
                    )}
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Change Password — full width ── */}
          <Card className="border-border/60 md:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
                  <CardDescription className="text-xs">
                    Verify your current password before setting a new one
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current_pw" className="text-xs">Current Password</Label>
                  <PasswordInput
                    id="current_pw"
                    placeholder="Enter current password"
                    value={currentPw}
                    onChange={setCurrentPw}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new_pw" className="text-xs">New Password</Label>
                  <PasswordInput
                    id="new_pw"
                    placeholder="At least 6 characters"
                    value={newPw}
                    onChange={setNewPw}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm_pw" className="text-xs">Confirm New Password</Label>
                  <PasswordInput
                    id="confirm_pw"
                    placeholder="Repeat new password"
                    value={confirmPw}
                    onChange={setConfirmPw}
                  />
                  {confirmPw && newPw !== confirmPw && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleChangePassword}
                  disabled={
                    savingPw ||
                    !currentPw ||
                    !newPw ||
                    !confirmPw ||
                    newPw !== confirmPw
                  }
                  className="gap-2 h-9"
                >
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  {savingPw ? 'Updating…' : 'Update Password'}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
