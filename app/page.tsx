import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";
import { Input } from "@/components/ui/input";
import { Label } from "@radix-ui/react-label";
import Link from "next/link";

export default function Home() {
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
      <div className="relative z-10 flex items-center justify-center h-full px-4 ">
        <div className="bg-transparent backdrop-blur-sm border rounded-lg">
          <div className="p-12 min-w-[300px]">
            <Link href="/" className="flex justify-center text-2xl font-bold mb-4 text-center text-orange-500">COSMOS-ITS</Link>
            <h3 className="text-md  mb-6 text-center text-gray-500">Sign in with your administrator info</h3>
            <form className="space-y-4">
              <div>
                <Label htmlFor="email" className="block text-sm font-medium mb-1">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
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
                  placeholder="********"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-300 transition-colors duration-300"
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
}
