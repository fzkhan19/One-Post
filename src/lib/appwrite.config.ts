import * as sdk from "node-appwrite";

export const {
	APPWRITE_ENDPOINT,
	APPWRITE_PROJECT_ID,
	APPWRITE_KEY,
	APPWRITE_DATABASE_ID,
	APPWRITE_USER_COLLECTION_ID,
	NEXT_PUBLIC_APPWRITE_ENDPOINT: ENDPOINT,
} = process.env;

const client = new sdk.Client();

client
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	.setEndpoint(ENDPOINT!)
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	.setProject(APPWRITE_PROJECT_ID!)
	// biome-ignore lint/style/noNonNullAssertion: <explanation>
	.setKey(APPWRITE_KEY!);

export const databases = new sdk.Databases(client);
export const users = new sdk.Users(client);
