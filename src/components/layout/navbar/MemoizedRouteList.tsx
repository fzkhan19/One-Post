import { Button } from "@/components/ui/button";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import Link from "next/link";
import { useMemo } from "react";

export const MemoizedRouteList = ({
	routeList,
}: {
	routeList: {
		href: string;
		label: string;
	}[];
}) => {
	const routes = useMemo(() => routeList, [routeList]);
	return (
		<>
			{routes.map(({ href, label }) => (
				<NavigationMenuLink key={href} asChild>
					<Link href={href} className="px-2 font-semibold text-sm opacity-70">
						<Button
							className="uppercase tracking-tighter"
							variant={"linkHover2"}
						>
							{label}
						</Button>
					</Link>
				</NavigationMenuLink>
			))}
		</>
	);
};
