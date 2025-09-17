
"use client";

import {
  BarChart,
  Book,
  Download,
  Palette,
  Plus,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import AppearanceSettings from "@/components/wiki/appearance-settings";
import SharePopover from "@/components/wiki/share-popover";

type AppHeaderProps = {
    children?: React.ReactNode;
    isExportMode?: boolean;
    setIsExportMode?: (value: boolean) => void;
    handleExport?: () => void;
    selectedCount?: number;
    onAnalyticsClick?: () => void;
    onNewDefinitionClick?: () => void;
}

export default function AppHeader({ 
    children, 
    isExportMode, 
    setIsExportMode, 
    handleExport, 
    selectedCount = 0,
    onAnalyticsClick,
    onNewDefinitionClick
}: AppHeaderProps) {
  const userAvatar = PlaceHolderImages.find((img) => img.id === "user-avatar");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      {children}
      <div className="ml-auto flex items-center gap-2">
        <SharePopover />
        <Button variant="outline" size="sm" onClick={onNewDefinitionClick}>
          <Plus className="mr-2 h-4 w-4" />
          New Definition
        </Button>
        <Button variant="outline" size="sm">
          <Book className="h-4 w-4 mr-2" />
          Templates
        </Button>
        {isExportMode ? (
            <Button size="sm" onClick={handleExport} disabled={selectedCount === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export ({selectedCount})
            </Button>
        ) : (
             <Button variant="outline" size="sm" onClick={() => setIsExportMode && setIsExportMode(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export
            </Button>
        )}
        <Button variant="outline" size="sm" onClick={onAnalyticsClick}>
            <BarChart className="h-4 w-4 mr-2" />
            Analytics
        </Button>
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                    <Palette className="h-4 w-4 mr-2" />
                    Appearance
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <AppearanceSettings />
            </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
