const { TwitterApi } = require("twitter-api-v2");
require("dotenv").config({ path: ".env.local" });

const client = new TwitterApi({
	appKey: process.env.TWITTER_API_KEY || "",
	appSecret: process.env.TWITTER_API_SECRET || "",
	accessToken: process.env.TWITTER_ACCESS_TOKEN || "",
	accessSecret: process.env.TWITTER_ACCESS_SECRET || "",
});

async function test() {
	try {
		console.log("Attempting to post test tweet...");
		const result = await client.v2.tweet("Test tweet from One-Post " + new Date().toISOString());
		console.log("Success!", result.data);
	} catch (error) {
		console.error("Failed!");
		if (error.data) {
			console.error(JSON.stringify(error.data, null, 2));
		} else {
			console.error(error);
		}
	}
}

test();
