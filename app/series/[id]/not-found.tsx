import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Series Not Found</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        The motorsport series you are looking for does not exist or is not yet supported.
      </p>
      <Link
        href="/"
        className="bg-primary text-white rounded-md px-4 py-2 font-medium hover:bg-primary/90"
      >
        Return to Home
      </Link>
    </div>
  );
} 