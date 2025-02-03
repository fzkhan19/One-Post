import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
	Bell,
	Calendar1,
	LineChart,
	Send,
	Share2,
	Sparkles,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Dashboard | One Post",

	description: "Your social media command center",
};

export default function Dashboard() {
	return (
		<div className="container mx-auto p-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-4xl tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">
						Manage your social presence across platforms
					</p>
				</div>
				<Button variant="outline" size="icon">
					<Bell className="h-4 w-4" />
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 md:grid-cols-6">
				{/* Main Content Area */}
				<div className="space-y-6 md:col-span-4">
					<Card>
						<CardHeader>
							<CardTitle>Create Post</CardTitle>
							<CardDescription>Write once, share everywhere</CardDescription>
						</CardHeader>
						<CardContent>
							<Textarea
								className="mb-4 min-h-[120px]"
								placeholder="What's on your mind?"
							/>
							<div className="flex gap-3">
								<Button className="gap-2">
									<Sparkles className="h-4 w-4" />
									Generate with AI
								</Button>
								<Button variant="outline" className="gap-2">
									<Calendar1 className="h-4 w-4" />
									Schedule
								</Button>
								<Button variant="default" className="ml-auto gap-2">
									<Send className="h-4 w-4" />
									Post Now
								</Button>
							</div>
						</CardContent>
					</Card>

					<Tabs defaultValue="recent">
						<TabsList className="mb-4">
							<TabsTrigger value="recent">Recent Posts</TabsTrigger>
							<TabsTrigger value="scheduled">Scheduled</TabsTrigger>
							<TabsTrigger value="analytics">Analytics</TabsTrigger>
						</TabsList>

						<TabsContent value="recent">
							<div className="space-y-4">
								{[1, 2, 3].map((post) => (
									<Card key={post}>
										<CardContent className="pt-6">
											<div className="flex items-start gap-4">
												<Avatar>
													<AvatarImage
														src={`https://avatar.vercel.sh/${post}`}
													/>
													<AvatarFallback>OP</AvatarFallback>
												</Avatar>
												<div className="flex-1">
													<div className="flex items-start justify-between">
														<div>
															<p className="font-medium">Sample Post #{post}</p>
															<p className="text-muted-foreground text-sm">
																2 hours ago
															</p>
														</div>
														<Button variant="ghost" size="icon">
															<Share2 className="h-4 w-4" />
														</Button>
													</div>
													<p className="mt-2">
														This is a sample post content that was shared across
														multiple platforms.
													</p>
													<div className="mt-4 flex gap-2">
														<Badge variant="secondary">LinkedIn</Badge>
														<Badge variant="secondary">Twitter</Badge>
														<Badge variant="secondary">Bluesky</Badge>
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</TabsContent>
					</Tabs>
				</div>

				{/* Sidebar */}
				<div className="space-y-6 md:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Platform Status</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Avatar className="h-8 w-8">
											<AvatarImage src="/linkedin.png" />
											<AvatarFallback>LI</AvatarFallback>
										</Avatar>
										<span>LinkedIn</span>
									</div>
									<Badge variant="success">Connected</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Avatar className="h-8 w-8">
											<AvatarImage src="/twitter.png" />
											<AvatarFallback>X</AvatarFallback>
										</Avatar>
										<span>Twitter</span>
									</div>
									<Badge variant="success">Connected</Badge>
								</div>
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Avatar className="h-8 w-8">
											<AvatarImage src="/bluesky.png" />
											<AvatarFallback>BS</AvatarFallback>
										</Avatar>
										<span>Bluesky</span>
									</div>
									<Button variant="outline" size="sm">
										Connect
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Quick Stats</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<div className="flex items-center gap-4">
									<LineChart className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-1">
										<p className="font-medium text-sm">Total Posts</p>
										<p className="font-bold text-2xl">248</p>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<LineChart className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-1">
										<p className="font-medium text-sm">This Week</p>
										<p className="font-bold text-2xl">12</p>
									</div>
								</div>
								<div className="flex items-center gap-4">
									<LineChart className="h-4 w-4 text-muted-foreground" />
									<div className="space-y-1">
										<p className="font-medium text-sm">Scheduled</p>
										<p className="font-bold text-2xl">5</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
