const ROW_COUNT = 8;

/** Gray bars in the shape of table rows. A table shows them while its data loads. */
export function TableSkeleton() {
  const rows = Array.from({ length: ROW_COUNT }, (_, index) => index);

  return (
    <div aria-busy="true" aria-label="Loading" className="flex flex-col">
      <div className="h-9 border-b bg-muted" />
      {rows.map((row) => (
        <div key={row} className="flex h-10 items-center gap-6 border-b px-3">
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-accent" />
          <div className="h-3 w-1/6 animate-pulse rounded-full bg-accent" />
          <div className="h-3 w-1/6 animate-pulse rounded-full bg-accent" />
        </div>
      ))}
    </div>
  );
}
