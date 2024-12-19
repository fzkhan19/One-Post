import Link from "next/link";

export const metadata = { title: "404 : Not Found" };

export default function NotFound() {
	return (
		<div className="mx-3 flex h-screen flex-col items-center justify-center gap-4 pb-12 text-center sm:mr-12 sm:ml-28 lg:ml-12">
			<h1 className="font-bold text-4xl text-primary">404</h1>
			<p className="text-gray-700 text-xl">
				Oops! The page you're looking for doesn't exist.
			</p>
			<p className="text-gray-500">
				It might have been removed, or the link may be broken.
			</p>
			<Link
				href="/"
				className="mt-6 rounded-lg bg-primary px-6 py-3 text-white shadow transition duration-300 hover:bg-primary/80 hover:shadow-md"
			>
				Go Back Home
			</Link>
		</div>
	);
}
