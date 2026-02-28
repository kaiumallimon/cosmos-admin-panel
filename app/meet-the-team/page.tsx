'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { DottedGlowBackground } from '@/components/ui/dotted-glow-background';
import { Button } from '@/components/ui/button';
import {
  motion,
  useInView,
  AnimatePresence,
} from 'motion/react';
import {
  SparklesIcon,
  ArrowLeftIcon,
  SunIcon,
  MoonIcon,
  GithubIcon,
  CodeIcon,
  ServerIcon,
  UsersIcon,
  BrainCircuitIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  CrownIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  ANIMATION HELPERS                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  TEAM DATA                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface TeamMember {
  name: string;
  role: string;
  image: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}

const team: TeamMember[] = [
  {
    name: 'Kaium Al Limon',
    role: 'Software Engineer (Full-Stack, Cross Platform)',
    image: '/kaium-al-limon.png',
    description:
      'Architected and built the entire COSMOS-ITS platform end-to-end — from the multi-agent AI backend and RAG pipeline to the responsive frontend with bento-grid dashboards. Specializes in full-stack TypeScript, cross-platform development, and AI-integrated systems.',
    icon: CodeIcon,
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    name: 'Kamrul Islam Arnob',
    role: 'Backend Developer & Project Team Lead',
    image: '/arnob.jpg',
    description:
      'Led the backend development effort and coordinated the engineering team. Designed the API architecture, implemented authentication flows with JWT + bcrypt, and built the question indexing pipeline that powers semantic search across thousands of UIU exam questions.',
    icon: ServerIcon,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    name: 'Abdullah Al Masud',
    role: 'Team Lead & Project Manager',
    image: '/masud.jpg',
    description:
      'Provided strategic leadership and managed the project lifecycle from ideation to deployment. Coordinated cross-functional collaboration, defined milestones, and ensured the team delivered a production-ready system aligned with UIU students\' real academic needs.',
    icon: CrownIcon,
    gradient: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'Sadik Mahmud',
    role: 'Backend Developer',
    image: '/sadik.jpg',
    description:
      'Contributed to the backend infrastructure including database schema design, MongoDB aggregation pipelines, and API endpoint development. Worked on the system logging service and helped optimize query performance for the question bank retrieval system.',
    icon: ShieldCheckIcon,
    gradient: 'from-emerald-500 to-green-600',
  },
  {
    name: 'Musfiqur Rahman',
    role: 'Researcher',
    image: '/musfiq.jpg',
    description:
      'Conducted extensive research on multi-agent AI orchestration, retrieval-augmented generation techniques, and educational technology best practices. His findings on prompt engineering and few-shot learning directly shaped the AI agent configuration system.',
    icon: BrainCircuitIcon,
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    name: 'Mahfuz Hasan',
    role: 'Frontend Developer',
    image: '/mahfuz.jpg',
    description:
      'Contributed to the frontend UI development, working on responsive components and user-facing interfaces. Helped implement the dashboard visualizations and ensured a smooth, accessible experience across different devices and screen sizes.',
    icon: LayoutDashboardIcon,
    gradient: 'from-indigo-500 to-blue-600',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MEMBER CARD (alternating layout)                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const isEven = index % 2 === 0; // even = image right, odd = image left

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div
        className={cn(
          'relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5',
        )}
      >
        <div
          className={cn(
            'flex flex-col gap-0',
            isEven ? 'md:flex-row' : 'md:flex-row-reverse',
          )}
        >
          {/* Image side */}
          <div className="relative w-full md:w-[45%] shrink-0">
            <div className={cn('relative aspect-[4/3] md:aspect-auto md:h-full overflow-hidden bg-linear-to-br', member.gradient)}>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-black/10 z-10" />
              <Image
                src={member.image}
                alt={member.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
              {/* Role icon badge */}
              <motion.div
                className="absolute top-4 right-4 z-20 h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center"
                whileHover={{ scale: 1.15, rotate: 10 }}
              >
                <member.icon className="h-5 w-5 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Info side */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-center">
            <div className="mb-3">
              <div className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white bg-linear-to-r', member.gradient)}>
                <member.icon className="h-3 w-3" />
                {member.role.split('&')[0].split('+')[0].trim()}
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1.5">
              {member.name}
            </h3>
            <p className="text-sm font-medium text-orange-500 mb-4">
              {member.role}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {member.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MAIN PAGE                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function MeetTheTeamPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-background text-foreground">
      {/* Background */}
      <DottedGlowBackground
        className="pointer-events-none fixed inset-0 z-0 mask-radial-to-90% mask-radial-at-center"
        opacity={0.35}
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
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 sm:px-6 h-16">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                <ArrowLeftIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Home</span>
              </Button>
            </Link>
            <div className="h-4 w-px bg-border/60 hidden sm:block" />
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                className="h-7 w-7 rounded-lg bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm"
                whileHover={{ rotate: 180, scale: 1.1 }}
                transition={{ duration: 0.4 }}
              >
                <SparklesIcon className="h-3.5 w-3.5 text-white" />
              </motion.div>
              <span className="text-sm font-bold tracking-tight text-foreground">
                COSMOS<span className="text-orange-500">-ITS</span>
              </span>
            </Link>
          </div>

          {mounted && (
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')} aria-label="Toggle theme">
              <AnimatePresence mode="wait">
                <motion.div key={resolvedTheme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  {resolvedTheme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                </motion.div>
              </AnimatePresence>
            </Button>
          )}
        </div>
      </motion.nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="mb-6 mx-auto h-16 w-16 rounded-2xl bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20"
          >
            <UsersIcon className="h-8 w-8 text-white" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400"
          >
            <ShieldCheckIcon className="h-3.5 w-3.5" />
            Team bcrypt
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.1] mb-5"
          >
            Meet the{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-amber-500 to-orange-600">
              Team
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto max-w-lg text-base text-muted-foreground leading-relaxed"
          >
            We are <span className="font-semibold text-foreground">Team bcrypt</span> — a group of passionate
            Computer Science &amp; Engineering students from United International University, Dhaka.
            Together, we built COSMOS-ITS to transform how UIU students learn and excel.
          </motion.p>
        </div>
      </section>

      {/* ── Team members ───────────────────────────────────────────────────── */}
      <section className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {team.map((member, i) => (
            <MemberCard key={member.name} member={member} index={i} />
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pb-20 sm:pb-28 px-4 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-amber-500 p-8 sm:p-12 text-center text-white shadow-2xl shadow-orange-500/20">
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              <div className="relative z-10">
                <h2 className="text-xl sm:text-2xl font-bold mb-3">Want to try what we built?</h2>
                <p className="mx-auto max-w-sm text-sm text-white/80 mb-6">
                  Experience COSMOS-ITS — the AI-powered tutoring system built with passion by UIU students for UIU students.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-11 px-7 text-sm font-semibold bg-white text-orange-600 hover:bg-white/90 rounded-xl shadow-lg">
                        Get Started Free
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" size="lg" className="h-11 px-7 text-sm font-medium rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-border/40 bg-background/70 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-linear-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <SparklesIcon className="h-3 w-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                COSMOS<span className="text-orange-500">-ITS</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Team bcrypt &middot; United International University
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
