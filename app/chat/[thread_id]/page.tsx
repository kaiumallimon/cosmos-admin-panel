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
import { ArrowRight, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { JetBrains_Mono } from "next/font/google";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

interface Message {
  role: "human" | "ai";
  content: string;
  metadata?: any;
  agent_name?: string;
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
}

// Markdown components for code rendering
const markdownComponents = {
  code({ node, inline, className, children, ...props }: any) {
    const content = Array.isArray(children) ? children.join("") : children;

    if (inline) {
      return (
        <code
          className={`bg-gray-100 dark:bg-gray-800 px-1 rounded text-sm font-mono ${jetbrainsMono.className}`}
          {...props}
        >
          {content}
        </code>
      );
    }

    return (
      <pre
        className={`mt-3 bg-gray-100 dark:bg-gray-800 px-5 py-4 rounded-md overflow-x-auto ${jetbrainsMono.className}`}
        {...props}
      >
        <code className="text-sm">{content}</code>
      </pre>
    );
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

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

          // Set thread title from first message or use thread ID
          if (data.messages && data.messages.length > 0) {
            const firstMessage = data.messages[0];
            setThreadTitle(firstMessage.content.slice(0, 50) + (firstMessage.content.length > 50 ? '...' : ''));
          }
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

        // Add AI response
        const aiMessage: Message = {
          role: "ai",
          content: data.content,
          metadata: data.metadata,
          agent_name: data.agent_name
        };

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

  // Render question card
  const renderQuestionCard = (question: QuestionMetadata, index: number) => (
    <Card key={`question-${index}`} className="mt-3 border border-border shadow-sm">
      <CardContent className="py-4 px-4 sm:px-6 space-y-3">
        <div className="flex justify-between items-start">
          <h4 className="text-base font-semibold">
            Q{question.question_number}
            {question.sub_question && question.sub_question !== '-' && `.${question.sub_question}`}
            {question.marks && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                [{question.marks} marks]
              </span>
            )}
          </h4>
          <Badge variant="secondary" className="text-xs">
            {question.exam_type}
          </Badge>
        </div>

        {question.has_description && question.description_content && question.description_content !== 'N/A' && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {question.description_content}
            </ReactMarkdown>
          </div>
        )}

        {question.has_image && question.image_url && question.image_url !== 'N/A' && (
          <div>
            <img
              src={question.image_url}
              alt={question.image_type ?? "Question image"}
              className="max-w-full rounded border"
            />
          </div>
        )}

        <div className="prose dark:prose-invert max-w-none text-sm">
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
              className="text-primary hover:underline"
            >
              View PDF
            </a>
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between">
          <span>{question.course_title} ({question.course_code})</span>
          {question.created_at && <span>Added: {new Date(question.created_at).toLocaleDateString()}</span>}
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

  return (
    <div className="flex flex-col h-full">
      <FrostedHeader
        title={threadTitle}
        subtitle={threadId ? `Thread ID: ${threadId}` : 'Loading...'}
        onMobileMenuToggle={toggleMobileMenu}
        showSearch={false}
      />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="space-y-4">
              <LoadingSkeleton />
              <LoadingSkeleton />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Bot className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">No messages yet</h2>
              <p className="text-muted-foreground max-w-md">
                Start the conversation by sending a message!
              </p>
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
                    message.role === "human" ? "bg-primary text-primary-foreground rounded-2xl px-4 py-3" : "space-y-3"
                  )}>
                    {message.role === "ai" && message.agent_name && (
                      <Badge variant="outline" className="mb-2">
                        <Bot className="h-3 w-3 mr-1" />
                        {message.agent_name}
                      </Badge>
                    )}

                    <div className={cn(
                      "prose dark:prose-invert max-w-none",
                      message.role === "human" && "prose-invert text-primary-foreground"
                    )}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {message.content}
                      </ReactMarkdown>
                    </div>

                    {/* Render question cards for AI messages with retrieved documents */}
                    {message.role === "ai" && message.metadata?.retrieved_documents && (
                      <div className="space-y-2 mt-4">
                        {message.metadata.retrieved_documents.map((doc: any, docIndex: number) =>
                          doc.metadata && renderQuestionCard(doc.metadata, docIndex)
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator while sending */}
              {sending && (
                <div className="flex justify-start mb-6">
                  <div className="max-w-[85%]">
                    <LoadingSkeleton />
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

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
