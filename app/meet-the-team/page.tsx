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
  CodeIcon,
  ServerIcon,
  BrainCircuitIcon,
  LayoutDashboardIcon,
  CrownIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  GlobeIcon,
  ZapIcon,
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
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
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
  gradientFrom: string;
  gradientTo: string;
}

const team: TeamMember[] = [
  {
    name: 'Kaium Al Limon',
    role: 'Software Engineer (Full-Stack, Cross Platform)',
    image: '/bordered.png',
    description:
      'Architected and built the entire COSMOS-ITS platform end-to-end — from the multi-agent AI backend (LangChain, LangGraph, FastAPI) and RAG pipeline to the responsive Next.js frontend. Specializes in full-stack TypeScript, Python, cross-platform development, and AI-integrated systems.',
    icon: CodeIcon,
    gradient: 'from-orange-500 to-amber-500',
    gradientFrom: 'rgb(249 115 22)',
    gradientTo: 'rgb(245 158 11)',
  },
  {
    name: 'Kamrul Islam Arnob',
    role: 'Backend Developer & Project Team Lead',
    image: '/arnob.jpg',
    description:
      'Led the backend development effort and coordinated the engineering team. Designed the FastAPI service architecture, implemented authentication flows with JWT + bcrypt, and built the question indexing pipeline that powers semantic search across thousands of UIU exam questions.',
    icon: ServerIcon,
    gradient: 'from-violet-500 to-purple-600',
    gradientFrom: 'rgb(139 92 246)',
    gradientTo: 'rgb(147 51 234)',
  },
  {
    name: 'Abdullah Al Masud',
    role: 'Team Lead & Project Manager',
    image: '/masud.jpg',
    description:
      'Provided strategic leadership and managed the project lifecycle from ideation to deployment. Coordinated cross-functional collaboration, defined milestones, and ensured the team delivered a production-ready system aligned with UIU students\' real academic needs.',
    icon: CrownIcon,
    gradient: 'from-blue-500 to-cyan-600',
    gradientFrom: 'rgb(59 130 246)',
    gradientTo: 'rgb(8 145 178)',
  },
  {
    name: 'Sadik Mahmud',
    role: 'Backend Developer',
    image: '/sadik.jpg',
    description:
      'Contributed to the backend infrastructure including database schema design, MongoDB aggregation pipelines, and API endpoint development. Worked on the system logging service and helped optimize query performance for the question bank retrieval system.',
    icon: ShieldCheckIcon,
    gradient: 'from-emerald-500 to-green-600',
    gradientFrom: 'rgb(16 185 129)',
    gradientTo: 'rgb(22 163 74)',
  },
  {
    name: 'Musfiqur Rahman',
    role: 'Researcher',
    image: '/musfiq.jpg',
    description:
      'Conducted extensive research on multi-agent AI orchestration, retrieval-augmented generation techniques, and educational technology best practices. His findings on prompt engineering and few-shot learning directly shaped the AI agent configuration system.',
    icon: BrainCircuitIcon,
    gradient: 'from-pink-500 to-rose-600',
    gradientFrom: 'rgb(236 72 153)',
    gradientTo: 'rgb(225 29 72)',
  },
  {
    name: 'Mahfuz Hasan',
    role: 'Frontend Developer',
    image: '/mahfuz.jpg',
    description:
      'Contributed to the frontend UI development, working on responsive components and user-facing interfaces. Helped implement the dashboard visualizations and ensured a smooth, accessible experience across different devices and screen sizes.',
    icon: LayoutDashboardIcon,
    gradient: 'from-indigo-500 to-blue-600',
    gradientFrom: 'rgb(99 102 241)',
    gradientTo: 'rgb(37 99 235)',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  MEMBER CARD                                                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay: (index % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col rounded-2xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-transparent hover:shadow-xl"
      style={{
        ['--hover-shadow' as string]: `0 20px 40px ${member.gradientFrom}15`,
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      {/* Hover glow border */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ boxShadow: `inset 0 0 0 1px ${member.gradientFrom}40` }}
      />

      {/* Image */}
      <div className={cn('relative h-72 w-full overflow-hidden bg-linear-to-br', member.gradient)}>
        <Image
          src={member.image}
          alt={member.name}
          unoptimized
          fill
          className="object-cover  group-hover:scale-105 transition-transform duration-500"
        />
        {/* Bottom fade */}
        <div className="absolute inset-0 bg-linear-to-t from-card/40 via-transparent to-transparent" />
        {/* Number */}
        <div className="absolute top-3.5 left-3.5 h-7 w-7 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-[10px] font-bold text-white">
          {String(index + 1).padStart(2, '0')}
        </div>

        {/* Icon badge */}
        <motion.div
          className="absolute top-3.5 right-3.5 h-8 w-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center"
          whileHover={{ scale: 1.15, rotate: 10 }}
        >
          <member.icon className="h-4 w-4 text-white" />
        </motion.div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground leading-tight">{member.name}</h3>
          <p className="text-xs font-medium mt-0.5" style={{ color: member.gradientFrom }}>{member.role}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed flex-1">{member.description}</p>

        {/* Bottom gradient accent */}
        <div className={cn('h-0.5 w-12 rounded-full bg-linear-to-r mt-1 group-hover:w-full transition-all duration-500', member.gradient)} />
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
      <section className="relative z-10 pt-36 pb-12 sm:pt-44 sm:pb-16 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/5 px-4 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            Team bcrypt — UIU CSE
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]"
          >
            The people behind{' '}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-orange-500 via-amber-400 to-orange-600">
              COSMOS-ITS
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mx-auto max-w-xl text-base text-muted-foreground leading-relaxed"
          >
            We are <span className="font-semibold text-foreground">Team bcrypt</span> — passionate
            CSE students from United International University who built COSMOS-ITS to transform how peers learn and excel.
          </motion.p>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-6 pt-2"
          >
            {[
              { icon: UsersIcon, label: '6 Members' },
              { icon: GlobeIcon, label: 'UIU, Dhaka' },
              { icon: ZapIcon, label: 'Full-Stack AI System' },
              { icon: SparklesIcon, label: 'Built from Scratch' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-orange-500" />
                {label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <SectionSeparator />

      {/* ── Team grid ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-16 pb-16 sm:pt-20 sm:pb-24 px-4 sm:px-6">
        <div className="mx-auto max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {team.map((member, i) => (
            <MemberCard key={member.name} member={member} index={i} />
          ))}
        </div>
      </section>

      <SectionSeparator />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-14 sm:py-18 px-4 sm:px-6">
        <FadeIn>
          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-500 via-orange-500 to-amber-400 p-8 sm:p-14 text-center text-white shadow-2xl shadow-orange-500/30 ring-1 ring-white/10">
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />
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
                <h2 className="text-2xl sm:text-4xl font-extrabold mb-3 drop-shadow-sm">Want to try what we built?</h2>
                <p className="mx-auto max-w-sm text-sm text-white/90 mb-8">
                  Experience COSMOS-ITS — the AI-powered tutoring system built with passion by UIU students, for UIU students.
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
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="h-12 px-8 text-sm font-semibold rounded-full bg-white/15 border border-white/50 text-white hover:bg-white/25 hover:border-white/80 shadow-md backdrop-blur-sm transition-all duration-200">
                        Back to Home
                      </Button>
                    </motion.div>
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
