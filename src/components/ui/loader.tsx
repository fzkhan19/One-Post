import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const Loader = ({ className }: { className?: string }) => {
	return (
		<Loader2
			className={cn("my-28 h-16 w-16 animate-spin text-primary/60", className)}
		/>
	);
};

export default Loader;
