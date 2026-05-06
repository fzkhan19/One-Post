import type { ReactNode } from "react";

import QueryProviders from "./query-client-provider";
import { ThemeProvider } from "./theme-provider";
import { Toaster } from "@/components/ui/sonner";

const Providers = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider
			disableTransitionOnChange
			enableSystem
			attribute="class"
			defaultTheme="system"
		>
			<QueryProviders>
				{children}
				<Toaster />
			</QueryProviders>
		</ThemeProvider>
	);
};

export default Providers;
