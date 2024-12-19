/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		domains: [],
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Frame-Options",
						value: "DENY",
					},
					{
						key: "Content-Security-Policy",
						value:
							"default-src 'self'; img-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' ; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self'; frame-src 'self'",
					},
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), geolocation=(), microphone=()",
					},
					{
						key: "Referrer-Policy",
						value: "origin-when-cross-origin",
					},
				],
			},
		];
	},
};


export default nextConfig;
// export default MillionLint.next({
// 	rsc: true,
// })(nextConfig);
