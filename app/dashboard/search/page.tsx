"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SearchIcon,
  FilterIcon,
  BookOpenIcon,
  HelpCircleIcon,
  FileTextIcon,
  VideoIcon,
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  type: "course" | "question" | "file" | "user";
  description: string;
  category: string;
  relevanceScore: number;
  metadata: {
    [key: string]: any;
  };
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Mock search results
  const mockResults: SearchResult[] = [
    {
      id: "1",
      title: "Advanced React Development",
      type: "course",
      description: "Master advanced React concepts including hooks, context, and performance optimization.",
      category: "Development",
      relevanceScore: 95,
      metadata: {
        instructor: "John Doe",
        duration: "8 weeks",
        students: 156,
        status: "active"
      }
    },
    {
      id: "2",
      title: "React Hooks Basics",
      type: "question",
      description: "Which hook is used to manage state in functional components?",
      category: "React Development",
      relevanceScore: 88,
      metadata: {
        difficulty: "easy",
        points: 5,
        type: "multiple-choice"
      }
    },
    {
      id: "3",
      title: "React Hooks Tutorial.mp4",
      type: "file",
      description: "Comprehensive video tutorial on React hooks usage and best practices",
      category: "Video Lessons",
      relevanceScore: 82,
      metadata: {
        size: "45MB",
        duration: "2h 15m",
        downloads: 234
      }
    },
    {
      id: "4",
      title: "John Doe",
      type: "user",
      description: "Senior React Developer and Course Instructor",
      category: "Instructors",
      relevanceScore: 75,
      metadata: {
        courses: 3,
        students: 450,
        rating: 4.8
      }
    }
  ];

  const searchTypes = ["all", "course", "question", "file", "user"];
  const categories = ["all", "Development", "Design", "Data Science", "Marketing", "Video Lessons", "Resources"];

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const filtered = mockResults.filter(result => {
        const matchesSearch = result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             result.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedType === "all" || result.type === selectedType;
        const matchesCategory = selectedCategory === "all" || result.category === selectedCategory;
        return matchesSearch && matchesType && matchesCategory;
      });
      
      setSearchResults(filtered.sort((a, b) => b.relevanceScore - a.relevanceScore));
      setIsLoading(false);
    }, 1000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course": return BookOpenIcon;
      case "question": return HelpCircleIcon;
      case "file": return FileTextIcon;
      case "user": return UsersIcon;
      default: return SearchIcon;
    }
  };

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "course": return "default";
      case "question": return "secondary";
      case "file": return "outline";
      case "user": return "destructive";
      default: return "outline";
    }
  };

  const renderMetadata = (result: SearchResult) => {
    switch (result.type) {
      case "course":
        return (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Instructor: <span className="font-medium">{result.metadata.instructor}</span></span>
            <span>Duration: <span className="font-medium">{result.metadata.duration}</span></span>
            <span>Students: <span className="font-medium">{result.metadata.students}</span></span>
          </div>
        );
      case "question":
        return (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Difficulty: <span className="font-medium capitalize">{result.metadata.difficulty}</span></span>
            <span>Points: <span className="font-medium">{result.metadata.points}</span></span>
            <span>Type: <span className="font-medium">{result.metadata.type}</span></span>
          </div>
        );
      case "file":
        return (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Size: <span className="font-medium">{result.metadata.size}</span></span>
            {result.metadata.duration && (
              <span>Duration: <span className="font-medium">{result.metadata.duration}</span></span>
            )}
            <span>Downloads: <span className="font-medium">{result.metadata.downloads}</span></span>
          </div>
        );
      case "user":
        return (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Courses: <span className="font-medium">{result.metadata.courses}</span></span>
            <span>Students: <span className="font-medium">{result.metadata.students}</span></span>
            <span>Rating: <span className="font-medium">{result.metadata.rating}/5</span></span>
          </div>
        );
      default:
        return null;
    }
  };

  const stats = [
    {
      title: "Total Searches",
      value: "1,247",
      change: "+22%",
      trend: "up",
      icon: SearchIcon,
    },
    {
      title: "Popular Content",
      value: "React Courses",
      change: "Trending",
      trend: "up",
      icon: TrendingUpIcon,
    },
    {
      title: "Search Accuracy",
      value: "94.2%",
      change: "+3.1%",
      trend: "up",
      icon: FilterIcon,
    },
    {
      title: "Avg. Response",
      value: "0.8s",
      change: "-0.2s",
      trend: "down",
      icon: ClockIcon,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Search & Discovery</h1>
            <p className="text-muted-foreground mt-1">
              Find courses, questions, files, and users across your platform.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div className="flex items-center mt-4">
                <span className={`text-sm font-medium ${
                  stat.trend === "up" ? "text-green-500" : stat.trend === "down" ? "text-red-500" : "text-blue-500"
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {stat.trend === "up" || stat.trend === "down" ? "from last month" : ""}
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Search Interface */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Main Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search for courses, questions, files, or users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={!searchTerm.trim() || isLoading}
                className="h-12 px-8"
              >
                {isLoading ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Content Type" />
                </SelectTrigger>
                <SelectContent>
                  {searchTypes.map((type) => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type === "all" ? "All Types" : `${type}s`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="capitalize">
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleSearch} disabled={isLoading}>
                <FilterIcon className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Search Results ({searchResults.length})
              </h2>
              <div className="text-sm text-muted-foreground">
                Sorted by relevance
              </div>
            </div>

            <div className="grid gap-4">
              {searchResults.map((result) => {
                const TypeIcon = getTypeIcon(result.type);
                return (
                  <Card key={result.id} className="p-6 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <TypeIcon className="h-6 w-6 text-primary" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{result.title}</h3>
                          <Badge variant={getTypeBadgeVariant(result.type)} className="capitalize">
                            {result.type}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <span>Relevance:</span>
                            <span className="font-medium text-primary">{result.relevanceScore}%</span>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-3">{result.description}</p>

                        {renderMetadata(result)}

                        <div className="flex items-center gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {result.category}
                          </Badge>
                        </div>
                      </div>

                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchResults.length && searchTerm && !isLoading && (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms or filters.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Search tips:</strong></p>
              <ul className="list-disc list-inside space-y-1 max-w-md mx-auto">
                <li>Use specific keywords related to your content</li>
                <li>Try different content types (courses, questions, files)</li>
                <li>Check for typos in your search term</li>
                <li>Use broader category filters</li>
              </ul>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!searchResults.length && !searchTerm && (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Your Search</h3>
            <p className="text-muted-foreground mb-4">
              Enter keywords to find courses, questions, files, or users.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Popular searches:</strong></p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {["React", "JavaScript", "CSS", "Python", "Design", "Database"].map((term) => (
                  <Button
                    key={term}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm(term);
                      setTimeout(handleSearch, 100);
                    }}
                  >
                    {term}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Searching across all content...</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}