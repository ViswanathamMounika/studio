
"use client";

import React, { useEffect, useState } from "react";
import { DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuItem, DropdownMenuPortal, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Monitor, Moon, Sun, Minus, Plus, Palette } from "lucide-react";
import useLocalStorage from "@/hooks/use-local-storage";

const FONT_SIZES = [12, 14, 16, 18, 20];
const MIN_FONT_SIZE = FONT_SIZES[0];
const MAX_FONT_SIZE = FONT_SIZES[FONT_SIZES.length - 1];

export default function AppearanceSettings() {
  const [theme, setTheme] = useLocalStorage<string>("theme", "theme-blue");
  const [mode, setMode] = useLocalStorage<"light" | "dark" | "system">("mode", "system");
  const [fontSize, setFontSize] = useLocalStorage<number>("font-size", 16);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.body.classList.remove("theme-blue", "theme-green");
      if (theme) {
        document.body.classList.add(theme);
      }
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window !== "undefined") {
        document.documentElement.style.fontSize = `${fontSize}px`;
    }
  }, [fontSize]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");

      if (mode === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        root.classList.add(systemTheme);
        return;
      }
      root.classList.add(mode);
    }
  }, [mode]);

  if (!isMounted) return null;

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Palette className="mr-2 h-4 w-4" />
          <span>Theme</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme("theme-blue")}>
              Blue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("theme-green")}>
              Green
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span>Toggle theme</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setMode("light")}>Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("dark")}>Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setMode("system")}>System</DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
       <div className="relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-2 text-sm outline-none">
          <span className="w-full">Font Size: {fontSize}px</span>
          <div className="flex items-center gap-1">
            <button
                onClick={() => setFontSize(Math.max(MIN_FONT_SIZE, fontSize - 2))}
                disabled={fontSize <= MIN_FONT_SIZE}
                className="p-1 rounded-md hover:bg-accent disabled:opacity-50"
            >
                <Minus className="h-4 w-4" />
            </button>
            <button
                onClick={() => setFontSize(Math.min(MAX_FONT_SIZE, fontSize + 2))}
                disabled={fontSize >= MAX_FONT_SIZE}
                className="p-1 rounded-md hover:bg-accent disabled:opacity-50"
            >
                <Plus className="h-4 w-4" />
            </button>
          </div>
       </div>
    </>
  );
}
