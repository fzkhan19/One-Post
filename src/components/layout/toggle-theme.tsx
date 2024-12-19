"use client";

import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { MoonIcon, SunIcon } from "../icons";
import { Button } from "../ui/button";

export const ToggleTheme = ({ className }: { className?: string }) => {
	const { theme, setTheme } = useTheme();

	return (
		<Button
			className={cn("p-6 ease-out hover:bg-primary/30", className)}
			size="icon"
			variant="ghost"
			aria-label="Toggle theme"
			onClick={() => setTheme(theme === "light" ? "dark" : "light")}
		>
			<div className="flex gap-2 dark:hidden">
				<MoonIcon className="size-4 fill-[#1b1b1b]" />
			</div>

			<div className="hidden gap-2 dark:flex">
				<SunIcon className="size-4 fill-[#fff]" />
			</div>
		</Button>
	);
};
