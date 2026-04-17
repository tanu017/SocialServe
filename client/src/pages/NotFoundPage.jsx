import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <p className="text-8xl font-bold text-gray-200">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-700">Page not found</h1>
      <p className="mt-2 max-w-md text-center text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Go Home
        </Link>
        <Link
          to="/browse/donations"
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Browse Donations
        </Link>
      </div>
    </div>
  );
}
