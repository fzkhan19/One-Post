"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createUser } from "@/lib/actions/createUser.action";
import {
	saveBlueskyCredentials,
	saveLinkedInCredentials,
	saveTwitterCredentials,
} from "@/lib/actions/saveCredentials.action";
import { useUser } from "@clerk/nextjs";
import { defineStepper } from "@stepperize/react";
import { ArrowRight } from "lucide-react";
import * as React from "react";

const { useStepper, steps, utils } = defineStepper(
	{
		id: "linkedin",
		title: "LinkedIn Tokens",
		description: "Enter LinkedIn credentials",
	},
	{
		id: "twitter",
		title: "Twitter Tokens",
		description: "Enter Twitter credentials",
	},
	{
		id: "bluesky",
		title: "Bluesky Tokens",
		description: "Enter Bluesky credentials",
	},
);

function MultiStepForm({ onClose }: { onClose: () => void }) {
	const stepper = useStepper();
	const currentIndex = utils.getIndex(stepper.current.id);
	const user = useUser();

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	React.useEffect(() => {
		if (user.isLoaded) {
			const userPayload = {
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				clerkId: user.user?.id!,
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				email: user.user?.primaryEmailAddress?.emailAddress!,
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				firstName: user.user?.firstName!,
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				lastName: user.user?.lastName!,
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				avatar: user.user?.imageUrl!,
			};
			createUser(userPayload);
		}
	}, [user.isLoaded]);

	// State for storing values
	const [formValues, setFormValues] = React.useState({
		linkedin: { clientId: "", clientSecret: "" },
		twitter: { apiKey: "", apiSecret: "", accessKey: "", accessToken: "" },
		bluesky: { handle: "", appPassword: "" },
	});

	// Function to handle input changes
	const handleInputChange = (step: string, field: string, value: string) => {
		setFormValues((prev) => ({
			...prev,
			[step]: { ...prev[step as keyof typeof prev], [field]: value },
		}));
	};

	// Function to submit values after each step
	const submitValues = async () => {
		const step = stepper.current.id;
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let payload: any;

		switch (step) {
			case "linkedin":
				payload = {
					clientId: formValues.linkedin.clientId,
					clientSecret: formValues.linkedin.clientSecret,
				};
				await saveLinkedInCredentials(payload);
				break;
			case "twitter":
				payload = {
					apiKey: formValues.twitter.apiKey,
					apiSecret: formValues.twitter.apiSecret,
					accessKey: formValues.twitter.accessKey,
					accessToken: formValues.twitter.accessToken,
				};
				await saveTwitterCredentials(payload);
				break;
			case "bluesky":
				payload = {
					handle: formValues.bluesky.handle,
					appPassword: formValues.bluesky.appPassword,
				};
				await saveBlueskyCredentials(payload);
				break;
			default:
				console.error("Invalid step");
				return;
		}

		if (!stepper.isLast) stepper.next();
		else console.log("Final Submission:", formValues);
	};
	return (
		<div className="w-[450px] space-y-6 rounded-lg">
			<div className="flex justify-between">
				<h2 className="font-medium text-lg">Submit API Tokens</h2>
				<span className="text-muted-foreground text-sm">
					Step {currentIndex + 1} of {steps.length}
				</span>
			</div>

			<nav aria-label="Checkout Steps" className="group my-4">
				<ol className="flex flex-col gap-2" aria-orientation="vertical">
					{stepper.all.map((step, index, array) => (
						<React.Fragment key={step.id}>
							<li className="flex flex-shrink-0 items-center gap-4">
								<Button
									type="button"
									role="tab"
									variant={index <= currentIndex ? "default" : "secondary"}
									aria-current={
										stepper.current.id === step.id ? "step" : undefined
									}
									className="flex size-10 items-center justify-center rounded-full"
									onClick={() => stepper.goTo(step.id)}
								>
									{index + 1}
								</Button>
								<span className="font-medium text-sm">{step.title}</span>
							</li>
							<div className="flex gap-4">
								<div
									className="flex justify-center"
									style={{ paddingInlineStart: "1.25rem" }}
								>
									{index < array.length - 1 && (
										<Separator
											orientation="vertical"
											className={`h-full w-[1px] ${index < currentIndex ? "bg-primary" : "bg-muted"}`}
										/>
									)}
								</div>
								<div className="my-4 flex-1">
									{stepper.current.id === step.id &&
										stepper.switch({
											linkedin: () => (
												<LinkedInTokens
													values={formValues.linkedin}
													onChange={handleInputChange}
												/>
											),
											twitter: () => (
												<TwitterTokens
													values={formValues.twitter}
													onChange={handleInputChange}
												/>
											),
											bluesky: () => (
												<BlueskyTokens
													values={formValues.bluesky}
													onChange={handleInputChange}
												/>
											),
										})}
								</div>
							</div>
						</React.Fragment>
					))}
				</ol>
			</nav>

			<div className="flex items-center justify-between">
				<Button
					className="flex items-center gap-0.5"
					onClick={onClose}
					variant="ghost"
				>
					Skip All <ArrowRight size={18} />
				</Button>

				<div className="flex justify-end gap-4">
					<Button
						variant="secondary"
						onClick={stepper.prev}
						disabled={stepper.isFirst}
					>
						Back
					</Button>
					<Button onClick={submitValues}>
						{stepper.isLast ? "Complete" : "Submit"}
					</Button>
				</div>
			</div>
		</div>
	);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const LinkedInTokens = ({ values, onChange }: any) => (
	<div className="flex gap-4">
		<div>
			<label className="font-medium text-sm">LinkedIn Client ID</label>
			<Input
				type="text"
				placeholder="Enter your LinkedIn Client ID..."
				className="mt-2 w-full"
				value={values.clientId}
				onChange={(e) => onChange("linkedin", "clientId", e.target.value)}
			/>
		</div>
		<div>
			<label className="font-medium text-sm">LinkedIn Client Secret</label>
			<Input
				type="password"
				placeholder="Enter your LinkedIn Client Secret..."
				className="mt-2 w-full"
				value={values.clientSecret}
				onChange={(e) => onChange("linkedin", "clientSecret", e.target.value)}
			/>
		</div>
	</div>
);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const TwitterTokens = ({ values, onChange }: any) => (
	<div className="grid gap-4">
		<div className="flex gap-4">
			<div>
				<label className="font-medium text-sm">Twitter API Key</label>
				<Input
					type="text"
					placeholder="Enter your Twitter API Key..."
					className="mt-2 w-full"
					value={values.apiKey}
					onChange={(e) => onChange("twitter", "apiKey", e.target.value)}
				/>
			</div>
			<div>
				<label className="font-medium text-sm">Twitter API Secret</label>
				<Input
					type="password"
					placeholder="Enter your Twitter API Secret..."
					className="mt-2 w-full"
					value={values.apiSecret}
					onChange={(e) => onChange("twitter", "apiSecret", e.target.value)}
				/>
			</div>
		</div>
		<div className="flex gap-4">
			<div>
				<label className="font-medium text-sm">Twitter Access Key</label>
				<Input
					type="text"
					placeholder="Enter your Twitter Access Key..."
					className="mt-2 w-full"
					value={values.accessKey}
					onChange={(e) => onChange("twitter", "accessKey", e.target.value)}
				/>
			</div>
			<div>
				<label className="font-medium text-sm">Twitter Access Token</label>
				<Input
					type="password"
					placeholder="Enter your Twitter Access Token..."
					className="mt-2 w-full"
					value={values.accessToken}
					onChange={(e) => onChange("twitter", "accessToken", e.target.value)}
				/>
			</div>
		</div>
	</div>
);

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const BlueskyTokens = ({ values, onChange }: any) => (
	<div className="flex gap-4">
		<div>
			<label className="font-medium text-sm">Bluesky Handle</label>
			<Input
				type="text"
				placeholder="Enter your Bluesky Handle..."
				className="mt-2 w-full"
				value={values.handle}
				onChange={(e) => onChange("bluesky", "handle", e.target.value)}
			/>
		</div>
		<div>
			<label className="font-medium text-sm">App Password</label>
			<Input
				type="password"
				placeholder="Enter your Bluesky App Password..."
				className="mt-2 w-full"
				value={values.appPassword}
				onChange={(e) => onChange("bluesky", "appPassword", e.target.value)}
			/>
		</div>
	</div>
);

export default MultiStepForm;
