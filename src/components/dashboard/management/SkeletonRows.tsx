export function SkeletonRows({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-4 space-y-2">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`sk-${index}`}
          className="h-14 animate-pulse rounded-md border"
          style={{ borderColor: "rgba(212, 165, 116, 0.16)", background: "rgba(245, 230, 211, 0.06)" }}
        />
      ))}
    </div>
  );
}
