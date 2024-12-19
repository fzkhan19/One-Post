import type { MetadataRoute } from "next";
import { siteMetadata } from "../lib/siteMetaData";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = siteMetadata.siteUrl;

	// Static URLs - Add or modify these based on your routes
	const staticUrls = [
		{
			url: `${baseUrl}/`,
			lastModified: new Date(),
			priority: 1.0,
		},
		{
			url: `${baseUrl}/about`,
			lastModified: new Date(),
			priority: 0.8,
		},
		{
			url: `${baseUrl}/content`,
			lastModified: new Date(),
			priority: 0.8,
		},
	];

	// Combine static and dynamic URLs
	return staticUrls;
}