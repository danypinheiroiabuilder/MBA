export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <div className="text-xs text-expense">{message}</div>;
}
