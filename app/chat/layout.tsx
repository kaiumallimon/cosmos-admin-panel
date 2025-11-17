'use client';

import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getCurrentSessionToken, makeAuthenticatedRequest } from "@/lib/api-helpers";
import { ArrowLeft, Plus, RefreshCw, Send, User, Bot } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface ChatThread {
    thread_id: string;
    title: string;
    created_at: string;
}

interface ChatThreadResponse {
    chats: ChatThread[];
}

interface Message {
    message_id: string;
    type: 'human' | 'ai';
    content: string;
    timestamp: string | null;
    response_type?: string | null;
    tool_response?: any;
    llm_response?: any;
    agent_name?: string | null;
    metadata?: any;
}

interface ChatHistory {
    thread_id: string;
    messages: Message[];
    total_messages: number;
    thread_metadata: {
        total_messages: number;
        user_id: string;
        thread_type: string;
    };
    retrieved_at: string;
}

interface SendMessageResponse {
    response_type: string;
    tool_response: any;
    llm_response: {
        agent_name: string;
        summary: string;
        formatting_notes: string;
        reasoning: string;
    };
    display_message: string;
    questions: any[];
    metadata: {
        processing_time: string;
        tool_used: boolean;
        agent_execution_time_seconds: number;
        intent_detection_time_seconds: number;
        llm_calls_count: number;
        conversation_time_seconds: number;
        thread_id: string;
        is_new_thread: boolean;
        response_time_seconds: number;
        processing_time_seconds: number;
        overhead_time_seconds: number;
    };
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const [threads, setThreads] = useState<ChatThreadResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Extract thread ID from URL
    useEffect(() => {
        const pathParts = pathname.split('/');
        if (pathParts[2]) {
            setCurrentThreadId(pathParts[2]);
        } else {
            setCurrentThreadId(null);
        }
    }, [pathname]);

