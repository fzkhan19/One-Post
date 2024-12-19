import crypto from "node:crypto";

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;

// Ensure the ENCRYPTION_KEY is 32 bytes
const ENCRYPTION_KEY_BUFFER = crypto
	.createHash("sha256")
	.update(ENCRYPTION_KEY)
	.digest();

const IV_LENGTH = 16;

console.log("ENCRYPTION KEY::::", ENCRYPTION_KEY);

export function encrypt(text: string): string {
	const iv = crypto.randomBytes(IV_LENGTH);
	const cipher = crypto.createCipheriv(
		"aes-256-cbc",
		ENCRYPTION_KEY_BUFFER,
		iv,
	);
	let encrypted = cipher.update(text);
	encrypted = Buffer.concat([encrypted, cipher.final()]);
	return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(text: string): string {
	const [ivHex, encryptedHex] = text.split(":");
	const iv = Buffer.from(ivHex, "hex");
	const encryptedText = Buffer.from(encryptedHex, "hex");
	const decipher = crypto.createDecipheriv(
		"aes-256-cbc",
		ENCRYPTION_KEY_BUFFER,
		iv,
	);
	let decrypted = decipher.update(encryptedText);
	decrypted = Buffer.concat([decrypted, decipher.final()]);
	return decrypted.toString();
}
