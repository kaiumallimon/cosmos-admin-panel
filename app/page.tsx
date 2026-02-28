'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import { Button } from '@/components/ui/button';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useSpring,
  AnimatePresence,
} from 'motion/react';
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
  UsersIcon,
  MessageCircleIcon,
  AwardIcon,
  MousePointerClickIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ANIMATED COMPONENTS                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

// ── Animated Globe (canvas) ──────────────────────────────────────────────────
function AnimatedGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 400;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let frame = 0;
    let animId: number;

    const dots: { lat: number; lng: number }[] = [];
    for (let lat = -80; lat <= 80; lat += 8) {
      for (let lng = -180; lng < 180; lng += 8) {
        dots.push({ lat: (lat * Math.PI) / 180, lng: (lng * Math.PI) / 180 });
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const r = size * 0.38;
      const rotation = frame * 0.003;
      const isDark = resolvedTheme === 'dark';

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      dots.forEach(({ lat, lng }) => {
        const x3d = Math.cos(lat) * Math.sin(lng + rotation);
        const y3d = Math.sin(lat);
        const z3d = Math.cos(lat) * Math.cos(lng + rotation);
        if (z3d < -0.1) return;
        const px = cx + x3d * r;
        const py = cy - y3d * r;
        const alpha = Math.max(0, z3d) * (isDark ? 0.7 : 0.5);
        const dotR = 1 + z3d * 0.8;
        ctx.beginPath();
        ctx.arc(px, py, dotR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(249,115,22,${alpha})`;
        ctx.fill();
      });

      for (let i = 0; i < 3; i++) {
        const arcAngle = rotation * 1.5 + (i * Math.PI * 2) / 3;
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.02) {
          const lat = (t - 0.5) * Math.PI * 0.8;
          const lng2 = arcAngle + Math.sin(t * Math.PI) * 0.5;
          const z3d = Math.cos(lat) * Math.cos(lng2);
          if (z3d < 0) continue;
          const px = cx + Math.cos(lat) * Math.sin(lng2) * r;
          const py = cy - Math.sin(lat) * r;
          if (t === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(249,115,22,${isDark ? 0.2 : 0.15})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      frame++;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [resolvedTheme]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-none', className)}
      style={{ width: 400, height: 400 }}
    />
  );
}

// ── Cursor glow ──────────────────────────────────────────────────────────────
function CursorGlow() {
  const springX = useSpring(0, { stiffness: 120, damping: 20 });
  const springY = useSpring(0, { stiffness: 120, damping: 20 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || 'ontouchstart' in window) return;
    const move = (e: MouseEvent) => {
      springX.set(e.clientX);
      springY.set(e.clientY);
      if (!visible) setVisible(true);
    };
    const leave = () => setVisible(false);
    const enter = () => setVisible(true);
    window.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', leave);
    document.addEventListener('mouseenter', enter);
    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
      document.removeEventListener('mouseenter', enter);
    };
  }, [springX, springY, visible]);

  if (!visible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed z-[100] rounded-full bg-orange-500/15 blur-2xl"
      style={{ x: springX, y: springY, width: 150, height: 150, translateX: '-50%', translateY: '-50%' }}
    />
  );
}

// ── Floating particles ───────────────────────────────────────────────────────
function FloatingParticles() {
  const particles = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        dur: Math.random() * 20 + 15,
        delay: Math.random() * 5,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-orange-500/15"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{ y: [0, -30, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Fade-in wrapper ──────────────────────────────────────────────────────────
function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const offset = direction === 'down' || direction === 'right' ? -30 : 30;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, [axis]: offset }}
      animate={inView ? { opacity: 1, [axis]: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Stagger container ────────────────────────────────────────────────────────
function StaggerChildren({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.08 } }, hidden: {} }}
    >
      {children}
    </motion.div>
  );
}

const staggerItem = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

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
    <motion.div
      variants={staggerItem}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/5"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className={cn('mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl', gradient)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}

// ── Marquee ──────────────────────────────────────────────────────────────────
function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <motion.div
        className="flex gap-4 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

function TechBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/60 backdrop-blur-sm px-5 py-2.5 text-xs font-medium text-muted-foreground shrink-0 hover:border-orange-500/30 hover:text-foreground transition-colors">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

// ── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon: Icon, value, label, suffix }: { icon: React.ElementType; value: number; label: string; suffix?: string }) {
  return (
    <motion.div variants={staggerItem} className="flex flex-col items-center gap-1.5 px-4 py-3">
      <Icon className="h-5 w-5 text-orange-500" />
      <p className="text-2xl sm:text-3xl font-bold text-foreground">
        <AnimatedNumber value={value} suffix={suffix} />
      </p>
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
    </motion.div>
  );
}

// ── How-it-works step ────────────────────────────────────────────────────────
function StepCard({ step, title, description, icon: Icon }: { step: number; title: string; description: string; icon: React.ElementType }) {
  return (
    <motion.div variants={staggerItem} className="relative flex flex-col items-center text-center gap-4">
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20"
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Icon className="h-7 w-7" />
        <div className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-background border-2 border-orange-500 flex items-center justify-center text-[10px] font-bold text-orange-500">
          {step}
        </div>
      </motion.div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => setMounted(true), []);

  const features = [
    { icon: BrainCircuitIcon, title: 'Multi-Agent AI Orchestration', description: 'Intelligent query routing across specialized AI agents — each fine-tuned for CSE, EEE, BBA, and other UIU departments.', gradient: 'bg-linear-to-br from-violet-500 to-purple-600' },
    { icon: SearchIcon, title: 'Retrieval-Augmented Generation', description: 'Semantic vector search over thousands of past UIU exam questions, powered by OpenAI embeddings and Pinecone.', gradient: 'bg-linear-to-br from-blue-500 to-cyan-600' },
    { icon: MessagesSquareIcon, title: 'Conversational Tutoring', description: 'Memory-aware, multi-turn chat that adapts to your learning history. Ask follow-ups, get clarifications, dive deeper.', gradient: 'bg-linear-to-br from-orange-500 to-amber-600' },
    { icon: BarChart3Icon, title: 'Performance Analytics', description: 'Bento-grid dashboards tracking your scores, strengths, weaknesses, and progress across every UIU course and assessment.', gradient: 'bg-linear-to-br from-emerald-500 to-green-600' },
    { icon: RouteIcon, title: 'AI Learning Roadmaps', description: 'Generate personalized, interactive D3-powered study roadmaps. Visualize your path to mastering any topic or course.', gradient: 'bg-linear-to-br from-pink-500 to-rose-600' },
    { icon: TargetIcon, title: 'Adaptive Practice Quizzes', description: 'AI-generated quizzes targeting your weak areas based on UIU curriculum. Instant feedback with detailed explanations.', gradient: 'bg-linear-to-br from-indigo-500 to-blue-600' },
    { icon: TrendingUpIcon, title: 'CGPA Prediction & Planning', description: 'Predict your CGPA trajectory for upcoming trimesters, plan target grades, and get AI recommendations to reach your goals.', gradient: 'bg-linear-to-br from-teal-500 to-cyan-600' },
    { icon: CalendarIcon, title: 'Academic Calendar & Routines', description: 'Stay organized with UIU trimester calendars, exam schedules, class routines, and important deadline notifications.', gradient: 'bg-linear-to-br from-yellow-500 to-orange-600' },
    { icon: ClipboardListIcon, title: 'Smart Study Planner', description: 'AI-assisted study planning that considers your UIU course load, upcoming exams, and schedule for optimal preparation.', gradient: 'bg-linear-to-br from-red-500 to-pink-600' },
  ];

  const techStack = [
    { icon: GlobeIcon, label: 'Next.js 16' },
    { icon: BrainCircuitIcon, label: 'OpenAI GPT-4o' },
    { icon: DatabaseIcon, label: 'MongoDB Atlas' },
    { icon: SearchIcon, label: 'Pinecone' },
    { icon: LayersIcon, label: 'Tailwind CSS v4' },
    { icon: ShieldCheckIcon, label: 'JWT + bcrypt' },
    { icon: BotIcon, label: 'Multi-Agent RAG' },
    { icon: ZapIcon, label: 'Turbopack' },
    { icon: GraduationCapIcon, label: 'D3.js Roadmaps' },
    { icon: MessageCircleIcon, label: 'Real-time Chat' },
  ];

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-background text-foreground">
      {/* Scroll progress */}
      <motion.div className="fixed top-0 left-0 right-0 h-0.5 bg-orange-500 z-[60] origin-left" style={{ scaleX }} />

      <CursorGlow />
      <FloatingParticles />

      <DottedGlowBackground
        className="pointer-events-none fixed inset-0 z-0 mask-radial-to-90% mask-radial-at-center"
        opacity={0.4}
        gap={16}
        radius={1}
        colorLightVar="--color-orange-400"
        glowColorLightVar="--color-orange-500"
        colorDarkVar="--color-orange-600"
        glowColorDarkVar="--color-orange-500"
        backgroundOpacity={0}
        speedMin={0.15}
        speedMax={0.8}
        speedScale={1}
      />

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 sm:px-6 h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <motion.div
              className="h-8 w-8 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20"
              whileHover={{ rotate: 180, scale: 1.1 }}
              transition={{ duration: 0.4 }}
            >
              <SparklesIcon className="h-4 w-4 text-white" />
            </motion.div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              COSMOS<span className="text-orange-500">-ITS</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {['Features', 'How It Works', 'Tech Stack', 'Why UIU'].map((l) => (
              <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50">
                {l}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
                <AnimatePresence mode="wait">
                  <motion.div key={resolvedTheme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    {resolvedTheme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                  </motion.div>
                </AnimatePresence>
              </Button>
            )}

            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login"><Button variant="ghost" size="sm" className="text-sm font-medium">Sign In</Button></Link>
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="sm" className="text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20">Get Started</Button>
                </motion.div>
              </Link>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden">
              <div className="px-4 pb-4 pt-2 space-y-1">
                {['Features', 'How It Works', 'Tech Stack', 'Why UIU'].map((l) => (
                  <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setMobileMenuOpen(false)} className="block px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50">{l}</a>
                ))}
                <div className="flex gap-2 pt-2">
                  <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full text-sm">Sign In</Button></Link>
                  <Link href="/register" className="flex-1"><Button size="sm" className="w-full text-sm bg-orange-500 hover:bg-orange-600 text-white">Get Started</Button></Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-12 sm:pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">
                <SparklesIcon className="h-3.5 w-3.5" />
                Built exclusively for UIU Students
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
                Your Intelligent{' '}
                <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-amber-500 to-orange-600">
                  Academic Companion
                </span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-8 mx-auto lg:mx-0">
                COSMOS-ITS is a comprehensive AI-powered tutoring system built for United International University.
                Multi-agent orchestration, RAG over real UIU questions, personalized analytics, and more — all in one place.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
                <Link href="/register">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="h-12 px-8 text-base font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all">
                      Start Learning Free <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                </Link>
                <a href="#features">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-xl">
                    Explore Features <ChevronDownIcon className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-8 flex items-center gap-3 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  {['bg-orange-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'].map((bg, i) => (
                    <div key={i} className={cn('h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white', bg)}>
                      {['K', 'A', 'M', 'S'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Built by <Link href="/meet-the-team" className="font-semibold text-foreground hover:text-orange-500 transition-colors">Team bcrypt</Link> — UIU CSE students
                </p>
              </motion.div>
            </div>

            {/* Globe */}
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:flex items-center justify-center">
              <div className="relative">
                <AnimatedGlobe className="opacity-80" />
                <motion.div className="absolute top-8 -left-4 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm px-3 py-2 shadow-lg" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <div className="flex items-center gap-2"><BrainCircuitIcon className="h-4 w-4 text-violet-500" /><span className="text-xs font-medium">AI Agents Active</span></div>
                </motion.div>
                <motion.div className="absolute bottom-12 -right-4 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm px-3 py-2 shadow-lg" animate={{ y: [0, 8, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}>
                  <div className="flex items-center gap-2"><SearchIcon className="h-4 w-4 text-blue-500" /><span className="text-xs font-medium">5000+ Questions</span></div>
                </motion.div>
                <motion.div className="absolute top-1/2 -right-8 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm px-3 py-2 shadow-lg" animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}>
                  <div className="flex items-center gap-2"><TargetIcon className="h-4 w-4 text-orange-500" /><span className="text-xs font-medium">Smart Quizzes</span></div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pb-16 sm:pb-24 px-4 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-4xl">
            <StaggerChildren className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-4">
              <StatPill icon={BookOpenIcon} value={5000} suffix="+" label="Questions Indexed" />
              <StatPill icon={BrainCircuitIcon} value={6} suffix="+" label="AI Agents" />
              <StatPill icon={GraduationCapIcon} value={50} suffix="+" label="UIU Courses" />
              <StatPill icon={UsersIcon} value={100} suffix="+" label="Active Students" />
            </StaggerChildren>
          </div>
        </FadeIn>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section id="features" className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">Everything you need to excel at UIU</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">A comprehensive suite of AI-powered tools designed specifically for UIU students to study smarter, not harder.</p>
          </FadeIn>
          <StaggerChildren className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </StaggerChildren>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">Three steps to smarter studying</h2>
          </FadeIn>
          <StaggerChildren className="grid gap-10 sm:grid-cols-3">
            <StepCard step={1} icon={MousePointerClickIcon} title="Ask Anything" description="Type your question in natural language — from exam prep to concept explanations. Our AI routes it to the best specialized agent for your department." />
            <StepCard step={2} icon={BrainCircuitIcon} title="Get Smart Answers" description="Receive accurate, context-rich answers powered by RAG over real UIU exam questions, with citations, code snippets, and visual explanations." />
            <StepCard step={3} icon={TrendingUpIcon} title="Track & Improve" description="Monitor your progress through analytics dashboards, adaptive quizzes, CGPA predictions, and AI-generated study roadmaps tailored to UIU curriculum." />
          </StaggerChildren>
        </div>
      </section>

      {/* ── TECH STACK (Marquee) ───────────────────────────────────────────── */}
      <section id="tech-stack" className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Built With</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">Modern technology stack</h2>
            <p className="mx-auto max-w-xl text-muted-foreground">Production-grade frameworks and AI infrastructure engineered for reliability, speed, and intelligence.</p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Marquee>
              {techStack.map((t) => <TechBadge key={t.label} {...t} />)}
            </Marquee>
          </FadeIn>
        </div>
      </section>

      {/* ── WHY UIU ────────────────────────────────────────────────────────── */}
      <section id="why-uiu" className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Built for UIU</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">Why COSMOS-ITS for United International University?</h2>
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: BookOpenIcon, title: 'UIU Exam Question Bank', desc: 'Indexed thousands of past mid & final exam questions across all UIU departments — searchable by course code, trimester, and topic.' },
              { icon: GraduationCapIcon, title: 'Trimester-Based System', desc: "Fully aligned with UIU's trimester calendar. Track credits, plan courses, and predict CGPA based on UIU's grading and credit system." },
              { icon: AwardIcon, title: 'Department-Specific Agents', desc: 'Specialized AI agents for CSE, EEE, BBA, Civil, and more — each trained on department-specific curricula and question patterns.' },
              { icon: UsersIcon, title: 'By UIU Students, For UIU Students', desc: 'Built by Team bcrypt — a group of passionate UIU CSE students who understand the challenges and needs of their peers firsthand.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.1}>
                <motion.div
                  className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 h-full"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <item.icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-4xl">
            <motion.div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-amber-500 p-8 sm:p-14 text-center text-white shadow-2xl shadow-orange-500/20" whileHover={{ scale: 1.01 }} transition={{ duration: 0.3 }}>
              <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10">
                <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}>
                  <GraduationCapIcon className="mx-auto h-10 w-10 mb-5 opacity-90" />
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to transform your UIU journey?</h2>
                <p className="mx-auto max-w-md text-sm sm:text-base text-white/80 mb-8">Join COSMOS-ITS today and experience the future of university learning — completely free for all UIU students.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-12 px-8 text-base font-semibold bg-white text-orange-600 hover:bg-white/90 rounded-xl shadow-lg">Create Free Account <ArrowRightIcon className="ml-2 h-4 w-4" /></Button>
                    </motion.div>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-base font-medium rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white">Sign In</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/40 bg-background/70 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                  <SparklesIcon className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-sm font-semibold text-foreground">COSMOS<span className="text-orange-500">-ITS</span></span>
              </div>
              <div className="flex items-center gap-6">
                <Link href="/meet-the-team" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Meet the Team</Link>
                <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Sign In</Link>
                <Link href="/register" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Register</Link>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-border/30">
              <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} COSMOS-ITS &middot; Built by <Link href="/meet-the-team" className="text-orange-500 hover:underline">Team bcrypt</Link></p>
              <p className="text-xs text-muted-foreground">United International University, Dhaka, Bangladesh</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
