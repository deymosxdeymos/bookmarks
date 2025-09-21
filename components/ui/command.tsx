import { forwardRef } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/lib/utils";

export const Command = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
	<CommandPrimitive
		ref={ref}
		className={cn(
			"flex h-80 w-full flex-col overflow-hidden rounded-md border",
			className,
		)}
		{...props}
	/>
));
Command.displayName = "Command";
