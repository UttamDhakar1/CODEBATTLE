
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import api from "../services/api";

export default function ProtectedRoute({ children, allowUnverified = false }) {
    const [status, setStatus] = useState("loading");

    useEffect(() => {
        let cancelled = false;

        async function checkUser() {
            const token = localStorage.getItem("token");

            if (!token) {
                if (!cancelled) {
                    setStatus("unauthenticated");
                }
                return;
            }

            try {
                const response = await api.get("/auth/me");
                const user = response.data.user ?? response.data;

                if (!cancelled) {
                    setStatus(
                        user.codeforcesVerified === true
                            ? "verified"
                            : "unverified"
                    );
                }
            } catch (error) {
                if (!cancelled) {
                    localStorage.removeItem("token");
                    setStatus("unauthenticated");
                }
            }
        }

        checkUser();

        return () => {
            cancelled = true;
        };
    }, []);

    if (status === "loading") {
        return (
            <div style={{ color: "white", padding: "30px" }}>
                Checking account verification...
            </div>
        );
    }

    if (status === "unauthenticated") {
        return <Navigate to="/login" replace />;
    }

    if (status === "unverified" && !allowUnverified) {
        return <Navigate to="/verify-codeforces" replace />;
    }

    // Supports both children-based routes and nested Outlet routes.
    return children ?? <Outlet />;
}
