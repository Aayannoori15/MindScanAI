export default function AnimatedCard({ children, className = "" }) {
  return <div className={`glass-card p-5 ${className}`}>{children}</div>;
}
