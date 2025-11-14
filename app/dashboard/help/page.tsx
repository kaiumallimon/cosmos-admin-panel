'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
import { useState, useEffect } from "react";
import Link from "next/link";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";

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
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

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

  // Enhanced search utility functions
  const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/).filter(term => term.length > 0);

  const calculateRelevanceScore = (text: string, searchTerms: string[]): number => {
    const lowerText = text.toLowerCase();
    let score = 0;

    searchTerms.forEach(term => {
      // Exact phrase match (highest score)
      if (lowerText.includes(searchQuery.toLowerCase())) {
        score += 10;
      }
      // Word boundary match
      const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
      if (wordBoundaryRegex.test(text)) {
        score += 5;
      }
      // Partial match
      else if (lowerText.includes(term)) {
        score += 2;
      }
      // Fuzzy match (starts with)
      else if (lowerText.startsWith(term) || lowerText.includes(` ${term}`)) {
        score += 1;
      }
    });

    return score;
  };

  const searchInContent = (content: string[], searchTerms: string[]): number => {
    return content.reduce((maxScore, text) => {
      const score = calculateRelevanceScore(text, searchTerms);
      return Math.max(maxScore, score);
    }, 0);
  };

  // Enhanced FAQ filtering with relevance scoring
  const filteredFAQs = searchQuery ? faqs
    .map(faq => ({
      ...faq,
      relevanceScore: searchInContent(
        [faq.question, faq.answer, faq.category],
        searchTerms
      )
    }))
    .filter(faq => faq.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    : faqs;

  // Enhanced help sections filtering with relevance scoring
  const filteredHelpSections = searchQuery ? helpSections
    .map(section => {
      const sectionScore = searchInContent(
        [section.title, section.description],
        searchTerms
      );

      const itemsWithScores = section.items
        .map(item => ({
          ...item,
          relevanceScore: searchInContent(
            [item.title, item.description],
            searchTerms
          )
        }))
        .filter(item => item.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      const maxItemScore = itemsWithScores.length > 0
        ? Math.max(...itemsWithScores.map(item => item.relevanceScore))
        : 0;

      const totalScore = Math.max(sectionScore, maxItemScore);

      if (totalScore > 0) {
        return {
          ...section,
          items: sectionScore > 0 ? section.items : itemsWithScores,
          relevanceScore: totalScore
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore) as HelpSection[]
    : helpSections;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader
          title="Help & Support"
          subtitle="Find answers, guides, and documentation for Cosmos Admin Panel"
          onMobileMenuToggle={toggleMobileMenu}
        />

        {/* Page content with padding to avoid overlapping fixed header */}
        <div className="p-6">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>Help & Support</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="w-full space-y-8">

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
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="relative h-10 w-full justify-start text-sm text-muted-foreground pr-12"
                    onClick={() => setCommandOpen(true)}
                  >
                    <SearchIcon className="mr-2 h-4 w-4" />
                    Search help topics, features, or questions...
                    <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                      <span className="text-xs">{typeof navigator !== 'undefined' && navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'}</span>K
                    </kbd>
                  </Button>

                  {searchQuery && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                        <span>
                          Found {filteredHelpSections.reduce((acc, section) => acc + section.items.length, 0)} help topics
                          and {filteredFAQs.length} FAQs
                        </span>
                      </div>
                      {(filteredHelpSections.length > 0 || filteredFAQs.length > 0) && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                          ✓ Sorted by relevance
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Link href="/dashboard/add-question">
                    <Button variant="outline" className="justify-start h-auto p-4 w-full">
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <PlusIcon className="h-4 w-4" />
                          <span className="font-medium">Add Question</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Create new training content</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/dashboard/create-agent">
                    <Button variant="outline" className="justify-start h-auto p-4 w-full">
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <BotIcon className="h-4 w-4" />
                          <span className="font-medium">Create Agent</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Build AI assistants</span>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/dashboard/users/create">
                    <Button variant="outline" className="justify-start h-auto p-4 w-full">
                      <div className="flex flex-col items-start gap-1 w-full">
                        <div className="flex items-center gap-2">
                          <UserPlusIcon className="h-4 w-4" />
                          <span className="font-medium">Add User</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Register new users</span>
                      </div>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Feature Documentation */}
            {filteredHelpSections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredHelpSections.map((section) => (
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
                                  <Link href={item.link}>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <ExternalLinkIcon className="h-3 w-3" />
                                    </Button>
                                  </Link>
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
            ) : searchQuery && (
              <Card className="border-border/50 shadow-sm">
                <CardContent className="text-center py-12">
                  <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No help topics found</h3>
                  <p className="text-muted-foreground">
                    Try searching with different keywords or browse the categories above.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* FAQ Section */}
            <Card className="border-border/50 shadow-sm" data-faq-section>
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
                {filteredFAQs.length > 0 ? (
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
                ) : searchQuery ? (
                  <div className="text-center py-8">
                    <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No FAQs found</h3>
                    <p className="text-muted-foreground">
                      No frequently asked questions match your search query.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {faqs.map((faq, index) => (
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
                )}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

        {/* Command Dialog for Search */}
        <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
          <CommandInput
            placeholder="Search help topics, features, or questions..."
            onValueChange={(value) => {
              // Update the search query in real-time for better UX
              if (value !== searchQuery) {
                setSearchQuery(value);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>
              <div className="text-center py-6">
                <SearchIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No results found. Try different keywords or check spelling.
                </p>
              </div>
            </CommandEmpty>

            <CommandGroup heading="Quick Actions">
              <CommandItem
                onSelect={() => {
                  setCommandOpen(false);
                  window.location.href = "/dashboard/add-question";
                }}
                keywords={["question", "create", "add", "training", "content"]}
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Add Question</div>
                  <div className="text-xs text-muted-foreground">Create new training content</div>
                </div>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setCommandOpen(false);
                  window.location.href = "/dashboard/create-agent";
                }}
                keywords={["agent", "ai", "bot", "create", "assistant"]}
              >
                <BotIcon className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Create Agent</div>
                  <div className="text-xs text-muted-foreground">Build AI assistants</div>
                </div>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setCommandOpen(false);
                  window.location.href = "/dashboard/users/create";
                }}
                keywords={["user", "add", "create", "invite", "member"]}
              >
                <UserPlusIcon className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Add User</div>
                  <div className="text-xs text-muted-foreground">Invite team members</div>
                </div>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setCommandOpen(false);
                  window.location.href = "/dashboard/upload";
                }}
                keywords={["upload", "content", "file", "document", "material"]}
              >
                <UploadIcon className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Upload Content</div>
                  <div className="text-xs text-muted-foreground">Add training materials</div>
                </div>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  setCommandOpen(false);
                  window.location.href = "/dashboard/settings";
                }}
                keywords={["settings", "preferences", "config", "theme", "account"]}
              >
                <SettingsIcon className="mr-2 h-4 w-4" />
                <div>
                  <div className="font-medium">Settings</div>
                  <div className="text-xs text-muted-foreground">Configure preferences</div>
                </div>
              </CommandItem>
            </CommandGroup>

            {helpSections.map((section) => (
              <CommandGroup key={section.id} heading={section.title}>
                {section.items.map((item, index) => (
                  <CommandItem
                    key={index}
                    onSelect={() => {
                      setCommandOpen(false);
                      if (item.link) {
                        window.location.href = item.link;
                      }
                    }}
                  >
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground">{item.description}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}

            <CommandSeparator />

            <CommandGroup heading="Frequently Asked Questions">
              {(searchQuery ? filteredFAQs : faqs.slice(0, 8)).map((faq, index) => {
                const originalIndex = faqs.findIndex(f => f.question === faq.question);
                return (
                  <CommandItem
                    key={originalIndex}
                    onSelect={() => {
                      setCommandOpen(false);
                      setSearchQuery('');
                      setExpandedFAQ(originalIndex);
                      // Scroll to FAQ section
                      setTimeout(() => {
                        const faqSection = document.querySelector('[data-faq-section]');
                        if (faqSection) {
                          faqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                      }, 100);
                    }}
                    keywords={[faq.question, faq.answer, faq.category].join(' ').toLowerCase().split(' ')}
                  >
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{faq.question}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm">
                          {faq.category}
                        </span>
                        {(faq as any).relevanceScore > 0 && (
                          <span className="text-green-600 dark:text-green-400">✓ Relevant</span>
                        )}
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
              {!searchQuery && faqs.length > 8 && (
                <CommandItem disabled>
                  <div className="text-xs text-muted-foreground italic ml-6">
                    ...and {faqs.length - 8} more FAQs. Use search to find specific questions.
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </div>
    </ProtectedRoute>
  );
}

