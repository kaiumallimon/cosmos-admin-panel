'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircleIcon, BookOpenIcon, Brain, Zap, ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";

export default function UserOverviewPage() {
  const { user } = useAuthStore();
  const { toggleMobileMenu } = useMobileMenu();

  const features = [
    {
      icon: <Brain className="h-6 w-6 text-[#007AFF]" />,
      title: "AI-Powered Answers",
      description: "Get instant answers to your course questions using our intelligent AI assistant.",
    },
    {
      icon: <BookOpenIcon className="h-6 w-6 text-[#007AFF]" />,
      title: "Past Exam Questions",
      description: "Access a comprehensive database of past exam questions across all courses.",
    },
    {
      icon: <Zap className="h-6 w-6 text-[#007AFF]" />,
      title: "Fast & Accurate",
      description: "Retrieval-augmented generation ensures answers are grounded in real course content.",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader
        title="Dashboard"
        onMobileMenuToggle={toggleMobileMenu}
        showSearch={false}
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Welcome Banner */}
          <div className="rounded-2xl bg-[#007AFF] text-white p-6 shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Welcome back{user.profile?.full_name ? `, ${user.profile.full_name.split(' ')[0]}` : ''}! 👋
                </h2>
                <p className="text-white/80 text-sm max-w-md">
                  Your AI study companion is ready. Ask anything about your courses, past exams, or study materials.
                </p>
              </div>
              <Badge className="bg-white/20 text-white border-white/30 shrink-0 mt-1">Student</Badge>
            </div>

            <div className="mt-5">
              <Button
                asChild
                className="bg-white text-[#007AFF] hover:bg-white/90 font-semibold gap-2"
              >
                <Link href="/user/chat">
                  <MessageCircleIcon className="h-4 w-4" />
                  Start Chatting
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: "AI Chat", value: "Available", sub: "Agentic assistant" },
              { label: "Questions DB", value: "Active", sub: "Past exam bank" },
              { label: "Courses", value: "Indexed", sub: "Full curriculum" },
            ].map((stat) => (
              <Card key={stat.label} className="border shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-lg font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Features */}
          <div>
            <h3 className="text-lg font-semibold mb-4">What you can do</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {features.map((feature) => (
                <Card key={feature.title} className="border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="mb-2">{feature.icon}</div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Card className="border-2 border-dashed border-[#007AFF]/30 bg-[#007AFF]/5">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">Ready to study smarter?</p>
                <p className="text-sm text-muted-foreground mt-0.5">Open the chat and ask your first question.</p>
              </div>
              <Button asChild className="bg-[#007AFF] hover:bg-[#0066CC] text-white shrink-0 gap-2">
                <Link href="/user/chat">
                  <MessageCircleIcon className="h-4 w-4" />
                  Open Chat
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
