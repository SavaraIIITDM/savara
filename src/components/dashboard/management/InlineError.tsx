export function InlineError({ message }: { message: string }) {
  return (
    <p
      className="mt-3 rounded-md border px-3 py-2 text-sm"
      style={{ borderColor: "rgba(255, 140, 122, 0.5)", background: "rgba(255, 140, 122, 0.08)", color: "#ffb4a9" }}
    >
      {message}
    </p>
  );
}
