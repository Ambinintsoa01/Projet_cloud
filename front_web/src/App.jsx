import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import RegisterCustomer from "./pages/RegisterCustomer";
import EditCustomer from "./pages/EditCustomer";
import Map from "./pages/Map";
import BlockedUsers from "./pages/BlockedUsers";
import ProblemsManagement from "./pages/ProblemsManagement";
import CreateSignalement from "./pages/CreateSignalement";
import Reports from "./pages/Reports";
import SignalementsTable from "./pages/SignalementsTable";
import VisitorDashboard from "./pages/VisitorDashboard";
import Analytics from "./pages/Analytics";
import { authService } from "./services/api";
import "./App.css";

// Composant de protection des routes
function ProtectedRoute({ children, requiredRole = null }) {
  // Vérifier si l'utilisateur est authentifié
  if (!authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  // Vérifier le rôle si requis
  if (requiredRole) {
    const user = authService.getCurrentUser();
    const userRoles = user?.roles || [];
    if (!userRoles.includes(requiredRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Home - Visitor Dashboard with Map */}
        <Route path="/" element={<VisitorDashboard />} />
        
        {/* Auth */}
        <Route path="/login" element={<Auth />} />

        {/* Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="register-customer" element={<RegisterCustomer />} />
          <Route path="edit-customer" element={<EditCustomer />} />
          <Route path="blocked-users" element={<BlockedUsers />} />
          <Route 
            path="problems-management" 
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <ProblemsManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="create-signalement" 
            element={
              <ProtectedRoute requiredRole="MANAGER">
                <CreateSignalement />
              </ProtectedRoute>
            } 
          />

          <Route path="reports" element={<Reports />} />
          <Route path="signalements-table" element={<SignalementsTable />} />
          <Route path="analytics" element={<Analytics />} />

          {/* MAP */}
          <Route path="map" element={<Map />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
