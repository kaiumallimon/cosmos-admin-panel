'use client';

import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); 

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    try {
      if (isAuthenticated()) {
        router.push('/dashboard');
      }
    } catch (e) {
      // swallow errors during initial render/hydration
      console.warn('Auth redirect check failed', e);
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);

      if (result.success) {
        toast.success("Login successful!");
        router.push('/dashboard');
      } else {
        toast.error("Login failed. " + result.error);
      }
    } catch (error) {
      toast.error("Login failed. " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed overflow-hidden w-full h-full">
      <DottedGlowBackground
        className="pointer-events-none mask-radial-to-90% mask-radial-at-center"
        opacity={1}
        gap={12}
        radius={1.3}
        colorLightVar="--color-orange-500"
        glowColorLightVar="--color-orange-500"
        colorDarkVar="--color-orange-500"
        glowColorDarkVar="--color-orange-500"
        backgroundOpacity={0}
        speedMin={0.3}
        speedMax={2}
        speedScale={2}
      />

      {/* centered login form with card style */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <div className="bg-transparent backdrop-blur-sm border rounded-lg">
          <div className="p-12 min-w-[300px]">
            <Link href="/" className="flex justify-center text-2xl font-bold mb-4 text-center text-orange-500">
              COSMOS-ITS
            </Link>
            <h3 className="text-md mb-6 text-center text-gray-500">
              Sign in with your administrator info
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-md transition-colors"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}