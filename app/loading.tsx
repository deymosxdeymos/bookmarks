export default function Loading() {
	return (
		<>
			<div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted-foreground/30 animate-[loading-sweep_1.5s_ease-in-out_infinite]" />
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-sm text-muted-foreground">Loading…</div>
			</div>
		</>
	);
}
