"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from '@/components/ui/command';
import { 
  Search, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Bot, 
  Activity, 
  Navigation,
  Loader2,
  Clock,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'user' | 'question' | 'course' | 'agent' | 'system-log' | 'navigation';
  url?: string;
  metadata?: any;
  relevance?: number;
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
}

interface GlobalSearchProps {
  trigger?: React.ReactNode;
  placeholder?: string;
  className?: string;
}

const typeIcons = {
  user: Users,
  question: BookOpen,
  course: GraduationCap,
  agent: Bot,
  'system-log': Activity,
  navigation: Navigation
};

const typeColors = {
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  question: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  course: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  agent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'system-log': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  navigation: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
};

export default function GlobalSearch({ 
  trigger, 
  placeholder = "Search anything...",
  className 
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const router = useRouter();

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      console.log('Starting search for:', searchQuery);
      setLoading(true);
      try {
        const result = await apiClient.request<SearchResponse>(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=50`);
        if (result.success && result.data) {
          console.log('Search response:', result.data);
          setResults(result.data.results);
          setSearchTime(result.data.searchTime);
        } else {
          console.error('Search failed:', result.error);
          setResults([]);
        }
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Keyboard shortcuts
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    if (result.url) {
      router.push(result.url);
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const defaultTrigger = (
    <Button
      variant="outline"
      className={cn(
        "relative h-9 w-full justify-start text-sm text-muted-foreground sm:pr-12 md:w-40 lg:w-64",
        className
      )}
      onClick={() => setOpen(true)}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden lg:inline-flex">Search anything...</span>
      <span className="inline-flex lg:hidden">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );

  const triggerElement = trigger ? (
    <div onClick={() => setOpen(true)}>
      {trigger}
    </div>
  ) : defaultTrigger;

  return (
    <>
      {triggerElement}
      
      <CommandDialog 
        open={open} 
        onOpenChange={setOpen}
        title="Global Search"
        description="Search across users, questions, courses, agents, and more"
      >
        <CommandInput
          placeholder={placeholder}
          value={query}
          onValueChange={setQuery}
        />
        <CommandList className="max-h-[500px] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {loading && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
            </div>
          )}
          
          {!loading && query && results.length === 0 && (
            <CommandEmpty>
              <div className="text-center p-4">
                <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-1">No results found</p>
                <p className="text-xs text-muted-foreground/80">
                  Try searching for users, questions, courses, or navigation items
                </p>
              </div>
            </CommandEmpty>
          )}

          {!loading && !query && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <div className="space-y-3">
                <div>
                  <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="font-medium">Start typing to search</p>
                  <p className="text-xs text-muted-foreground/80">
                    Search across users, questions, courses, agents, and more
                  </p>
                </div>
                <div className="text-xs space-y-1 pt-2 border-t border-border/50">
                  <p className="font-medium text-muted-foreground">Quick tips:</p>
                  <p>• Search by name, email, course code, or description</p>
                  <p>• Use <kbd className="px-1 py-0.5 text-xs bg-muted rounded">Cmd+K</kbd> to open search</p>
                </div>
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <>
              {Object.entries(groupedResults).map(([type, typeResults]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons];
                const typeName = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
                
                return (
                  <CommandGroup key={type} heading={typeName}>
                    {typeResults.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={`${result.title} ${result.description}`}
                        onSelect={() => handleSelect(result)}
                        className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer"
                      >
                        <div className="shrink-0 mt-0.5">
                          <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                            <p className="text-xs sm:text-sm font-medium truncate">{result.title}</p>
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs px-1.5 py-0.5 h-4 sm:h-5 self-start sm:self-auto shrink-0",
                                typeColors[result.type as keyof typeof typeColors]
                              )}
                            >
                              {typeName}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 sm:line-clamp-1">
                            {result.description}
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
              
              {searchTime > 0 && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-t border-border/50 bg-muted/30">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Found {results.length} results in {searchTime}ms</span>
                  </div>
                </div>
              )}
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}