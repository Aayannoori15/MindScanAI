import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[50vh] grid place-items-center">
      <div className="text-center">
        <p className="font-display text-4xl">404</p>
        <Link to="/" className="text-teal mt-3 inline-block">
          Back home
        </Link>
      </div>
    </div>
  );
}
