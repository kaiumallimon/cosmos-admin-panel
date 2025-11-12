'use client';

import { useEffect, useState, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { FrostedHeader } from "@/components/custom/frosted-header";
import {
  FileTextIcon,
  ImageIcon,
  CloudIcon,
  DownloadIcon,
  Filter,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { useMobileMenu } from "@/components/mobile-menu-context";

interface CDNStatistics {
  totalFiles: number;
  pdfCount: number;
  imageCount: number;
  totalSizeBytes: number;
  totalSizeHuman: string;
}

interface CDNFile {
  filename: string;
  url: string;
  size: number;
  ext: string;
  mtime: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  count: number;
  total: number;
  totalPages: number;
}

interface CDNResponse {
  success: boolean;
  pagination: PaginationInfo;
  data: CDNFile[];
}

export default function CdnPage() {
  const { toggleMobileMenu } = useMobileMenu();
  const [statistics, setStatistics] = useState<CDNStatistics | null>(null);
  const [cdnFiles, setCdnFiles] = useState<CDNFile[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [loadingFiles, setLoadingFiles] = useState<boolean>(false);

  // Pagination and filtering
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [filter, setFilter] = useState<string>("all"); // "all", "pdf", "image"
  const [sortOrder, setSortOrder] = useState<string>("desc"); // "asc", "desc"

  // Fetch statistics
  useEffect(() => {
    async function fetchStatistics() {
      try {
        setLoadingStats(true);
        const res = await fetch("/api/cdn/stats");
        const data = await res.json();
        if (res.ok) {
          setStatistics(data.statistics);
        } else {
          toast.error(data.error || "Failed to fetch CDN statistics");
        }
      } catch (err) {
        toast.error("An unexpected error occurred");
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStatistics();
  }, []);

  // State for all files and filtered files
  const [allFiles, setAllFiles] = useState<CDNFile[]>([]);

  // Fetch all files from API (we'll do client-side pagination)
  useEffect(() => {
    async function fetchAllFiles() {
      try {
        setLoadingFiles(true);
        let allFetchedFiles: CDNFile[] = [];
        let currentPage = 1;
        let hasMorePages = true;

        // Fetch all pages to enable proper client-side filtering and sorting
        while (hasMorePages) {
          const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: "50" // Reasonable page size for API
          });

          const res = await fetch(`/api/cdn/files?${params.toString()}`);
          const data: CDNResponse = await res.json();
          
          if (res.ok) {
            allFetchedFiles = [...allFetchedFiles, ...data.data];
            hasMorePages = currentPage < data.pagination.totalPages;
            currentPage++;
            
            if (currentPage === 2) {
              // Set initial data after first page for better UX
              setAllFiles([...data.data]);
            }
          } else {
            toast.error("Failed to fetch files");
            break;
          }
        }

        setAllFiles(allFetchedFiles);
      } catch (err) {
        toast.error("An unexpected error occurred while fetching files");
      } finally {
        setLoadingFiles(false);
      }
    }
    fetchAllFiles();
  }, []); // Only fetch once on component mount

  // Helper functions for file type detection
  const isPDF = (ext: string) => ext.toLowerCase() === ".pdf";
  const isImage = (ext: string) => ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff'].includes(ext.toLowerCase());

  // Client-side filtering and sorting
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = [...allFiles];

    // Apply filter
    if (filter === "pdf") {
      filtered = filtered.filter(file => isPDF(file.ext));
    } else if (filter === "image") {
      filtered = filtered.filter(file => isImage(file.ext));
    }

    // Apply sorting by modification time
    filtered.sort((a, b) => {
      const dateA = new Date(a.mtime).getTime();
      const dateB = new Date(b.mtime).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  }, [allFiles, filter, sortOrder]);

  // Pagination for filtered results
  const paginatedFiles = useMemo(() => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredAndSortedFiles.slice(startIndex, endIndex);
  }, [filteredAndSortedFiles, page, limit]);

  // Update cdnFiles when pagination changes
  useEffect(() => {
    setCdnFiles(paginatedFiles);
  }, [paginatedFiles]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  // Convert statistics object into array with icons
  const statsArray = statistics
    ? [
        {
          title: "Total Files",
          value: statistics.totalFiles,
          icon: FileTextIcon,
        },
        {
          title: "PDF Files",
          value: statistics.pdfCount,
          icon: FileTextIcon,
        },
        {
          title: "Image Files",
          value: statistics.imageCount,
          icon: ImageIcon,
        },
        {
          title: "Storage Used",
          value: statistics.totalSizeHuman,
          icon: CloudIcon,
        },
      ]
    : [];

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Server Contents" onMobileMenuToggle={toggleMobileMenu} />

        {/* Breadcrumbs */}
        <div className="p-4 sm:p-6 pb-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Uploads</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 p-4 sm:p-6">
          {statsArray.map((stat, index) => (
            <Card key={index} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Filters and Sorting */}
        <div className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Files</SelectItem>
                    <SelectItem value="pdf">PDF Files</SelectItem>
                    <SelectItem value="image">Image Files</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                  className="flex items-center gap-2 h-9"
                >
                  {sortOrder === "desc" ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                  Sort by Date {sortOrder === "desc" ? "(Newest)" : "(Oldest)"}
                </Button>
              </div>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground">
              Showing {filteredAndSortedFiles.length} of {allFiles.length} files
            </div>
          </div>
        </div>

        {/* Files Grid */}
        <div className="p-4 sm:p-6 pb-12">
          {loadingFiles ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Card key={i} className="p-3 sm:p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-lg" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : cdnFiles.length === 0 ? (
            <Card className="p-6 sm:p-8">
              <div className="text-center text-muted-foreground">
                <CloudIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No files found</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {cdnFiles.map((file) => {
                  const fileIsImage = isImage(file.ext);
                  const fileIsPDF = isPDF(file.ext);
                  
                  return (
                    <Card key={file.filename} className="p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                          {fileIsPDF ? (
                            <FileTextIcon className="h-6 w-6 text-red-600" />
                          ) : fileIsImage ? (
                            <ImageIcon className="h-6 w-6 text-green-600" />
                          ) : (
                            <FileTextIcon className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={file.filename}>
                            {file.filename}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded ${
                              fileIsPDF ? 'bg-red-100 text-red-700' : 
                              fileIsImage ? 'bg-green-100 text-green-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {file.ext.replace(".", "").toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(file.mtime).toLocaleDateString()}
                          </p>
                          <div className="mt-2">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <DownloadIcon className="h-3 w-3" /> Download
                            </a>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Pagination */}
              {(() => {
                const totalPages = Math.ceil(filteredAndSortedFiles.length / limit);
                return totalPages > 1 && (
                  <div className="flex justify-center mt-6 mb-8">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious 
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (page > 1) setPage(page - 1);
                            }}
                            className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <PaginationItem key={i}>
                              <PaginationLink
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setPage(pageNum);
                                }}
                                isActive={page === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        
                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              if (page < totalPages) setPage(page + 1);
                            }}
                            className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
