export default function TooltipInfo({ text }) {
  return (
    <span className="relative group inline-flex">
      <span className="h-4 w-4 rounded-full bg-white/15 text-[10px] grid place-items-center text-white/70">i</span>
      <span className="hidden group-hover:block absolute z-10 w-56 bg-navy border border-white/10 text-white text-xs p-2 rounded-lg -left-2 top-5 shadow-xl">
        {text}
      </span>
    </span>
  );
}
