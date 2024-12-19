import { siteMetadata } from "@/lib/siteMetaData";
import type { Metadata } from "next";

export const METADATA: Metadata = {
	title: siteMetadata.title,
	description: siteMetadata.description,
	robots: {
		index: true,
		follow: true,
		nocache: true,
		googleBot: {
			index: true,
			follow: true,
			noimageindex: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
	keywords: siteMetadata.keywords,
	manifest: siteMetadata.manifest,
	alternates: {
		canonical: siteMetadata.siteUrl,
	},
	// icons: [
	// 	{
	// 		rel: "icon",
	// 		type: "image/png",
	// 		sizes: "32x32",
	// 		url: "/favicon/favicon-32x32.png",
	// 	},
	// 	{
	// 		rel: "icon",
	// 		type: "image/png",
	// 		sizes: "16x16",
	// 		url: "/favicon/favicon-16x16.png",
	// 	},
	// 	{
	// 		rel: "icon",
	// 		type: "image/png",
	// 		sizes: "192x192",
	// 		url: "/favicon/android-icon-192x192.png",
	// 	},
	// 	{
	// 		rel: "icon",
	// 		type: "image/png",
	// 		sizes: "96x96",
	// 		url: "/favicon/favicon-96x96.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "57x57",
	// 		url: "/favicon/apple-icon-57x57.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "60x60",
	// 		url: "/favicon/apple-icon-60x60.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "72x72",
	// 		url: "/favicon/apple-icon-72x72.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "76x76",
	// 		url: "/favicon/apple-icon-76x76.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "114x114",
	// 		url: "/favicon/apple-icon-114x114.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "120x120",
	// 		url: "/favicon/apple-icon-120x120.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "144x144",
	// 		url: "/favicon/apple-icon-144x144.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "152x152",
	// 		url: "/favicon/apple-icon-152x152.png",
	// 	},
	// 	{
	// 		rel: "apple-touch-icon",
	// 		sizes: "180x180",
	// 		url: "/favicon/apple-icon-180x180.png",
	// 	},
	// ],

	openGraph: {
		title: siteMetadata.title,
		description: siteMetadata.description,
		url: siteMetadata.siteUrl,
		images: [
			{
				url: siteMetadata.socialBanner,
				width: 1200,
				height: 630,
			},
		],
		type: "website",
		locale: siteMetadata.locale,
		ttl: 60,
	},
	twitter: {
		title: siteMetadata.title,
		description: siteMetadata.description,
		card: "summary_large_image",
		images: [
			{
				url: siteMetadata.socialBanner,
				width: 1200,
				height: 630,
			},
		],
		site: siteMetadata.siteUrl,
	},
	other: {
		url: siteMetadata.siteUrl,
	},
	publisher: siteMetadata.author,
	creator: siteMetadata.author,
};

export const JSON_LD = {
	"@context": "https://schema.org",
	"@type": "Person",
	name: siteMetadata.author,
	url: siteMetadata.siteUrl,
	image: `${siteMetadata.siteUrl}${siteMetadata.socialBanner}`,
	description: siteMetadata.personalDescription,
	jobTitle: siteMetadata.occupation,
	worksFor: {
		"@type": "Organization",
		name: siteMetadata.company,
	},
	address: {
		"@type": "PostalAddress",
		addressLocality: siteMetadata.location,
		addressCountry: siteMetadata.countryCode,
	},
	contactPoint: {
		"@type": "ContactPoint",
		telephone: siteMetadata.phone,
		contactType: "Customer Service",
		availableLanguage: siteMetadata.language,
		areaServed: siteMetadata.areaServed,
	},
	sameAs: siteMetadata.socialLinks,
	hasOccupation: {
		"@type": "Occupation",
		name: siteMetadata.occupation,
		description: siteMetadata.occupationDescription,
	},
};
