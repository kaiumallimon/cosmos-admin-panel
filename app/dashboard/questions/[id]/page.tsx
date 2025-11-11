'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";

export default function QuestionsCourseMenuPage() {
    const params = useParams(); // { id: "CSE-1115" }
    const courseId = params.id;
    const router = useRouter();
    const { toggleMobileMenu } = useMobileMenu();

    const cards = [
        {
            key: 1,
            title: "Update Embeddings",
            description: "Regenerate question embeddings from database in Pinecone.",
        },
        {
            key: 2,
            title: "View Questions",
            description: "Browse and manage questions for this course.",
        },
        {
            key: 3,
            title: "Browse Trimester-Wise Questions",
            description: "Explore questions categorized by trimester for this course.",
        }
    ]

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                {/* glass header */}
                <FrostedHeader title={`Menu for ${courseId} Questions`} onMobileMenuToggle={toggleMobileMenu} />
                 {/* menu cards */}
                 <div className="p-6">
                    {cards.map((card)=>{
                        return (
                            <Card key={card.key}
                            className="mt-3 cursor-pointer hover:border-primary transition-colors duration-300"
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