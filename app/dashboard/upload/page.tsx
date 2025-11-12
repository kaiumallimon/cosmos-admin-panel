'use client';

import { FrostedHeader } from "@/components/custom/frosted-header";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { FileUpload } from "@/components/ui/file-upload";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { InfoIcon, UploadIcon, ClipboardCopyIcon } from "lucide-react";
import { useMobileMenu } from "@/components/mobile-menu-context";

export default function ContentUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
    const { toggleMobileMenu } = useMobileMenu();

  // Load saved URL from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem("uploadedFileUrl");
    if (savedUrl) setUploadedUrl(savedUrl);
  }, []);

  const handleFileChange = (files: File[]) => {
    setSelectedFiles(files);
    setUploadedUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      setError("Please select a file first.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFiles[0]);

      const res = await fetch("/api/cdn/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");

      setUploadedUrl(data.url);
      localStorage.setItem("uploadedFileUrl", data.url);
      toast.success("File uploaded successfully!");
    } catch (err: any) {
      setError(err.message || "Upload failed");
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (uploadedUrl) {
      navigator.clipboard.writeText(uploadedUrl);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <FrostedHeader title="Upload Content" onMobileMenuToggle={toggleMobileMenu} />

        {/* Breadcrumb */}
        <div className="p-6 pb-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Upload</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Upload Section */}
        <div className="flex items-center justify-center mt-[100px] mb-[60px] px-4">
          <Card className="w-full max-w-2xl p-8 sm:p-10 bg-card/60 backdrop-blur-lg border border-border/40 shadow-lg rounded-2xl">
            <div className="flex flex-col items-center gap-6">
              
              {/* Upload area */}
              <FileUpload onChange={handleFileChange} />

              {/* Helper Texts */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <InfoIcon className="h-4 w-4 mt-0.5 text-primary" />
                <ul className="list-disc list-inside space-y-1">
                  <li>Supported formats: <span className="font-medium text-primary">.pdf, .png, .jpg, .jpeg</span></li>
                  <li>Maximum file size: <span className="font-medium text-primary">10 MB</span></li>
                  <li>All files are stored securely on the CDN server.</li>
                </ul>
              </div>

              {selectedFiles.length > 0 && (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 px-6 py-2.5 rounded-md text-white font-medium transition-all duration-300 shadow disabled:opacity-60"
                >
                  <UploadIcon className="w-4 h-4" />
                  {loading ? "Uploading..." : "Upload File"}
                </button>
              )}

              {uploadedUrl && (
                <div className="w-full mt-4 p-4 bg-muted rounded-md border border-border">
                  <p className="truncate text-foreground text-sm">{uploadedUrl}</p>
                  <button
                    onClick={handleCopy}
                    className="mt-3 flex items-center justify-center gap-1 px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-white text-sm transition-all"
                  >
                    <ClipboardCopyIcon className="h-4 w-4" />
                    Copy URL
                  </button>
                </div>
              )}

              {error && (
                <p className="text-red-500 text-sm font-medium mt-2">
                  {error}
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
