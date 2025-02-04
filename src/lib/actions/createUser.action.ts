"use server";

import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import {
	APPWRITE_DATABASE_ID,
	APPWRITE_USER_COLLECTION_ID,
	databases,
} from "../appwrite.config";

export async function createUser(payload: {
	clerkId: string;
	email: string;
	firstName: string;
	lastName: string;
	avatar: string;
}) {
	try {
		const user = await databases.listDocuments(
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			APPWRITE_DATABASE_ID!,
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			APPWRITE_USER_COLLECTION_ID!,
			[Query.equal("clerkId", payload.clerkId)],
		);

		if (user.total === 0) {
			const newPayload = {
				...payload,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};
			await databases.createDocument(
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				APPWRITE_DATABASE_ID!,
				// biome-ignore lint/style/noNonNullAssertion: <explanation>
				APPWRITE_USER_COLLECTION_ID!,
				ID.unique(),
				newPayload,
			);
			console.log("User created in Appwrite:", newPayload);
		} else console.log("User already exists in Appwrite:", payload);
	} catch (error) {
		console.error("Error creating user in Appwrite:", error);
	}
	revalidatePath("/dashboard");
}
