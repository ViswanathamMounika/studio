
"use client";

import {
  BarChart,
  Book,
  Download,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AppearanceSettings from "@/components/wiki/appearance-settings";

type AppHeaderProps = {
    children?: React.ReactNode;
    isExportMode?: boolean;
    setIsExportMode?: (value: boolean) => void;
    handleExport?: () => void;
    selectedCount?: number;
    onAnalyticsClick?: () => void;
    onTemplatesClick?: () => void;
    isAdmin: boolean;
}

export default function AppHeader({ 
    children, 
    isExportMode, 
    setIsExportMode, 
    handleExport, 
    selectedCount = 0,
    onAnalyticsClick,
    onTemplatesClick,
    isAdmin,
}: AppHeaderProps) {

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center w-full gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 justify-between">
       <div className="flex items-center gap-4">
        {children}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onTemplatesClick}>
          <Book className="h-4 w-4 mr-2" />
          Templates
        </Button>
        {isAdmin && (
            isExportMode ? (
                <Button size="sm" onClick={handleExport} disabled={selectedCount === 0}>
                    <Download className="mr-2 h-4 w-4" />
                    Export ({selectedCount})
                </Button>
            ) : (
                <Button variant="outline" size="sm" onClick={() => setIsExportMode && setIsExportMode(true)}>
                    <Download className="mr-2 h-4 w-4" />
                    Export
                </Button>
            )
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
