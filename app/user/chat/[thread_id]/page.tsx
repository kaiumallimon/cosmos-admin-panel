'use client';

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ArrowRight, Bot, FileText, X, Copy, Check, Loader2, BookOpen, Brain, ScrollText, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"] });

interface Message {
  role: "human" | "ai";
  content: string;
  metadata?: any;
  agent_name?: string;
  agent_display_name?: string;
}

interface Thread {
  thread_id: string;
  messages: Message[];
  total: number;
}

interface QuestionMetadata {
  id: number;
  course_code: string;
  course_title: string;
  exam_type: string;
  question_number: string;
  sub_question?: string;
  marks?: number;
  total_question_mark?: number;
  contribution_percentage?: number;
  has_image?: boolean;
  image_type?: string;
  image_url?: string;
  has_description?: boolean;
  description_content?: string;
  question: string;
  pdf_url?: string;
  created_at?: string;
  semester_term?: string;
}

const CodeBlock = ({ content, language }: { content: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(content.trimEnd());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="my-3 rounded-lg border border-border overflow-hidden">
      <div className="flex items-center justify-between px-3 h-8 bg-muted/60 border-b border-border">
        <span className={`text-[11px] text-muted-foreground/70 ${jetbrainsMono.className}`}>
          {language ?? 'plaintext'}
        </span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors ${copied ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className={`bg-muted/30 dark:bg-muted/60 !px-4 !py-3.5 overflow-x-auto text-[13px] leading-relaxed text-foreground m-0 ${jetbrainsMono.className}`}>
        <code>{content.trimEnd()}</code>
      </pre>
    </div>
  );
};

const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const content = String(Array.isArray(children) ? children.join('') : children ?? '');
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : undefined;
    const isBlock = !inline && (content.includes('\n') || !!className);
    if (!isBlock) {
      return (
        <code className={`${jetbrainsMono.className} text-[0.875em] bg-muted/70 px-1.5 py-0.5 rounded text-orange-500 dark:text-orange-400 font-medium`}>
          {content}
        </code>
      );
    }
    return <CodeBlock content={content} language={language} />;
  },
  p({ children, ...props }: any) {
    return <p className="my-2" {...props}>{children}</p>;
  },
  h1({ children, ...props }: any) {
    return <h1 className="text-2xl font-bold mt-6 mb-3 tracking-tight text-primary" {...props}>{children}</h1>;
  },
  h2({ children, ...props }: any) {
    return <h2 className="text-xl font-semibold mt-5 mb-2.5 tracking-tight text-primary" {...props}>{children}</h2>;
  },
  h3({ children, ...props }: any) {
    return <h3 className="text-base font-semibold mt-4 mb-2 tracking-tight text-primary" {...props}>{children}</h3>;
  },
  h4({ children, ...props }: any) {
    return <h4 className="text-sm font-semibold mt-3 mb-1.5 text-primary" {...props}>{children}</h4>;
  },
  hr() {
    return (
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-linear-to-r from-transparent via-border to-transparent" />
        <div className="h-1.5 w-1.5 rounded-full bg-border" />
        <div className="h-px flex-1 bg-linear-to-l from-transparent via-border to-transparent" />
      </div>
    );
  },
};

