import Link from "next/link";

interface MobileMenuProps {
  isMenuOpen: boolean;
  toggleMenu: () => void;
  isAuthenticated: boolean;
  pathname: string;
  user: { email: string } | null;
  loading: boolean;
  logout: () => void;
}

export default function MobileMenu({
  isMenuOpen,
  isAuthenticated,
  pathname,
  user,
  loading,
  logout,
}: MobileMenuProps) {
  if (!isMenuOpen) return null;

  return (
    <div className="sm:hidden">
      <div className="pt-2 pb-3 space-y-1">
        {isAuthenticated && (
          <Link
            href="/documents"
            className={`${
              pathname === "/documents"
                ? "bg-blue-50 border-blue-500 text-blue-700"
                : "border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800"
            } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
          >
            My Documents
          </Link>
        )}
      </div>

      <div className="pt-4 pb-3 border-t border-gray-200">
        {loading ? (
          <div className="px-4 py-2">
            <div className="animate-pulse h-6 bg-gray-200 rounded"></div>
          </div>
        ) : isAuthenticated ? (
          <div>
            <div className="px-4 py-3 flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {user?.email.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/profile"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Your Profile
              </Link>
              <button
                onClick={logout}
                className="w-full text-left block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <Link
              href="/login"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Log in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}