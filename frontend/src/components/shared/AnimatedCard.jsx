export default function AnimatedCard({ children, className = "" }) {
  return <div className={`bg-white rounded-2xl border border-slate-100 p-5 ${className}`}>{children}</div>;
}
