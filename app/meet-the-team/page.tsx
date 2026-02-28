'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  motion,
  useInView,
} from 'motion/react';
import {
  SparklesIcon,
  UsersIcon,
  ShieldCheckIcon,
  CodeIcon,
  ServerIcon,
  BrainCircuitIcon,
  LayoutDashboardIcon,
  CrownIcon,
  ArrowRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import LandingHeader from '@/components/landing/landing-header';
import LandingFooter from '@/components/landing/landing-footer';
import SectionSeparator from '@/components/landing/section-separator';

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
            <div className={cn('relative aspect-4/3 md:aspect-auto md:h-full overflow-hidden bg-linear-to-br', member.gradient)}>
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-black/10 z-10" />
              <Image
                src={member.image}
                alt={member.name}
                unoptimized
                className="object-cover "
                width={400}
                height={400}
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
  return (
    <div className="min-h-screen w-full bg-background text-foreground antialiased">
      {/* ── Gradient background ─────────────────────────────────────────── */}
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
      <div className="fixed top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-orange-500/30 to-transparent z-50 pointer-events-none" />

      <LandingHeader />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-36 pb-16 sm:pt-44 sm:pb-20 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl text-center">
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
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            Team bcrypt — UIU CSE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5"
          >
            Meet the{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-amber-400 to-orange-600">
              Team
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto max-w-lg text-base text-muted-foreground leading-relaxed"
          >
            We are <span className="font-semibold text-foreground">Team bcrypt</span> — passionate
            Computer Science &amp; Engineering students from United International University, Dhaka.
            Together, we built COSMOS-ITS to transform how UIU students learn and excel.
          </motion.p>
        </div>
      </section>

      <SectionSeparator />

      {/* ── Team members ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {team.map((member, i) => (
            <MemberCard key={member.name} member={member} index={i} />
          ))}
        </div>
      </section>

      <SectionSeparator />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-24 px-4 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-3xl">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 to-amber-500 p-8 sm:p-14 text-center text-white shadow-2xl shadow-orange-500/20">
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
              {/* Subtle grid overlay */}
              <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <SparklesIcon className="mx-auto h-10 w-10 mb-5 opacity-90" />
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3">Want to try what we built?</h2>
                <p className="mx-auto max-w-sm text-sm text-white/80 mb-8">
                  Experience COSMOS-ITS — the AI-powered tutoring system built with passion by UIU students for UIU students.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-12 px-8 text-sm font-semibold bg-white text-orange-600 hover:bg-white/90 rounded-full shadow-lg">
                        Get Started Free <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" size="lg" className="h-12 px-8 text-sm font-medium rounded-full border-white/30 text-white hover:bg-white/10 hover:text-white">
                      Back to Home
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <LandingFooter />
    </div>
  );
}
