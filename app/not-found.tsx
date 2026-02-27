"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch("/404.json")
      .then((res) => res.json())
      .then((data) => setAnimationData(data))
      .catch((err) => console.error("Failed to load Lottie file:", err));
  }, []);

  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center px-4">
      {animationData ? (
        <div className="w-full max-w-md mb-6">
          <Lottie animationData={animationData} loop autoplay />
        </div>
      ) : (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
      )}

      <p className="text-muted-foreground max-w-md" >Seems like the page you're looking for, does not exists in this website.</p>
      <Button className="mt-5" onClick={()=>{
        router.push('/admin');
      }}>Go Back to Dashboard</Button>
    </div>
  );
}
