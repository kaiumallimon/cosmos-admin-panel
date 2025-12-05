'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import { useMobileMenu } from "@/components/mobile-menu-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Bot, 
  Activity, 
  Navigation,
  Clock,
  ExternalLink,
  Filter
} from "lucide-react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

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

const typeIcons = {
  user: Users,
  question: BookOpen,
  course: GraduationCap,
  agent: Bot,
  'system-log': Activity,
  navigation: Navigation
};

const typeColors = {
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  question: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800',
  course: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  agent: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800',
  'system-log': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
  navigation: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300 border-gray-200 dark:border-gray-800'
};

function SearchContent() {
  const { toggleMobileMenu } = useMobileMenu();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedType, setSelectedType] = useState<string>('');

  useEffect(() => {
    if (query.trim()) {
      performSearch(query, selectedType);
    } else {
      setResults([]);
    }
  }, [query, selectedType]);

  const performSearch = async (searchQuery: string, type?: string) => {
    setLoading(true);
    try {
      const url = `/api/search?q=${encodeURIComponent(searchQuery)}${type ? `&type=${type}` : ''}&limit=50`;
      const response = await fetch(url);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setResults(data.results);
        setSearchTime(data.searchTime);
      } else {
        console.error('Search failed:', response.statusText);
        setResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
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

  const typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'user', label: 'Users' },
    { value: 'question', label: 'Questions' },
    { value: 'course', label: 'Courses' },
    { value: 'agent', label: 'AI Agents' },
    { value: 'system-log', label: 'System Logs' },
    { value: 'navigation', label: 'Navigation' }
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader 
          title="Search Results" 
          subtitle={query ? `Results for "${query}"` : "Enter a search query to get started"}
          onMobileMenuToggle={toggleMobileMenu}
          showSearch={true}
        />

        <div className="p-6 space-y-6">
          {/* Search Stats and Filters */}
          {(results.length > 0 || loading) && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {!loading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{results.length} results in {searchTime}ms</span>
                      </div>
                    )}
                    {loading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Search className="h-4 w-4 animate-pulse" />
                        <span>Searching...</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      className="px-3 py-1 text-sm bg-background border border-border rounded-md"
                    >
                      {typeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Query State */}
          {!query && !loading && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Searching</h3>
                <p className="text-muted-foreground mb-6">
                  Use the search bar above or press <kbd className="px-2 py-1 text-xs bg-muted rounded border">Cmd+K</kbd> to search across:
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-w-2xl mx-auto text-left">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span>Users & Profiles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-green-500" />
                    <span>Question Bank</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <span>Courses</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Bot className="h-4 w-4 text-orange-500" />
                    <span>AI Agents</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>System Logs</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Navigation className="h-4 w-4 text-gray-500" />
                    <span>Navigation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Results State */}
          {query && !loading && results.length === 0 && (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Search className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-4">
                  No results found for <strong>"{query}"</strong>
                  {selectedType && (
                    <span> in <strong>{typeOptions.find(t => t.value === selectedType)?.label}</strong></span>
                  )}
                </p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Try:</p>
                  <p>• Checking your spelling</p>
                  <p>• Using different keywords</p>
                  <p>• Removing filters</p>
                  <p>• Searching for partial matches</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Results */}
          {!loading && results.length > 0 && (
            <div className="space-y-6">
              {Object.entries(groupedResults).map(([type, typeResults]) => {
                const Icon = typeIcons[type as keyof typeof typeIcons];
                const typeName = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
                
                return (
                  <Card key={type}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="h-5 w-5" />
                        {typeName}
                        <Badge variant="secondary" className="ml-auto">
                          {typeResults.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {typeResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleResultClick(result)}
                            className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group"
                          >
                            <div className={cn(
                              "shrink-0 h-10 w-10 rounded-full flex items-center justify-center border",
                              typeColors[result.type as keyof typeof typeColors]
                            )}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                                  {result.title}
                                </h4>
                                {result.url && (
                                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                {result.description}
                              </p>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-xs mt-2 h-5",
                                  typeColors[result.type as keyof typeof typeColors]
                                )}
                              >
                                {typeName}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <ProtectedRoute>
        <div className="min-h-screen bg-background">
          <div className="p-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array(6).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    }>
      <SearchContent />
    </Suspense>
  );
}