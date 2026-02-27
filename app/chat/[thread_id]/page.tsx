'use client';

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowRight, Bot, FileText, X, Copy, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JetBrains_Mono } from "next/font/google";
import TextType from "@/components/TextType";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

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

// Markdown components for code rendering
const CodeBlock = ({ content }: { content: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-3 mb-3">
      <Button
        size="sm"
        variant="ghost"
        className="absolute right-2 top-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre
        className={`bg-gray-100 dark:bg-[#1e1e1e] px-5 py-4 rounded-md overflow-x-auto ${jetbrainsMono.className}`}
      >
        <code className="text-sm dark:text-gray-100">{content}</code>
      </pre>
    </div>
  );
};

const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const content = Array.isArray(children) ? children.join("") : children;
    const isMultiLine = content && typeof content === 'string' && content.includes('\n');

    // Treat single-line code (inline or short blocks) as bold text
    if (inline || !isMultiLine) {
      return (
        <strong className="font-semibold">
          {content}
        </strong>
      );
    }

    // Only render as code block if it has multiple lines
    return <CodeBlock content={content} />;
  },
  p({ children, ...props }: any) {
    return <p className="my-2" {...props}>{children}</p>;
  },
};

export default function ThreadChatPage() {
  const params = useParams();
  const router = useRouter();
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

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending, latestAiMessage]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get thread title from sessionStorage
  useEffect(() => {
    const storedTitle = sessionStorage.getItem('threadTitle');
    if (storedTitle) {
      setThreadTitle(storedTitle);
      sessionStorage.removeItem('threadTitle'); // Clean up after reading
    }
  }, [params.thread_id]);

  // Fetch thread history
  useEffect(() => {
    const fetchHistory = async () => {
      const tid = params.thread_id as string;
      if (!tid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setThreadId(tid);
        const response = await fetch(`/api/chat/threads/${tid}/history`);

        if (response.ok) {
          const data: Thread = await response.json();
          setMessages(data.messages || []);
        } else {
          console.error('Failed to fetch thread history');
        }
      } catch (error) {
        console.error('Error fetching thread history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [params.thread_id]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputValue]);

// Send message
  const handleSend = async () => {
    if (!inputValue.trim() || sending) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message immediately
    const newUserMessage: Message = {
      role: "human",
      content: userMessage,
      metadata: {}
    };

    setMessages(prev => [...prev, newUserMessage]);
    setSending(true);

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          thread_id: threadId || undefined
        })
      });

      if (response.ok) {
        const data = await response.json();

        // Add AI response with streaming effect
        const aiMessage: Message = {
          role: "ai",
          content: data.content,
          metadata: data.metadata,
          agent_name: data.agent_name,
          agent_display_name: data.agent_display_name
        };

        setLatestAiMessage(aiMessage);
        setMessages(prev => [...prev, aiMessage]);
      } else {
        console.error('Failed to send message');
        // Remove user message on error
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove user message on error
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle opening questions in sidebar
  const handleViewQuestions = (documents: any[]) => {
    const questions = documents
      .filter((doc: any) => doc.metadata)
      .map((doc: any) => doc.metadata);
    setSelectedQuestions(questions);
    setSidebarOpen(true);
  };

  // Render question card
  const renderQuestionCard = (question: QuestionMetadata, index: number) => (
    <Card key={`question-${index}`} className="mt-3 border border-border shadow-sm overflow-hidden">
      <CardContent className="py-4 px-4 sm:px-6 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-base font-semibold wrap-break-word">
            Q{question.question_number}
            {question.sub_question && question.sub_question !== '-' && `.${question.sub_question}`}
            {question.marks && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                [{question.marks} marks]
              </span>
            )}
          </h4>
          <Badge variant="secondary" className="text-xs shrink-0">
            {question.semester_term} - {question.exam_type}
          </Badge>
        </div>

        {question.has_description && question.description_content && question.description_content !== 'N/A' && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md wrap-break-word overflow-wrap-anywhere">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {question.description_content}
            </ReactMarkdown>
          </div>
        )}

        {question.has_image && question.image_url && question.image_url !== 'N/A' && (
          <div className="overflow-hidden">
            <img
              src={question.image_url}
              alt={question.image_type ?? "Question image"}
              className="max-w-full h-auto rounded border"
            />
          </div>
        )}

        <div className="prose dark:prose-invert max-w-none text-sm wrap-break-word overflow-wrap-anywhere">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
            {question.question}
          </ReactMarkdown>
        </div>

        {question.pdf_url && question.pdf_url !== 'N/A' && (
          <div className="text-xs text-muted-foreground">
            <a
              href={question.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              View PDF
            </a>
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground flex flex-wrap justify-between gap-2">
          <span className="wrap-break-word">{question.course_title} ({question.course_code})</span>
          {question.created_at && <span className="shrink-0">Added: {new Date(question.created_at).toLocaleDateString()}</span>}
        </div>
      </CardContent>
    </Card>
  );

  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="flex gap-3 mb-4">
      <div className="shrink-0">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );

  function normalizeAgentName(name: String) {
    // example: fallback_agent_123 -> Fallback Agent
    if(name==='fallback_agent') return 'General Agent';
    return name.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader
        title={threadTitle}
        onMobileMenuToggle={toggleMobileMenu}
        showSearch={false}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              <LoadingSkeleton />
              <LoadingSkeleton />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] py-12 px-4">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 shadow-sm">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">How can I help you?</h2>
              <p className="text-muted-foreground text-sm text-center max-w-sm mb-8">
                Ask about courses, past exam questions, or any academic topic.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                {[
                  { emoji: "📚", title: "Past Exam Questions", prompt: "Show me past exam questions for DBMS" },
                  { emoji: "🧠", title: "Explain a Concept", prompt: "Explain normalization in databases" },
                  { emoji: "📝", title: "Topic Overview", prompt: "What are the key topics in Operating Systems?" },
                  { emoji: "🔍", title: "Find Questions", prompt: "Find questions about SQL joins from past exams" },
                ].map((s) => (
                  <button
                    key={s.title}
                    onClick={() => setInputValue(s.prompt)}
                    className="flex items-start gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors text-left group"
                  >
                    <span className="text-xl leading-none mt-0.5 shrink-0">{s.emoji}</span>
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
                <div
                  key={`msg-${index}`}
                  className={cn(
                    "mb-6",
                    message.role === "human" ? "flex justify-end" : "flex justify-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[85%]",
                    message.role === "human" ? "bg-accent rounded-2xl py-1 px-4" : "space-y-3"
                  )}>
                    {message.role === "ai" && (message.agent_display_name || message.agent_name) && (
                      <Badge variant="default" className="mb-2 py-1 text-background">
                        <Bot className="h-3 w-3 mr-1" />
                        {message.agent_display_name || normalizeAgentName(message.agent_name || '')}
                      </Badge>
                    )}

                    <div className={cn(
                      "prose dark:prose-invert max-w-none prose-code:font-semibold prose-code:before:content-none prose-code:after:content-none prose-code:bg-transparent",
                      message.role === "human" && "prose-invert text-foreground"
                    )}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Show link to view questions if message has retrieved documents */}
                    {message.role === "ai" && message.metadata?.retrieved_documents && message.metadata.retrieved_documents.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => handleViewQuestions(message.metadata.retrieved_documents)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View {message.metadata.retrieved_documents.length} Question{message.metadata.retrieved_documents.length > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator while waiting for response */}
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

      {/* Right Sidebar for Questions (Desktop) */}
      {!isMobile && (
        <div
          className={cn(
            "border-l bg-background transition-all duration-300 overflow-y-auto",
            sidebarOpen ? "w-96 lg:w-[480px]" : "w-0"
          )}
        >
          {sidebarOpen && (
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="sticky top-0 bg-background/95 backdrop-blur border-b z-10 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <h3 className="font-semibold">
                    Questions ({selectedQuestions.length})
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Questions List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedQuestions.map((question, index) => renderQuestionCard(question, index))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>

    {/* Drawer for Questions (Mobile) */}
    {isMobile && (
      <Drawer open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <DrawerTitle>Questions ({selectedQuestions.length})</DrawerTitle>
            </div>
            <DrawerDescription className="sr-only">
              View retrieved questions for this message
            </DrawerDescription>
          </DrawerHeader>

          {/* Scrollable Questions List */}
          <div className="overflow-y-auto p-4 space-y-4">
            {selectedQuestions.map((question, index) => renderQuestionCard(question, index))}
          </div>

          <DrawerFooter className="border-t pt-4">
            <DrawerClose asChild>
              <Button variant="outline">Close</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )}

      {/* Input Area */}
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
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || sending}
              size="icon"
              className="shrink-0 rounded-xl"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
