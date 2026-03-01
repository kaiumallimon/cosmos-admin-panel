'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { useParams, useRouter } from "next/navigation";

export default function QuestionsCourseMenuPage() {
    const params = useParams(); // { id: "CSE-1115" }
    const courseId = params.id;
    const router = useRouter();
    const { toggleMobileMenu } = useMobileMenu();

    const cards = [

        {
            key: 1,
            title: "Midterm Questions",
            description: "Browse and manage questions for this course.",
            href: `/admin/questions/${courseId}/mid`,
        },
        {
            key: 2,
            title: "Final Questions",
            description: "Explore questions categorized by trimester for this course.",
            href: `/admin/questions/${courseId}/final`,
        }
    ]

    function formatCourseCode(code?: string | string[]) {
        const str = Array.isArray(code) ? code.join("-") : (code ?? "");
        return str.replace(/%20/g, "-");
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                {/* glass header */}
                <FrostedHeader title={`Menu for ${formatCourseCode(courseId)} Questions`} onMobileMenuToggle={toggleMobileMenu} />

                {/* breadcrumbs */}
                <div className="p-6 pb-0">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin">Dashboard</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/admin/questions">Questions</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{formatCourseCode(courseId)}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>

                 {/* menu cards */}
                 <div className="p-6">
                    {cards.map((card)=>{
                        return (
                            <Card key={card.key}
                            className="mt-3 cursor-pointer hover:border-primary transition-colors duration-300"
                            onClick={() => router.push(card.href)}
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg font-bold">{card.title}</CardTitle>
                                    <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                                </CardHeader>
                            </Card>
                        );
                    })}
                 </div>
            </div>
        </ProtectedRoute>
    );
}