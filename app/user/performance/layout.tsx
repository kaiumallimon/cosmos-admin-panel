'use client';

import { FrostedHeader } from '@/components/custom/frosted-header';
import { useMobileMenu } from '@/components/mobile-menu-context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { label: 'Overview', href: '/user/performance' },
  { label: 'My Courses', href: '/user/performance/courses' },
  { label: 'Assessments', href: '/user/performance/assessments' },
  { label: 'Weaknesses', href: '/user/performance/weaknesses' },
  { label: 'Quiz', href: '/user/performance/quiz' },
  { label: 'Predict', href: '/user/performance/predict' },
];

export default function PerformanceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { toggleMobileMenu } = useMobileMenu();

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader
        title="Performance Tracker"
        subtitle="Track your academic progress and predict your grades"
        onMobileMenuToggle={toggleMobileMenu}
        showSearch={false}
      />

      {/* Secondary Tab Bar */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm shrink-0 sticky top-0 z-10">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {TABS.map((tab) => {
            const isActive =
              tab.href === '/user/performance'
                ? pathname === '/user/performance'
                : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#007AFF] text-[#007AFF]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-muted/20">
        {children}
      </div>
    </div>
  );
}
