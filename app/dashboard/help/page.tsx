'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  HomeIcon,
  UsersIcon,
  SettingsIcon,
  HelpCircleIcon,
  SearchIcon,
  BookOpenIcon,
  UploadIcon,
  PlusIcon,
  Code2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExternalLinkIcon,
  BarChart3Icon,
  ShieldIcon,
  MessageCircleIcon,
  MailIcon,
  FileTextIcon,
  GraduationCapIcon,
  MonitorIcon,
  UserPlusIcon,
  BotIcon,
  DatabaseIcon,
  HelpCircle,
  CheckCircleIcon
} from "lucide-react";
import { IconRobot } from "@tabler/icons-react";
import { useState } from "react";
import Link from "next/link";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  items: {
    title: string;
    description: string;
    link?: string;
  }[];
}

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const { toggleMobileMenu } = useMobileMenu();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const helpSections: HelpSection[] = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: <GraduationCapIcon className="h-5 w-5" />,
      description: "Learn the basics of using Cosmos Admin Panel",
      items: [
        {
          title: "Dashboard Overview",
          description: "Understand the main dashboard interface and navigation",
          link: "/dashboard"
        },
        {
          title: "User Roles & Permissions",
          description: "Learn about different user roles and what they can access"
        },
        {
          title: "Quick Setup Guide",
          description: "Step-by-step guide to get started with the platform"
        }
      ]
    },
    {
      id: "training-management",
      title: "Training Management",
      icon: <BookOpenIcon className="h-5 w-5" />,
      description: "Manage questions, content, and learning materials",
      items: [
        {
          title: "Adding Questions",
          description: "How to create and organize training questions",
          link: "/dashboard/add-question"
        },
        {
          title: "Managing Questions",
          description: "Edit, categorize, and organize existing questions",
          link: "/dashboard/questions"
        },
        {
          title: "Content Upload",
          description: "Upload training materials and media files",
          link: "/dashboard/upload"
        },
        {
          title: "Content Management",
          description: "Organize and manage uploaded content",
          link: "/dashboard/contents"
        },
        {
          title: "Update Embeddings",
          description: "Keep content searchable with updated embeddings",
          link: "/dashboard/update-embeddings"
        }
      ]
    },
    {
      id: "agent-management",
      title: "Agent Management",
      icon: <IconRobot className="h-5 w-5" />,
      description: "Create and manage AI agents for training assistance",
      items: [
        {
          title: "Creating Agents",
          description: "Build custom AI agents with specific capabilities",
          link: "/dashboard/create-agent"
        },
        {
          title: "Managing Agents",
          description: "Configure, monitor, and maintain your AI agents",
          link: "/dashboard/agents"
        },
        {
          title: "Agent Tools & Capabilities",
          description: "Understanding different agent tools and configurations"
        },
        {
          title: "Best Practices",
          description: "Tips for creating effective training agents"
        }
      ]
    },
    {
      id: "user-management",
      title: "User Management",
      icon: <UsersIcon className="h-5 w-5" />,
      description: "Manage users, roles, and access permissions",
      items: [
        {
          title: "User Overview",
          description: "View and manage all platform users",
          link: "/dashboard/users"
        },
        {
          title: "Creating Users",
          description: "Add new users to the platform",
          link: "/dashboard/users/create"
        },
        {
          title: "User Roles",
          description: "Understand different user roles and permissions"
        },
        {
          title: "Password Management",
          description: "Reset passwords and manage user authentication"
        }
      ]
    },
    {
      id: "system-settings",
      title: "System Settings",
      icon: <SettingsIcon className="h-5 w-5" />,
      description: "Configure system preferences and personalization",
      items: [
        {
          title: "General Settings",
          description: "Configure basic system preferences",
          link: "/dashboard/settings"
        },
        {
          title: "Theme Customization",
          description: "Switch between light, dark, and system themes"
        },
        {
          title: "Notification Settings",
          description: "Manage email updates and system notifications"
        },
        {
          title: "Security Settings",
          description: "Configure authentication and security features"
        }
      ]
    }
  ];

  const faqs: FAQ[] = [
    {
      question: "How do I add a new training question?",
      answer: "Navigate to 'Add Question' from the sidebar, fill in the question details including subject, course, term, and trimester information, then save. You can also upload questions in bulk using the upload feature.",
      category: "Training"
    },
    {
      question: "What file formats are supported for content upload?",
      answer: "The platform supports various file formats including PDF, DOC, DOCX, images (PNG, JPG, JPEG), and other common document formats. Check the upload page for specific file size limits.",
      category: "Content"
    },
    {
      question: "How do I create a new AI agent?",
      answer: "Go to 'Create Agent' in the sidebar, provide a name and description, configure the system prompt, and select appropriate tools. You can also add few-shot examples to improve agent performance.",
      category: "Agents"
    },
    {
      question: "Can I reset a user's password?",
      answer: "Yes, administrators can reset user passwords by going to the Users section, selecting a specific user, and using the password reset functionality.",
      category: "Users"
    },
    {
      question: "How do embeddings work and when should I update them?",
      answer: "Embeddings make content searchable and help agents understand context. Update embeddings when you add new content or notice search results becoming less accurate.",
      category: "Technical"
    },
    {
      question: "How do I change the theme of the dashboard?",
      answer: "You can change themes using the theme toggle in the sidebar footer or by going to Settings. Choose from light, dark, or system themes.",
      category: "Interface"
    },
    {
      question: "What are the different user roles available?",
      answer: "The platform typically includes roles like Admin (full access), Instructor (content management), and Viewer (read-only access). Specific permissions may vary based on configuration.",
      category: "Users"
    },
    {
      question: "How do I troubleshoot agent performance issues?",
      answer: "Check the agent's system prompt, ensure tools are properly configured, review few-shot examples, and monitor agent statistics in the Agents section.",
      category: "Agents"
    }
  ];

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader 
          title="Help & Support" 
          subtitle="Find answers, guides, and documentation for Cosmos Admin Panel"
          onMobileMenuToggle={toggleMobileMenu}
        />

        {/* Page content with padding to avoid overlapping fixed header */}
        <div className="pt-10 px-6 md:px-10 pb-10">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Quick Actions */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <SearchIcon className="h-5 w-5 text-primary" />
                  </div>
                  Quick Help
                </CardTitle>
                <CardDescription>
                  Search our knowledge base or jump to common tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search help topics, features, or questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button variant="outline" className="justify-start h-auto p-4" asChild>
                    <Link href="/dashboard/add-question">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <PlusIcon className="h-4 w-4" />
                          <span className="font-medium">Add Question</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Create new training content</span>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4" asChild>
                    <Link href="/dashboard/create-agent">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <BotIcon className="h-4 w-4" />
                          <span className="font-medium">Create Agent</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Build AI assistants</span>
                      </div>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="justify-start h-auto p-4" asChild>
                    <Link href="/dashboard/users/create">
                      <div className="flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <UserPlusIcon className="h-4 w-4" />
                          <span className="font-medium">Add User</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Invite team members</span>
                      </div>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Feature Documentation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {helpSections.map((section) => (
                <Card key={section.id} className="border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        {section.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{section.title}</CardTitle>
                        <CardDescription>
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {section.items.map((item, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                          <CheckCircleIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm">{item.title}</h4>
                              {item.link && (
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" asChild>
                                  <Link href={item.link}>
                                    <ExternalLinkIcon className="h-3 w-3" />
                                  </Link>
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* FAQ Section */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
                    <CardDescription>
                      Common questions and answers about using the platform
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredFAQs.map((faq, index) => (
                    <div key={index} className="border border-border/50 rounded-lg">
                      <button
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
                        onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              {faq.category}
                            </span>
                          </div>
                          <h4 className="font-medium">{faq.question}</h4>
                        </div>
                        {expandedFAQ === index ? (
                          <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {expandedFAQ === index && (
                        <div className="px-4 pb-4">
                          <Separator className="mb-3" />
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageCircleIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Need More Help?</CardTitle>
                    <CardDescription>
                      Can't find what you're looking for? Get in touch with our support team
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <MailIcon className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Email Support</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Get detailed help via email support
                      </p>
                      <Button variant="outline" size="sm">
                        Contact Support
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <FileTextIcon className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <h4 className="font-medium mb-1">Documentation</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Detailed technical documentation
                      </p>
                      <Button variant="outline" size="sm">
                        View Docs
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

