"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlusIcon,
  SearchIcon,
  UploadIcon,
  FileTextIcon,
  VideoIcon,
  ImageIcon,
  FileIcon,
  DownloadIcon,
  TrashIcon,
  EyeIcon,
  FolderIcon,
  CloudIcon,
} from "lucide-react";

interface UploadedFile {
  id: string;
  name: string;
  type: "video" | "document" | "image" | "audio" | "other";
  size: number;
  url: string;
  courseId?: string;
  courseName?: string;
  uploadedBy: string;
  uploadedAt: string;
  downloads: number;
  category: string;
}

export default function UploadPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [dragActive, setDragActive] = useState(false);

  // Mock data - replace with actual data fetching
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "React Hooks Tutorial.mp4",
      type: "video",
      size: 45000000, // 45MB
      url: "/uploads/react-hooks-tutorial.mp4",
      courseId: "1",
      courseName: "Advanced React Development",
      uploadedBy: "John Doe",
      uploadedAt: "2024-01-15",
      downloads: 234,
      category: "Video Lessons",
    },
    {
      id: "2",
      name: "CSS Flexbox Cheatsheet.pdf",
      type: "document",
      size: 2500000, // 2.5MB
      url: "/uploads/flexbox-cheatsheet.pdf",
      courseId: "2",
      courseName: "UI/UX Design Fundamentals",
      uploadedBy: "Jane Smith",
      uploadedAt: "2024-01-20",
      downloads: 156,
      category: "Resources",
    },
    {
      id: "3",
      name: "Database Schema Diagram.png",
      type: "image",
      size: 1200000, // 1.2MB
      url: "/uploads/db-schema.png",
      courseId: "3",
      courseName: "Data Science with Python",
      uploadedBy: "Dr. Mike Johnson",
      uploadedAt: "2024-02-01",
      downloads: 89,
      category: "Diagrams",
    },
    {
      id: "4",
      name: "Marketing Strategy Template.docx",
      type: "document",
      size: 850000, // 0.85MB
      url: "/uploads/marketing-template.docx",
      courseId: "4",
      courseName: "Digital Marketing Strategy",
      uploadedBy: "Sarah Wilson",
      uploadedAt: "2024-02-10",
      downloads: 67,
      category: "Templates",
    },
  ]);

  const fileTypes = ["all", "video", "document", "image", "audio", "other"];

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.courseName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || file.type === selectedType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "video": return VideoIcon;
      case "document": return FileTextIcon;
      case "image": return ImageIcon;
      case "audio": return FileIcon;
      default: return FileIcon;
    }
  };

  const getTotalStorage = () => {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(totalBytes);
  };

  const stats = [
    {
      title: "Total Files",
      value: files.length.toString(),
      change: "+12%",
      trend: "up",
      icon: FolderIcon,
    },
    {
      title: "Storage Used",
      value: getTotalStorage(),
      change: "+8%",
      trend: "up",
      icon: CloudIcon,
    },
    {
      title: "Total Downloads",
      value: files.reduce((sum, file) => sum + file.downloads, 0).toString(),
      change: "+25%",
      trend: "up",
      icon: DownloadIcon,
    },
    {
      title: "Video Files",
      value: files.filter(f => f.type === "video").length.toString(),
      change: "+15%",
      trend: "up",
      icon: VideoIcon,
    },
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload logic here
      console.log("Files dropped:", e.dataTransfer.files);
    }
  };

  return (
    <ProtectedRoute>
      <div className="flex-1 space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
            <p className="text-muted-foreground mt-1">
              Upload and manage course materials, videos, and resources.
            </p>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UploadIcon className="h-4 w-4" />
                Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload New Content</DialogTitle>
                <DialogDescription>
                  Upload course materials, videos, documents, and other resources.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Drag and Drop Zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium mb-2">Drag & drop files here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse from your computer
                  </p>
                  <Button variant="outline">
                    Choose Files
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports: PDF, DOC, MP4, PNG, JPG (Max 100MB)
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">File Title</Label>
                    <Input id="title" placeholder="Enter a descriptive title" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" placeholder="Brief description of the content" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="course">Associated Course</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select course" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Advanced React Development</SelectItem>
                          <SelectItem value="2">UI/UX Design Fundamentals</SelectItem>
                          <SelectItem value="3">Data Science with Python</SelectItem>
                          <SelectItem value="4">Digital Marketing Strategy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video-lessons">Video Lessons</SelectItem>
                          <SelectItem value="resources">Resources</SelectItem>
                          <SelectItem value="templates">Templates</SelectItem>
                          <SelectItem value="diagrams">Diagrams</SelectItem>
                          <SelectItem value="assignments">Assignments</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsUploadDialogOpen(false)}>
                  Upload Content
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {fileTypes.map((type) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="capitalize"
              >
                {type}
              </Button>
            ))}
          </div>
        </div>

        {/* Files Grid */}
        <div className="grid gap-4">
          {filteredFiles.map((file) => {
            const FileIcon = getFileIcon(file.type);
            return (
              <Card key={file.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <FileIcon className="h-6 w-6 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg truncate">{file.name}</h3>
                      <Badge variant="outline" className="capitalize">
                        {file.type}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Size:</span> {formatFileSize(file.size)}
                      </div>
                      <div>
                        <span className="font-medium">Course:</span> {file.courseName}
                      </div>
                      <div>
                        <span className="font-medium">Downloads:</span> {file.downloads}
                      </div>
                      <div>
                        <span className="font-medium">Uploaded:</span> {new Date(file.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <span>Uploaded by <span className="font-medium">{file.uploadedBy}</span></span>
                      <span>•</span>
                      <span>Category: <span className="font-medium">{file.category}</span></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="gap-1">
                      <EyeIcon className="h-3 w-3" />
                      Preview
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <DownloadIcon className="h-3 w-3" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                      <TrashIcon className="h-3 w-3" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <UploadIcon className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No files found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedType !== "all"
                ? "Try adjusting your search or filters." 
                : "Start by uploading your first content file."}
            </p>
            {!searchTerm && selectedType === "all" && (
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                Upload Your First File
              </Button>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}