import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
	return (
		<main className="flex min-h-[100dvh] flex-col items-center justify-center bg-gray-50">
			{/* Hero Section */}
			<section className="w-full py-20">
				<div className="mx-auto w-full max-w-4xl space-y-8 text-center">
					<h1 className="font-bold text-6xl">One Post</h1>
					<p className="text-xl">
						Automate your social media posting across LinkedIn, X, and Bluesky
						with cutting-edge AI and OAuth integrations.
					</p>
					<div className="space-x-4">
						<Link href="/post">
							<Button size="lg" variant="ringHover">
								Get Started
							</Button>
						</Link>
						<Link href="#features">
							<Button variant="ghost" size="lg">
								Learn More
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section id="features" className="w-full bg-white py-20">
				<div className="mx-auto w-full max-w-4xl space-y-8 text-center">
					<h2 className="font-bold text-4xl">Features</h2>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						<div className="rounded-lg bg-gray-100 p-6">
							<h3 className="font-bold text-2xl">AI-Driven Post Generation</h3>
							<p className="text-gray-700">
								Generate unique, platform-specific posts using Gemini AI.
							</p>
						</div>
						<div className="rounded-lg bg-gray-100 p-6">
							<h3 className="font-bold text-2xl">Multi-Platform Posting</h3>
							<p className="text-gray-700">
								Publish to LinkedIn, X, and Bluesky with one click.
							</p>
						</div>
						<div className="rounded-lg bg-gray-100 p-6">
							<h3 className="font-bold text-2xl">Post Scheduling</h3>
							<p className="text-gray-700">
								Schedule posts for future dates and times.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Pricing Section */}
			<section id="pricing" className="w-full bg-gray-50 py-20">
				<div className="mx-auto w-full max-w-4xl space-y-8 text-center">
					<h2 className="font-bold text-4xl">Pricing</h2>
					<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
						<div className="rounded-lg bg-white p-6 shadow-md">
							<h3 className="font-bold text-2xl">Free</h3>
							<p className="text-gray-700">$0/month</p>
							<ul className="mt-4 text-left">
								<li>✅ 10 posts/month</li>
								<li>✅ Basic analytics</li>
								<li>❌ Advanced scheduling</li>
							</ul>
							<Button className="mt-6 w-full">Get Started</Button>
						</div>
						<div className="rounded-lg bg-white p-6 shadow-md">
							<h3 className="font-bold text-2xl">Pro</h3>
							<p className="text-gray-700">$9/month</p>
							<ul className="mt-4 text-left">
								<li>✅ Unlimited posts</li>
								<li>✅ Advanced analytics</li>
								<li>✅ Post scheduling</li>
							</ul>
							<Button className="mt-6 w-full">Upgrade</Button>
						</div>
						<div className="rounded-lg bg-white p-6 shadow-md">
							<h3 className="font-bold text-2xl">Enterprise</h3>
							<p className="text-gray-700">Custom pricing</p>
							<ul className="mt-4 text-left">
								<li>✅ Dedicated support</li>
								<li>✅ Team collaboration</li>
								<li>✅ Custom integrations</li>
							</ul>
							<Button className="mt-6 w-full">Contact Us</Button>
						</div>
					</div>
				</div>
			</section>

			{/* FAQ Section */}
			<section id="faq" className="w-full bg-white py-20">
				<div className="mx-auto w-full max-w-4xl space-y-8 text-center">
					<h2 className="font-bold text-4xl">FAQ</h2>
					<div className="space-y-4 text-left">
						<div className="rounded-lg bg-gray-100 p-6">
							<h3 className="font-bold text-xl">
								How does AI post generation work?
							</h3>
							<p className="text-gray-700">
								One Post uses Gemini AI to create unique posts based on your
								prompts and customization options.
							</p>
						</div>
						<div className="rounded-lg bg-gray-100 p-6">
							<h3 className="font-bold text-xl">Can I schedule posts?</h3>
							<p className="text-gray-700">
								Yes, you can schedule posts for future dates and times with the
								Pro plan.
							</p>
						</div>
						<div className="rounded-lg bg-gray-100 p-6">
							<h3 className="font-bold text-xl">Is my data secure?</h3>
							<p className="text-gray-700">
								Absolutely! One Post uses OAuth for secure account integrations.
							</p>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
