import Providers from "@/components/layout/Providers";
import { Navbar } from "@/components/layout/navbar";
import { JSON_LD, METADATA } from "@/constants/Metadata";
import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-in",
});

const manrope = Manrope({
	subsets: ["latin"],
	display: "swap",
	variable: "--font-mr",
});

export const metadata: Metadata = METADATA;

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<ClerkProvider
				appearance={{
					variables: { colorPrimary: "#000000" },
					elements: {
						formButtonPrimary:
							"bg-black border border-black border-solid hover:bg-white hover:text-black",
						socialButtonsBlockButton:
							"bg-white border-gray-200 hover:bg-transparent hover:border-black text-gray-600 hover:text-black",
						socialButtonsBlockButtonText: "font-semibold",
						formButtonReset:
							"bg-white border border-solid border-gray-200 hover:bg-transparent hover:border-black text-gray-500 hover:text-black",
						membersPageInviteButton:
							"bg-black border border-black border-solid hover:bg-white hover:text-black",
						card: "bg-[#fafafa]",
					},
				}}
			>
				<head>
					<meta name="apple-mobile-web-app-title" content="OnePost" />
				</head>
				<body className={cn("", inter.variable, manrope.variable)}>
					<main className="no-scrollbar overflow-x-hidden overflow-y-scroll scroll-smooth">
						<Analytics />
						<Script
							// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
							dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
							type="application/ld+json"
						/>
						<Providers>
							<Navbar />
							{children}
						</Providers>
					</main>
				</body>
			</ClerkProvider>
		</html>
	);
}
