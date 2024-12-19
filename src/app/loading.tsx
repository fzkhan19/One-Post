import Loader from "@/components/ui/loader";

export default function Loading() {
	return (
		<div className="-mt-24 flex h-screen w-full items-center justify-center">
			<Loader />
		</div>
	);
}
