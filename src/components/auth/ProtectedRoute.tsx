import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading, devBypass } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f2] text-[#1d1d1f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-black/15 border-t-black" />
      </div>
    );
  }

  if (!session && !devBypass) {
    return <Navigate to="/signin" replace state={{ from: location.pathname }} />;
  }

  return children;
}
