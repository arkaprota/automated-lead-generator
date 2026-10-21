import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="py-24 flex flex-col items-center justify-center p-6 text-white">
      <h2 className="text-3xl font-bold">404 - Page Not Found</h2>
      <p className="mt-2 text-slate-400 text-sm">The requested resource could not be found.</p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
