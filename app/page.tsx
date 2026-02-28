'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import { Button } from '@/components/ui/button';
import {
  BrainCircuitIcon,
  BookOpenIcon,
  MessagesSquareIcon,
  BarChart3Icon,
  RouteIcon,
  ShieldCheckIcon,
  SparklesIcon,
  GraduationCapIcon,
  SearchIcon,
  ZapIcon,
  LayersIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  GlobeIcon,
  DatabaseIcon,
  BotIcon,
  TargetIcon,
  TrendingUpIcon,
  CalendarIcon,
  ClipboardListIcon,
  MenuIcon,
  XIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  LANDING PAGE — COSMOS-ITS                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1600;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5 hover:-translate-y-1">
      <div
        className={cn(
          'mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl',
          gradient,
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

// ── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({
  icon: Icon,
  value,
  label,
  suffix,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-3">
      <Icon className="h-5 w-5 text-orange-500" />
      <p className="text-2xl sm:text-3xl font-bold text-foreground">
        <AnimatedNumber value={value} suffix={suffix} />
      </p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </div>
  );
}

// ── Technology badge ─────────────────────────────────────────────────────────
function TechBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-orange-500/30 hover:text-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

// ── How-it-works step ────────────────────────────────────────────────────────
function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex flex-col items-center text-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-lg shadow-lg shadow-orange-500/20">
        {step}
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
        {description}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN COMPONENT                                                           */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  // — Features data ───────────────────────────────────────────────────────────
  const features = [
    {
      icon: BrainCircuitIcon,
      title: 'Multi-Agent AI Orchestration',
      description:
        'Intelligent query routing across specialized AI agents — each fine-tuned for different academic domains and question types.',
      gradient: 'bg-linear-to-br from-violet-500 to-purple-600',
    },
    {
      icon: SearchIcon,
      title: 'Retrieval-Augmented Generation',
      description:
        'Semantic vector search over thousands of past questions and study materials, powered by OpenAI embeddings and Pinecone.',
      gradient: 'bg-linear-to-br from-blue-500 to-cyan-600',
    },
    {
      icon: MessagesSquareIcon,
      title: 'Conversational Tutoring',
      description:
        'Memory-aware, multi-turn chat that adapts to your learning history. Ask follow-ups, get clarifications, dive deeper.',
      gradient: 'bg-linear-to-br from-orange-500 to-amber-600',
    },
    {
      icon: BarChart3Icon,
      title: 'Performance Analytics',
      description:
        'Comprehensive dashboards tracking your scores, strengths, weaknesses, and progress across every course and assessment.',
      gradient: 'bg-linear-to-br from-emerald-500 to-green-600',
    },
    {
      icon: RouteIcon,
      title: 'AI Learning Roadmaps',
      description:
        'Generate personalized, interactive study roadmaps with D3-powered visualizations. Track progress on every learning node.',
      gradient: 'bg-linear-to-br from-pink-500 to-rose-600',
    },
    {
      icon: TargetIcon,
      title: 'Adaptive Practice Quizzes',
      description:
        'AI-generated quizzes targeting your weak areas. Get instant feedback, detailed explanations, and track improvement over time.',
      gradient: 'bg-linear-to-br from-indigo-500 to-blue-600',
    },
    {
      icon: TrendingUpIcon,
      title: 'CGPA Prediction & Planning',
      description:
        'Predict your CGPA trajectory, plan target grades per course, and get AI-powered recommendations to reach your goals.',
      gradient: 'bg-linear-to-br from-teal-500 to-cyan-600',
    },
    {
      icon: CalendarIcon,
      title: 'Academic Calendar & Routines',
      description:
        'Stay organized with trimester calendars, exam schedules, class routines, and important deadline notifications.',
      gradient: 'bg-linear-to-br from-yellow-500 to-orange-600',
    },
    {
      icon: ClipboardListIcon,
      title: 'Smart Study Planner',
      description:
        'AI-assisted study planning that considers your course load, upcoming exams, and personal schedule for optimal preparation.',
      gradient: 'bg-linear-to-br from-red-500 to-pink-600',
    },
  ];

  const techStack = [
    { icon: GlobeIcon, label: 'Next.js 16' },
    { icon: BrainCircuitIcon, label: 'OpenAI' },
    { icon: DatabaseIcon, label: 'MongoDB' },
    { icon: SearchIcon, label: 'Pinecone' },
    { icon: LayersIcon, label: 'Tailwind CSS' },
    { icon: ShieldCheckIcon, label: 'JWT Auth' },
    { icon: BotIcon, label: 'Multi-Agent' },
    { icon: ZapIcon, label: 'Turbopack' },
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-background text-foreground">
      {/* ── Dotted background ──────────────────────────────────────────────── */}
      <DottedGlowBackground
        className="pointer-events-none fixed inset-0 z-0 mask-radial-to-90% mask-radial-at-center"
        opacity={0.5}
        gap={14}
        radius={1.2}
        colorLightVar="--color-orange-400"
        glowColorLightVar="--color-orange-500"
        colorDarkVar="--color-orange-600"
        glowColorDarkVar="--color-orange-500"
        backgroundOpacity={0}
        speedMin={0.2}
        speedMax={1}
        speedScale={1.2}
      />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
              <SparklesIcon className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              COSMOS<span className="text-orange-500">-ITS</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <a href="#features" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
              Features
            </a>
            <a href="#how-it-works" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
              How It Works
            </a>
            <a href="#tech" className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
              Tech Stack
            </a>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg"
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {resolvedTheme === 'dark' ? (
                  <SunIcon className="h-4 w-4" />
                ) : (
                  <MoonIcon className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Auth buttons — desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-sm font-medium">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20">
                  Get Started
                </Button>
              </Link>
            </div>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl px-4 pb-4 pt-2 space-y-1">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
            >
              How It Works
            </a>
            <a
              href="#tech"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50"
            >
              Tech Stack
            </a>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full text-sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button size="sm" className="w-full text-sm bg-orange-500 hover:bg-orange-600 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-20 sm:pt-28 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">
            <SparklesIcon className="h-3.5 w-3.5" />
            AI-Powered University Tutoring System
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Your Intelligent{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-amber-500 to-orange-600">
              Academic Companion
            </span>
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
            COSMOS-ITS combines multi-agent AI orchestration, semantic search over thousands of questions,
            and personalized analytics to transform how you study, practice, and excel in university.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-8 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
              >
                Start Learning Free
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 text-base font-medium rounded-xl"
              >
                Explore Features
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pb-16 sm:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-4">
            <StatPill icon={BookOpenIcon} value={5000} suffix="+" label="Questions Indexed" />
            <StatPill icon={BrainCircuitIcon} value={6} suffix="+" label="AI Agents" />
            <StatPill icon={GraduationCapIcon} value={50} suffix="+" label="Courses Covered" />
            <StatPill icon={ZapIcon} value={99} suffix="%" label="Uptime" />
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Everything you need to excel
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              A comprehensive suite of AI-powered tools designed to help every student
              study smarter, not harder.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Three steps to smarter studying
            </h2>
          </div>

          <div className="grid gap-10 sm:grid-cols-3">
            <StepCard
              step={1}
              title="Ask Anything"
              description="Type your question in natural language — from exam prep to concept explanations. Our AI routes it to the best specialized agent."
            />
            <StepCard
              step={2}
              title="Get Smart Answers"
              description="Receive accurate, context-rich answers powered by RAG over real university questions, with citations and visual explanations."
            />
            <StepCard
              step={3}
              title="Track & Improve"
              description="Monitor your progress through analytics dashboards, practice quizzes, and AI-generated study roadmaps tailored to your needs."
            />
          </div>
        </div>
      </section>

      {/* ── TECH STACK ─────────────────────────────────────────────────────── */}
      <section id="tech" className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">
              Built With
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Modern technology stack
            </h2>
            <p className="mx-auto max-w-xl text-muted-foreground">
              Engineered with production-grade frameworks and AI infrastructure for
              reliability, speed, and intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {techStack.map((t) => (
              <TechBadge key={t.label} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-amber-500 p-8 sm:p-14 text-center text-white shadow-2xl shadow-orange-500/20">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

            <div className="relative z-10">
              <GraduationCapIcon className="mx-auto h-10 w-10 mb-5 opacity-90" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-3">
                Ready to transform your academic journey?
              </h2>
              <p className="mx-auto max-w-md text-sm sm:text-base text-white/80 mb-8">
                Join COSMOS-ITS today and experience the future of university learning — completely free for students.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-semibold bg-white text-orange-600 hover:bg-white/90 rounded-xl shadow-lg"
                  >
                    Create Free Account
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base font-medium rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/40 bg-background/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <SparklesIcon className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                COSMOS<span className="text-orange-500">-ITS</span>
              </span>
            </div>

            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} COSMOS-ITS. Built for students, powered by AI.
            </p>

            <div className="flex items-center gap-4">
              <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Register
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
