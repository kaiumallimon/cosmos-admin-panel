"use client"

import { FrostedHeader } from "@/components/custom/frosted-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMobileMenu } from "@/components/mobile-menu-context";
import { 
  Bell, 
  Shield, 
  User, 
  Palette, 
  Globe, 
  Download, 
  Database,
  Mail,
  Lock,
  Eye,
  Smartphone
} from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const { toggleMobileMenu } = useMobileMenu();

  return (
    <div className="min-h-screen bg-background">
      {/* Frosted header */}
      <FrostedHeader 
        title="Settings" 
        subtitle="Manage your preferences and personalize your experience"
        onMobileMenuToggle={toggleMobileMenu}
      />

      {/* Page content with padding to avoid overlapping fixed header */}
      <div className="pt-10 px-6 md:px-10 pb-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Appearance Settings */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of your dashboard
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">Theme</Label>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>



          {/* Save Changes */}
          {/* <div className="flex justify-end">
            <div className="flex gap-3">
              <Button variant="outline">
                Reset to Defaults
              </Button>
              <Button>
                Save Changes
              </Button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
}
