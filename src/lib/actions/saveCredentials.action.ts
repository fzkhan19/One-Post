"use server";

import { revalidatePath } from "next/cache";
import { ID } from "node-appwrite";
import {
	APPWRITE_DATABASE_ID,
	APPWRITE_USER_COLLECTION_ID,
	databases,
} from "../appwrite.config";

export async function saveLinkedInCredentials(payload: {
	clientId: string;
	clientSecret: string;
}) {
	try {
		await databases.createDocument(
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			APPWRITE_DATABASE_ID!,
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			APPWRITE_USER_COLLECTION_ID!,
			ID.unique(),
			payload,
		);
		console.log("LinkedIn credentials saved to Appwrite:", payload);
	} catch (error) {
		console.error("Error saving LinkedIn credentials to Appwrite:", error);
	}
	revalidatePath("/dashboard");
}

export async function saveTwitterCredentials(payload: {
	apiKey: string;
	apiSecret: string;
	accessKey: string;
	accessToken: string;
}) {
	try {
		await databases.createDocument(
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			APPWRITE_DATABASE_ID!,
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			APPWRITE_USER_COLLECTION_ID!,
			ID.unique(),
			payload,
		);
		console.log("Twitter credentials saved to Appwrite:", payload);
	} catch (error) {
		console.error("Error saving Twitter credentials to Appwrite:", error);
	}
	revalidatePath("/dashboard");
}

export async function saveBlueskyCredentials(payload: {
	handle: string;
	appPassword: string;
}) {
	try {
		await databases.createDocument(
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			APPWRITE_DATABASE_ID!,
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			APPWRITE_USER_COLLECTION_ID!,
			ID.unique(),
			payload,
		);
		console.log("Bluesky credentials saved to Appwrite:", payload);
	} catch (error) {
		console.error("Error saving Bluesky credentials to Appwrite:", error);
	}
	revalidatePath("/dashboard");
}