export default function UserChatThreadPage() {
  const params = useParams();
  const { toggleMobileMenu } = useMobileMenu();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threadTitle, setThreadTitle] = useState("Chat");
  const [latestAiMessage, setLatestAiMessage] = useState<Message | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionMetadata[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, latestAiMessage]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const storedTitle = sessionStorage.getItem('threadTitle');
    if (storedTitle) {
      setThreadTitle(storedTitle);
      sessionStorage.removeItem('threadTitle');
    }
  }, [params.thread_id]);

  useEffect(() => {
    const fetchHistory = async () => {
      const tid = params.thread_id as string;
      if (!tid) { setLoading(false); return; }
      try {
        setLoading(true);
        setThreadId(tid);
        const response = await fetch(`/api/chat/threads/${tid}/history`);
        if (response.ok) {
          const data: Thread = await response.json();
          setMessages(data.messages || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [params.thread_id]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;
    const userMessage = inputValue.trim();
    setInputValue("");
    setMessages(prev => [...prev, { role: "human", content: userMessage, metadata: {} }]);
    setSending(true);
    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, thread_id: threadId || undefined }),
      });
      if (response.ok) {
        const data = await response.json();
        const aiMessage: Message = { role: "ai", content: data.content, metadata: data.metadata, agent_name: data.agent_name, agent_display_name: data.agent_display_name };
        setLatestAiMessage(aiMessage);
        setMessages(prev => [...prev, aiMessage]);
      } else {
        setMessages(prev => prev.slice(0, -1));
      }
    } catch {
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleViewQuestions = (documents: any[]) => {
    setSelectedQuestions(documents.filter((d: any) => d.metadata).map((d: any) => d.metadata));
    setSidebarOpen(true);
  };

  const renderQuestionCard = (question: QuestionMetadata, index: number) => (
    <Card key={`question-${index}`} className="mt-3 border border-border shadow-sm overflow-hidden">
      <CardContent className="py-4 px-4 sm:px-6 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-base font-semibold wrap-break-word">
            Q{question.question_number}
            {question.sub_question && question.sub_question !== '-' && `.${question.sub_question}`}
            {question.marks && <span className="ml-2 text-sm font-normal text-muted-foreground">[{question.marks} marks]</span>}
          </h4>
          <Badge variant="secondary" className="text-xs shrink-0">{question.semester_term} - {question.exam_type}</Badge>
        </div>
        {question.has_description && question.description_content && question.description_content !== 'N/A' && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{question.description_content}</ReactMarkdown>
          </div>
        )}
        {question.has_image && question.image_url && question.image_url !== 'N/A' && (
          <img src={question.image_url} alt={question.image_type ?? "Question image"} className="max-w-full h-auto rounded border" />
        )}
        <div className="prose dark:prose-invert max-w-none text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{question.question}</ReactMarkdown>
        </div>
        {question.pdf_url && question.pdf_url !== 'N/A' && (
          <a href={question.pdf_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all">View PDF</a>
        )}
        <div className="pt-2 border-t text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span>{question.course_title} ({question.course_code})</span>
          {question.created_at && <span className="shrink-0">Added: {new Date(question.created_at).toLocaleDateString()}</span>}
        </div>
      </CardContent>
    </Card>
  );

  const LoadingSkeleton = () => (
    <div className="flex gap-3 mb-4">
      <div className="shrink-0"><Skeleton className="h-8 w-8 rounded-full" /></div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );

  function normalizeAgentName(name: string) {
    if (name === 'fallback_agent') return 'General Agent';
    return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader title={threadTitle} onMobileMenuToggle={toggleMobileMenu} showSearch={false} hasBorder={false} />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto">
            {loading ? (
              <div className="space-y-4"><LoadingSkeleton /><LoadingSkeleton /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] py-12 px-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-sm">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">What would you like to study?</h2>
                <p className="text-muted-foreground text-sm text-center max-w-sm mb-8">
                  Ask about your courses, past exams, or any topic you're working on.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                  {[
                    { icon: BookOpen, title: "Past Exam Questions", prompt: "Show me past exam questions for DBMS" },
                    { icon: Brain, title: "Explain a Concept", prompt: "Explain normalization in databases" },
                    { icon: ScrollText, title: "Topic Overview", prompt: "What are the key topics in Operating Systems?" },
                    { icon: Search, title: "Find Questions", prompt: "Find questions about SQL joins from past exams" },
                  ].map((s) => (
                    <button
                      key={s.title}
                      onClick={() => setInputValue(s.prompt)}
                      className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <s.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.prompt}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div key={`msg-${index}`} className={cn("mb-6", message.role === "human" ? "flex justify-end" : "flex justify-start")}>
                    <div className={cn("max-w-[85%]", message.role === "human" ? "bg-accent rounded-2xl py-1 px-4" : "space-y-3")}>
                      {message.role === "ai" && (message.agent_display_name || message.agent_name) && (
                        <Badge variant="default" className="mb-2 py-1 text-background">
                          <Bot className="h-3 w-3 mr-1" />
                          {message.agent_display_name || normalizeAgentName(message.agent_name || '')}
                        </Badge>
                      )}
                      <div className={cn(
                        "prose dark:prose-invert max-w-none prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0 prose-pre:rounded-none prose-pre:border-0 prose-code:before:content-none prose-code:after:content-none prose-code:bg-transparent",
                        message.role === "human" && "text-foreground"
                      )}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</ReactMarkdown>
                      </div>
                      {message.role === "ai" && message.metadata?.retrieved_documents?.length > 0 && (
                        <Button variant="outline" size="sm" className="mt-3" onClick={() => handleViewQuestions(message.metadata.retrieved_documents)}>
                          <FileText className="h-4 w-4 mr-2" />
                          View {message.metadata.retrieved_documents.length} Question{message.metadata.retrieved_documents.length > 1 ? 's' : ''}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start mb-6">
                    <div className="flex gap-3 items-center">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Desktop Questions Sidebar */}
        {!isMobile && (
          <div className={cn("border-l bg-background transition-all duration-300 overflow-y-auto", sidebarOpen ? "w-96 lg:w-[480px]" : "w-0")}>
            {sidebarOpen && (
              <div className="h-full flex flex-col">
                <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    <h3 className="font-semibold">Questions ({selectedQuestions.length})</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}><X className="h-4 w-4" /></Button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedQuestions.map((q, i) => renderQuestionCard(q, i))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Questions Drawer */}
      {isMobile && (
        <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader className="border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <DrawerTitle>Questions ({selectedQuestions.length})</DrawerTitle>
              </div>
              <DrawerDescription className="sr-only">View retrieved questions for this message</DrawerDescription>
            </DrawerHeader>
            <div className="overflow-y-auto p-4 space-y-4">
              {selectedQuestions.map((q, i) => renderQuestionCard(q, i))}
            </div>
            <DrawerFooter className="border-t pt-4">
              <DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Input */}
      <div className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-4xl mx-auto p-4">
          <div className="relative flex items-end gap-2 rounded-2xl border bg-background p-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              className="min-h-[60px] max-h-[200px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={!inputValue.trim() || sending} size="icon" className="shrink-0 rounded-xl">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}
