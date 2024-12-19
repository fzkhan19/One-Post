import type { ReactNode } from "react";

import QueryProviders from "./query-client-provider";
import { ThemeProvider } from "./theme-provider";
const Providers = ({ children }: { children: ReactNode }) => {
	return (
		<ThemeProvider
			disableTransitionOnChange
			enableSystem
			attribute="class"
			defaultTheme="system"
		>
			<QueryProviders>{children}</QueryProviders>
		</ThemeProvider>
	);
};

export default Providers;
