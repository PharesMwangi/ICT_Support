import { Navigate, Outlet, useLocation } from "react-router-dom";
import {useAuth} from "./AuthContext.jsx";
import { Spinner } from "../components/ui.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { Link } from "react-router-dom";

export function requireAuth(){
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) return <Spinner label="Loading" />;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    return <Outlet />;
}
export function publicOnly(){
    const { user, loading } = useAuth();
    if (loading) return <Spinner label="Loading" />;
    if (user) return <Navigate to="/" replace />;
    return <Outlet />;
}

export function requireAdmin(){
    const { isAdmin } = useAuth();
    if (!isAdmin){
        return(
            <EmptyState title="You do not have access to this page">
             <p>This page is for the ICT team only.</p>
             <Link className="btn" to="/">
                 Go to dashboard
             </Link>
            </EmptyState>
        );
    }
    return <Outlet />;
}