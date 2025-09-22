export default function DashboardLoading() {
	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8">
			<div className="flex items-center justify-between">
				<div className="h-6 w-32 rounded bg-muted" />
				<div className="h-6 w-20 rounded bg-muted" />
			</div>
			<div className="h-14 rounded-xl border bg-muted/50" />
			<div className="space-y-2">
				{Array.from(
					{ length: 10 },
					(_, index) => `dashboard-loading-${index}`,
				).map((key) => (
					<div
						key={key}
						className="flex items-center justify-between rounded-lg border border-transparent bg-muted/30 px-3 py-3"
					>
						<div className="flex items-center gap-3">
							<div className="size-8 rounded-md bg-muted" />
							<div className="h-4 w-48 rounded bg-muted" />
						</div>
						<div className="h-4 w-16 rounded bg-muted" />
					</div>
				))}
			</div>
		</div>
	);
}
