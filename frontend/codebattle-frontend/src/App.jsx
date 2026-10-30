
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import VerifyCodeforces from "./pages/VerifyCodeforces";
import CreateBattle from "./pages/CreateBattle";
import JoinBattle from "./pages/JoinBattle";
import BattleRoom from "./pages/BattleRoom";
import BattleHistory from "./pages/BattleHistory";
import BattleResult from "./pages/BattleResult";
import Profile from "./pages/Profile";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    return token
        ? children
        : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem("token");

    return token
        ? <Navigate to="/dashboard" replace />
        : children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                />

                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />

                <Route
                    path="/register"
                    element={
                        <PublicRoute>
                            <Register />
                        </PublicRoute>
                    }
                />

                {/* Protected routes */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/verify-codeforces"
                    element={
                        <ProtectedRoute>
                            <VerifyCodeforces />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/create-battle"
                    element={
                        <ProtectedRoute>
                            <CreateBattle />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/join-battle"
                    element={
                        <ProtectedRoute>
                            <JoinBattle />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/battle-history"
                    element={
                        <ProtectedRoute>
                            <BattleHistory />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/battle/:battleId"
                    element={
                        <ProtectedRoute>
                            <BattleRoom />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/battle/:battleId/result"
                    element={
                        <ProtectedRoute>
                            <BattleResult />
                        </ProtectedRoute>
                    }
                />

                {/* Unknown route */}
                <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