    const scrollToBottom = () => {
        // Use requestAnimationFrame to ensure DOM has rendered
        requestAnimationFrame(() => {
            const scrollViewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
            if (scrollViewport) {
                scrollViewport.scrollTop = scrollViewport.scrollHeight;
            } else {
                // Fallback to scrollIntoView
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        });
    };

    // Keep track of message count to detect new messages
    const prevMessageCount = useRef(0);

    useEffect(() => {
        if (chatHistory && chatHistory.messages) {
            const currentMessageCount = chatHistory.messages.length;
            
            // Only auto-scroll if:
            // 1. We're loading messages for the first time, OR
            // 2. New messages were added (count increased)
            if (prevMessageCount.current === 0 || currentMessageCount > prevMessageCount.current) {
                scrollToBottom();
            }
            
            prevMessageCount.current = currentMessageCount;
        }
    }, [chatHistory]);

    const fetchChatThreads = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await makeAuthenticatedRequest('/api/chat/threads', {
                method: 'GET'
            });

            if (!response.ok) {
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (jsonError) {
                    try {
                        const textError = await response.text();
                        if (textError.includes('<!DOCTYPE')) {
                            errorMessage = 'Server returned an error page. Please check your connection.';
                        } else {
                            errorMessage = textError || errorMessage;
                        }
                    } catch {
                        // Keep the default error message
                    }
                }
                throw new Error(errorMessage);
            }

            const data: ChatThreadResponse = await response.json().catch((jsonError) => {
                console.error('JSON parsing error:', jsonError);
                throw new Error('Invalid response format from server');
            });
            setThreads(data);
        } catch (err: any) {
            console.error('Error fetching chat threads:', err);
            setError(err.message || 'Failed to load chat threads.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchChatHistory = async (threadId: string) => {
        setIsLoadingChat(true);
        console.log('fetchChatHistory called with threadId:', threadId);
        try {
            const response = await makeAuthenticatedRequest(`/api/chat/history/${threadId}`, {
                method: 'GET'
            });

            console.log('Response status:', response.status, 'Response ok:', response.ok);
            
            if (!response.ok) {
                // Try to get the error message from the response
                let errorMessage = `Failed to load chat history`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch {
                    // If we can't parse the error response, use default message
                    switch (response.status) {
                        case 503:
                            errorMessage = "Chat service is currently unavailable. Please try again later.";
                            break;
                        case 404:
                            errorMessage = "Chat thread not found.";
                            break;
                        case 401:
                            errorMessage = "Authentication failed. Please log in again.";
                            break;
                        case 403:
                            errorMessage = "Access denied to this chat thread.";
                            break;
                        default:
                            errorMessage = `Unable to load chat history (Error ${response.status})`;
                    }
                }
                throw new Error(errorMessage);
            }

            const data: ChatHistory = await response.json();
            console.log('Successfully received chat history data:', data);
            setChatHistory(data);
        } catch (err: any) {
            console.error('Error fetching chat history:', err);
            setError(err.message || 'Failed to load chat history. Please try again.');
        } finally {
            setIsLoadingChat(false);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || isSending) return;

        setIsSending(true);
        const message = messageInput.trim();
        setMessageInput('');

        // Add user message to chat immediately for better UX
        if (chatHistory) {
            const userMessage: Message = {
                message_id: `temp_${Date.now()}`,
                type: 'human',
                content: message,
                timestamp: new Date().toISOString(),
            };
            setChatHistory(prev => prev ? {
                ...prev,
                messages: [...prev.messages, userMessage]
            } : null);
        }

        try {
            const response = await makeAuthenticatedRequest('/api/chat/send', {
                method: 'POST',
                body: JSON.stringify({
                    query: message,
                    thread_id: currentThreadId || ''
                })
            });

            if (!response.ok) {
                throw new Error(`Failed to send message: ${response.status}`);
            }

            const data: SendMessageResponse = await response.json();
            
            // If it's a new thread, update the URL and fetch threads
            if (data.metadata.is_new_thread) {
                setCurrentThreadId(data.metadata.thread_id);
                router.push(`/chat/${data.metadata.thread_id}`);
                fetchChatThreads(); // Refresh sidebar
            }

            // Refresh chat history to get the complete conversation
            if (data.metadata.thread_id) {
                await fetchChatHistory(data.metadata.thread_id);
            }
        } catch (err: any) {
            console.error('Error sending message:', err);
            // Remove the temporary user message on error
            if (chatHistory) {
                setChatHistory(prev => prev ? {
                    ...prev,
                    messages: prev.messages.filter(msg => !msg.message_id.startsWith('temp_'))
                } : null);
            }
        } finally {
            setIsSending(false);
        }
    };

    const startNewChat = () => {
        setCurrentThreadId(null);
        setChatHistory(null);
        router.push('/chat');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    useEffect(() => {
        fetchChatThreads();
    }, []);

    useEffect(() => {
        if (currentThreadId) {
            fetchChatHistory(currentThreadId);
        } else {
            setChatHistory(null);
        }
    }, [currentThreadId]);


    function CapitalizeFirstCharacter(str: string) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return (
        <ProtectedRoute>
            <div className="flex h-screen bg-gray-50">
                {/* Sidebar with chat threads */}
                <div className="w-64 border-r bg-white flex flex-col">
                    <div className="p-4 border-b">
                        <div className="flex flex-col gap-3 mb-4">
                            <Link href="/dashboard">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"> 
                                    <ArrowLeft className="mr-2 h-4 w-4" /> 
                                    Dashboard
                                </Button>
                            </Link>

                            <Button 
                                onClick={startNewChat}
                                className="w-full justify-start"> 
                                <Plus className="mr-2 h-4 w-4" /> 
                                New Chat
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 p-4">
                        <h3 className="font-semibold text-sm text-gray-600 mb-3">Chat History</h3>
                        
                        <ScrollArea className="h-full">
                            <div className="flex flex-col gap-1">
                                {isLoading ? (
                                    <div className="px-3 py-2 text-muted-foreground flex items-center gap-2">
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                        Loading...
                                    </div>
                                ) : error ? (
                                    <div className="px-3 py-2">
                                        <div className="text-red-500 text-sm mb-2">
                                            {error}
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={fetchChatThreads}
                                            className="w-full"
                                        >
                                            <RefreshCw className="mr-2 h-3 w-3" />
                                            Retry
                                        </Button>
                                    </div>
                                ) : threads?.chats && threads.chats.length > 0 ? (
                                    threads.chats.map((thread) => (
                                        <Link
                                            key={thread.thread_id}
                                            href={`/chat/${thread.thread_id}`}
                                            className={`px-3 py-2 rounded-lg text-sm transition-colors duration-200 block ${
                                                currentThreadId === thread.thread_id 
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                                    : 'hover:bg-gray-100 text-gray-700'
                                            }`}
                                        >
                                            <div className="truncate">{CapitalizeFirstCharacter(thread.title)}</div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="px-3 py-2 text-gray-500 text-sm">
                                        No conversations yet
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>

                {/* Main chat area */}
                <div className="flex-1 flex flex-col">
                    {currentThreadId && chatHistory ? (
                        <>
                            {/* Chat header */}
                            <div className="border-b bg-white px-6 py-4">
                                <h2 className="font-semibold text-gray-800">Chat</h2>
                                <p className="text-sm text-gray-500">Thread ID: {currentThreadId}</p>
                            </div>

                            {/* Messages area */}
                            <ScrollArea ref={scrollAreaRef} className="flex-1 px-6 py-4">
                                {isLoadingChat ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="flex items-center gap-2 text-gray-500">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Loading conversation...
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 max-w-4xl mx-auto">
                                        {chatHistory.messages.map((message, index) => (
                                            <div key={message.message_id} className="flex gap-4">
                                                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                    message.type === 'human' 
                                                        ? 'bg-blue-500 text-white' 
                                                        : 'bg-green-500 text-white'
                                                }`}>
                                                    {message.type === 'human' ? 
                                                        <User className="h-4 w-4" /> : 
                                                        <Bot className="h-4 w-4" />
                                                    }
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-gray-800">
                                                            {message.type === 'human' ? 'You' : 
                                                                (message.agent_name || 'Assistant')}
                                                        </span>
                                                        {message.agent_name && message.type === 'ai' && (
                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                                                {message.agent_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="prose prose-sm max-w-none">
                                                        <div className="whitespace-pre-wrap text-gray-700">
                                                            {message.content}
                                                        </div>
                                                    </div>
                                                    {message.metadata && Object.keys(message.metadata).length > 0 && (
                                                        <details className="text-xs text-gray-500">
                                                            <summary className="cursor-pointer hover:text-gray-700">Metadata</summary>
                                                            <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto">
                                                                {JSON.stringify(message.metadata, null, 2)}
                                                            </pre>
                                                        </details>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isSending && (
                                            <div className="flex gap-4">
                                                <div className="shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                                        Thinking...
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>

                            {/* Message input */}
                            <div className="border-t bg-white p-4">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex gap-3">
                                        <Input
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Type your message..."
                                            disabled={isSending}
                                            className="flex-1"
                                        />
                                        <Button 
                                            onClick={sendMessage}
                                            disabled={!messageInput.trim() || isSending}
                                            size="icon"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Welcome screen */
                        <div className="flex-1 flex items-center justify-center bg-white">
                            <div className="text-center space-y-4 max-w-md">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                    <Bot className="h-8 w-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-semibold text-gray-800">Welcome to COSMOS Chat</h2>
                                <p className="text-gray-600">
                                    Start a new conversation or select an existing thread from the sidebar.
                                </p>
                                <Button onClick={startNewChat}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Start New Chat
                                </Button>
                                {/* Quick input for new chat */}
                                <div className="pt-4">
                                    <div className="flex gap-3">
                                        <Input
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask me anything..."
                                            disabled={isSending}
                                            className="flex-1"
                                        />
                                        <Button 
                                            onClick={sendMessage}
                                            disabled={!messageInput.trim() || isSending}
                                            size="icon"
                                        >
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
