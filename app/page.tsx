'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  motion,
  useScroll,
  useTransform,
  useInView,
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
  GlobeIcon,
  DatabaseIcon,
  BotIcon,
  TargetIcon,
  TrendingUpIcon,
  CalendarIcon,
  ClipboardListIcon,
  UsersIcon,
  MessageCircleIcon,
  AwardIcon,
  MousePointerClickIcon,
  CheckCircle2Icon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LandingHeader from '@/components/landing/landing-header';
import LandingFooter from '@/components/landing/landing-footer';
import SectionSeparator from '@/components/landing/section-separator';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SHARED ANIMATION UTILITIES                                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const axis = direction === 'left' || direction === 'right' ? 'x' : direction === 'none' ? undefined : 'y';
  const offset = direction === 'down' || direction === 'right' ? -24 : 24;

  const initial: Record<string, number> = { opacity: 0 };
  if (axis) initial[axis] = offset;
  const animate: Record<string, number> = { opacity: 1 };
  if (axis) animate[axis] = 0;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? animate : initial}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function StaggerContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: 0.07 } }, hidden: {} }}
    >
      {children}
    </motion.div>
  );
}

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ANIMATED NUMBER COUNTER                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */
function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const duration = 1500;
          const start = performance.now();
          const run = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.floor(eased * value));
            if (p < 1) requestAnimationFrame(run);
          };
          requestAnimationFrame(run);
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

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FEATURE CARD                                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */
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
      variants={itemVariants}
      className="group relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 overflow-hidden transition-all duration-300 hover:border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/8"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-orange-500/4 via-transparent to-transparent rounded-2xl" />
      <div className={cn('mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl', gradient)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TECH BADGE (MARQUEE)                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */
function Marquee({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        className="flex gap-3 w-max"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
      >
        {children}
        {children}
      </motion.div>
    </div>
  );
}

function TechBadge({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-border/50 bg-card/50 backdrop-blur-sm px-5 py-2.5 text-xs font-medium text-muted-foreground shrink-0 hover:border-orange-500/30 hover:text-foreground transition-all cursor-default">
      <Icon className="h-3.5 w-3.5 text-orange-500" />
      {label}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  STEP CARD (HOW IT WORKS)                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */
function StepCard({
  step, title, description, icon: Icon,
}: {
  step: number; title: string; description: string; icon: React.ElementType;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="relative flex flex-col items-center text-center gap-4 group"
    >
      <motion.div
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25"
        whileHover={{ scale: 1.08, rotate: 4 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <Icon className="h-6 w-6" />
        <div className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-background border-2 border-orange-500 flex items-center justify-center text-[9px] font-bold text-orange-500">
          {step}
        </div>
      </motion.div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{description}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  FLOATING HERO CARD (decorative)                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */
function FloatingCard({
  icon: Icon, label, value, color, delay = 0, top, right, bottom, left,
}: {
  icon: React.ElementType; label: string; value?: string; color: string; delay?: number;
  top?: string; right?: string; bottom?: string; left?: string;
}) {
  return (
    <motion.div
      className="absolute rounded-xl border border-border/60 bg-card/80 dark:bg-card/70 backdrop-blur-md px-3.5 py-2.5 shadow-lg"
      style={{ top, right, bottom, left }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.5 + delay, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn('h-4 w-4', color)} />
        <div>
          <p className="text-xs font-semibold text-foreground leading-none">{value || label}</p>
          {value && <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Home() {
  const { scrollYProgress } = useScroll();
  const scrollScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  const features = [
    {
      icon: BrainCircuitIcon,
      title: 'Multi-Agent AI Orchestration',
      description: 'Intelligent query routing across specialized AI agents fine-tuned for CSE, EEE, BBA, and other UIU departments.',
      gradient: 'bg-linear-to-br from-violet-500 to-purple-600',
    },
    {
      icon: SearchIcon,
      title: 'Retrieval-Augmented Generation',
      description: 'Semantic vector search over thousands of past UIU exam questions, powered by OpenAI embeddings and Pinecone.',
      gradient: 'bg-linear-to-br from-blue-500 to-cyan-600',
    },
    {
      icon: MessagesSquareIcon,
      title: 'Conversational Tutoring',
      description: 'Memory-aware, multi-turn chat that adapts to your learning history. Ask follow-ups and dive deeper.',
      gradient: 'bg-linear-to-br from-orange-500 to-amber-600',
    },
    {
      icon: BarChart3Icon,
      title: 'Performance Analytics',
      description: 'Bento-grid dashboards tracking scores, strengths, weaknesses, and progress across every UIU course.',
      gradient: 'bg-linear-to-br from-emerald-500 to-green-600',
    },
    {
      icon: RouteIcon,
      title: 'AI Learning Roadmaps',
      description: 'Generate personalized, interactive D3-powered study roadmaps. Visualize your path to mastering any topic.',
      gradient: 'bg-linear-to-br from-pink-500 to-rose-600',
    },
    {
      icon: TargetIcon,
      title: 'Adaptive Practice Quizzes',
      description: 'AI-generated quizzes targeting weak areas based on UIU curriculum. Instant feedback with detailed explanations.',
      gradient: 'bg-linear-to-br from-indigo-500 to-blue-600',
    },
    {
      icon: TrendingUpIcon,
      title: 'CGPA Prediction & Planning',
      description: 'Predict your CGPA trajectory, plan target grades, and get AI recommendations to reach your goals.',
      gradient: 'bg-linear-to-br from-teal-500 to-cyan-600',
    },
    {
      icon: CalendarIcon,
      title: 'Academic Calendar',
      description: 'UIU trimester calendars, exam schedules, class routines, and important deadline notifications.',
      gradient: 'bg-linear-to-br from-yellow-500 to-orange-600',
    },
    {
      icon: ClipboardListIcon,
      title: 'Smart Study Planner',
      description: 'AI-assisted study planning that accounts for your UIU course load and upcoming exams for optimal preparation.',
      gradient: 'bg-linear-to-br from-red-500 to-pink-600',
    },
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
    <div className="min-h-screen w-full bg-background text-foreground antialiased selection:bg-orange-500/20 selection:text-orange-600">
      {/* ── Scroll progress bar ──────────────────────────────────────────── */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-0.5 bg-linear-to-r from-orange-500 to-amber-500 z-60 origin-left pointer-events-none"
        style={{ scaleX: scrollScaleX }}
      />

      {/* ── Subtle gradient background ──────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] rounded-full bg-orange-500/5 blur-3xl" />
        <div className="absolute -bottom-60 -left-40 w-[600px] h-[600px] rounded-full bg-amber-500/4 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ── Top border accent ──────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-500/30 to-transparent z-50 pointer-events-none" />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <LandingHeader />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  HERO SECTION                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pt-36 pb-20 sm:pt-44 sm:pb-28 px-4 sm:px-6 overflow-hidden">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/8 px-4 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
              </span>
              Built exclusively for UIU Students
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl"
            >
              Your Intelligent{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-amber-400 to-orange-600">
                Academic Companion
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed"
            >
              COSMOS-ITS is a comprehensive AI-powered tutoring system built for United International University.
              Multi-agent orchestration, RAG over real UIU questions, personalized analytics — all in one place.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-3 pt-2"
            >
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Button
                    size="lg"
                    className="h-12 px-8 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all"
                  >
                    Start Learning Free <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              </Link>
              <a href="#features">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-8 text-sm font-medium rounded-full border-border/60 hover:border-orange-500/30 transition-all"
                >
                  Explore Features
                </Button>
              </a>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex items-center gap-3 pt-1"
            >
              <div className="flex -space-x-2">
                {(['bg-orange-500', 'bg-amber-500', 'bg-rose-500', 'bg-violet-500'] as const).map((bg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white',
                      bg,
                    )}
                  >
                    {['K', 'A', 'M', 'S'][i]}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Built by{' '}
                <Link href="/meet-the-team" className="font-semibold text-foreground hover:text-orange-500 transition-colors">
                  Team bcrypt
                </Link>{' '}
                — UIU CSE students
              </p>
            </motion.div>
          </div>

          {/* ── Floating feature preview cards ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-16 mx-auto max-w-3xl h-52 sm:h-60"
          >
            {/* Central panel */}
            <div className="absolute inset-x-8 sm:inset-x-16 top-0 bottom-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-md shadow-xl overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-orange-500/5 via-transparent to-amber-500/5" />
              <div className="flex flex-col gap-3 p-5 sm:p-6">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-xs text-muted-foreground font-mono">cosmos-ai → processing query...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-border/60" />
                  <div className="h-2 w-4/5 rounded-full bg-border/60" />
                  <div className="h-2 w-3/5 rounded-full bg-border/40" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {['CSE Agent', 'RAG Active', '5k+ Questions'].map((tag) => (
                    <span key={tag} className="text-[10px] px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {/* Floating cards */}
            <FloatingCard icon={BrainCircuitIcon} label="AI Agents" value="6+ Active" color="text-violet-500" top="4px" left="-4px" delay={0} />
            <FloatingCard icon={CheckCircle2Icon} label="Accuracy" value="~94%" color="text-emerald-500" top="8px" right="-4px" delay={1.2} />
            <FloatingCard icon={TrendingUpIcon} label="Progress tracked" value="Real-time" color="text-orange-500" bottom="0px" left="8px" delay={0.6} />
            <FloatingCard icon={GraduationCapIcon} label="UIU Courses" value="50+" color="text-blue-500" bottom="4px" right="8px" delay={1.8} />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  STATS BAR                                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 pb-16 sm:pb-20 px-4 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-4xl">
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border/40 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
              {[
                { icon: BookOpenIcon, value: 5000, suffix: '+', label: 'Questions Indexed' },
                { icon: BrainCircuitIcon, value: 6, suffix: '+', label: 'AI Agents' },
                { icon: GraduationCapIcon, value: 50, suffix: '+', label: 'UIU Courses' },
                { icon: UsersIcon, value: 100, suffix: '+', label: 'Active Students' },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  variants={itemVariants}
                  className="flex flex-col items-center gap-1.5 py-5 px-4"
                >
                  <stat.icon className="h-4 w-4 text-orange-500 mb-0.5" />
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-xs text-muted-foreground font-medium text-center">{stat.label}</p>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </FadeIn>
      </section>

      <SectionSeparator />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  FEATURES                                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Everything you need to excel at UIU
            </h2>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
              A comprehensive suite of AI-powered tools designed specifically for UIU students to study smarter, not harder.
            </p>
          </FadeIn>
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </StaggerContainer>
        </div>
      </section>

      <SectionSeparator />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  HOW IT WORKS                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Three steps to smarter studying
            </h2>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
              Get started in seconds — no setup required.
            </p>
          </FadeIn>
          <div className="relative">
            <div className="hidden sm:block absolute top-7 left-[16.7%] right-[16.7%] h-px bg-linear-to-r from-orange-500/40 via-orange-500/20 to-orange-500/40 z-0" />
            <StaggerContainer className="relative grid gap-10 sm:grid-cols-3 z-10">
              <StepCard step={1} icon={MousePointerClickIcon} title="Ask Anything" description="Type your question in natural language — our AI routes it to the best specialized agent for your UIU department." />
              <StepCard step={2} icon={BrainCircuitIcon} title="Get Smart Answers" description="Receive context-rich answers powered by RAG over real UIU exam questions, with citations and explanations." />
              <StepCard step={3} icon={TrendingUpIcon} title="Track & Improve" description="Monitor progress via analytics dashboards, adaptive quizzes, CGPA predictions, and personalized roadmaps." />
            </StaggerContainer>
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  TECH STACK                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="tech-stack" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Built With</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Modern technology stack
            </h2>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
              Production-grade frameworks and AI infrastructure engineered for reliability, speed, and intelligence.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <Marquee>
              {techStack.map((t) => (
                <TechBadge key={t.label} {...t} />
              ))}
            </Marquee>
          </FadeIn>
        </div>
      </section>

      <SectionSeparator />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  WHY UIU                                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="why-uiu" className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 scroll-mt-20">
        <div className="mx-auto max-w-5xl">
          <FadeIn className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 mb-3">Built for UIU</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-4">
              Why COSMOS-ITS for UIU?
            </h2>
            <p className="mx-auto max-w-xl text-sm sm:text-base text-muted-foreground">
              Tailored from the ground up to match UIU&apos;s unique academic structure.
            </p>
          </FadeIn>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              { icon: BookOpenIcon, title: 'UIU Exam Question Bank', desc: 'Indexed thousands of past mid & final exam questions across all UIU departments — searchable by course code, trimester, and topic.' },
              { icon: GraduationCapIcon, title: 'Trimester-Based System', desc: "Fully aligned with UIU's trimester calendar. Track credits, plan courses, and predict CGPA based on UIU's grading system." },
              { icon: AwardIcon, title: 'Department-Specific Agents', desc: 'Specialized AI agents for CSE, EEE, BBA, Civil, and more — each trained on department-specific curricula and question patterns.' },
              { icon: UsersIcon, title: 'By UIU Students, For UIU Students', desc: 'Built by Team bcrypt — passionate UIU CSE students who understand the challenges of their peers firsthand.' },
            ].map((item, i) => (
              <FadeIn key={item.title} delay={i * 0.08}>
                <motion.div
                  className="group relative rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm p-6 h-full overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5"
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-linear-to-br from-orange-500/4 via-transparent to-transparent rounded-2xl" />
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                    <item.icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <SectionSeparator />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/*  CTA BANNER                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-4xl">
            <motion.div
              className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 via-amber-500 to-orange-600 p-8 sm:p-14 text-center text-white shadow-2xl shadow-orange-500/20"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-white/10 blur-3xl pointer-events-none" />
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <GraduationCapIcon className="mx-auto h-10 w-10 mb-5 opacity-90" />
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Ready to transform your UIU journey?</h2>
                <p className="mx-auto max-w-md text-sm sm:text-base text-white/80 mb-8 leading-relaxed">
                  Join COSMOS-ITS today and experience the future of university learning — completely free for all UIU students.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                      <Button size="lg" className="h-12 px-8 text-sm font-semibold bg-white text-orange-600 hover:bg-white/90 rounded-full shadow-lg">
                        Create Free Account <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-medium rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white/30">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <LandingFooter />
    </div>
  );
}
