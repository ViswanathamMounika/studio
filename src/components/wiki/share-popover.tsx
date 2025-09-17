
"use client";

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Share, Link, Copy, Globe } from "lucide-react";

export default function SharePopover() {
  const [accessLevel, setAccessLevel] = useState("restricted");
  const [role, setRole] = useState("viewer");
  const { toast } = useToast();
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied!",
      description: "The link has been copied to your clipboard.",
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm">
            <Share className="mr-2 h-4 w-4" />
            Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-medium">Share "MPM Data Definitions"</h3>
            <p className="text-sm text-muted-foreground">
              Share and collaborate with others.
            </p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="share-link">Shareable Link</Label>
            <div className="flex items-center gap-2">
              <Input id="share-link" value={shareUrl} readOnly />
              <Button size="icon" variant="outline" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>General Access</Label>
            <div className="flex items-start gap-2">
              <div className="p-2 bg-muted rounded-full">
                {accessLevel === "restricted" ? (
                  <Link className="h-5 w-5" />
                ) : (
                  <Globe className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1">
                <Select value={accessLevel} onValueChange={setAccessLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="anyone">Anyone with the link</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {accessLevel === "restricted"
                    ? "Only people with access can open with the link."
                    : "Anyone on the internet with the link can view."}
                </p>
              </div>
              {accessLevel === "anyone" && (
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
