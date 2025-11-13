'use client';

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

interface ShowLottieAnimationProps {
  animationPath: string;
}

export default function ShowLottieAnimation({ animationPath }: ShowLottieAnimationProps) {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    fetch(animationPath)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Failed to load Lottie file:", err));
  }, [animationPath]);

  return (
    <div className="w-full max-w-md mb-6">
      {animationData ? (
        <Lottie animationData={animationData} loop />
      ) : (
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
      )}
    </div>
  );
}
