import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="text-center">
        <p className="eyebrow mb-2">Not found</p>
        <p className="font-display text-5xl text-white">404</p>
        <Link to="/" className="text-teal mt-4 inline-block hover:brightness-110">
          Back home
        </Link>
      </div>
    </div>
  );
}
