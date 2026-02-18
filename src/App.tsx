import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBrandings from "./pages/admin/AdminBrandings";
import AdminBewerbungen from "./pages/admin/AdminBewerbungen";
import AdminBewerbungsgespraeche from "./pages/admin/AdminBewerbungsgespraeche";
import AdminArbeitsvertraege from "./pages/admin/AdminArbeitsvertraege";
import AdminMitarbeiter from "./pages/admin/AdminMitarbeiter";
import AdminAuftraege from "./pages/admin/AdminAuftraege";
import AdminLivechat from "./pages/admin/AdminLivechat";
import AdminBewertungen from "./pages/admin/AdminBewertungen";
import AdminAuftragstermine from "./pages/admin/AdminAuftragstermine";
import AdminEmails from "./pages/admin/AdminEmails";
import AdminSmsTemplates from "./pages/admin/AdminSmsTemplates";
import Bewerbungsgespraech from "./pages/Bewerbungsgespraech";
import Arbeitsvertrag from "./pages/Arbeitsvertrag";
import MitarbeiterLayout from "./components/mitarbeiter/MitarbeiterLayout";
import MitarbeiterDashboard from "./pages/mitarbeiter/MitarbeiterDashboard";
import AuftragDetails from "./pages/mitarbeiter/AuftragDetails";
import Bewertung from "./pages/mitarbeiter/Bewertung";
import MitarbeiterAuftraege from "./pages/mitarbeiter/MitarbeiterAuftraege";
import MitarbeiterBewertungen from "./pages/mitarbeiter/MitarbeiterBewertungen";
import MeineDaten from "./pages/mitarbeiter/MeineDaten";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="brandings" element={<AdminBrandings />} />
              <Route path="bewerbungen" element={<AdminBewerbungen />} />
              <Route path="bewerbungsgespraeche" element={<AdminBewerbungsgespraeche />} />
              <Route path="arbeitsvertraege" element={<AdminArbeitsvertraege />} />
              <Route path="mitarbeiter" element={<AdminMitarbeiter />} />
              <Route path="auftraege" element={<AdminAuftraege />} />
              <Route path="auftragstermine" element={<AdminAuftragstermine />} />
              <Route path="livechat" element={<AdminLivechat />} />
              <Route path="bewertungen" element={<AdminBewertungen />} />
              <Route path="emails" element={<AdminEmails />} />
              <Route path="sms" element={<AdminSmsTemplates />} />
            </Route>
            <Route path="/bewerbungsgespraech/:id" element={<Bewerbungsgespraech />} />
            <Route path="/arbeitsvertrag/:id" element={<Arbeitsvertrag />} />
            <Route
              path="/mitarbeiter"
              element={
                <ProtectedRoute allowedRole="user">
                  <MitarbeiterLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<MitarbeiterDashboard />} />
              <Route path="auftraege" element={<MitarbeiterAuftraege />} />
              <Route path="auftragdetails/:id" element={<AuftragDetails />} />
              <Route path="bewertung/:id" element={<Bewertung />} />
              <Route path="bewertungen" element={<MitarbeiterBewertungen />} />
              <Route path="meine-daten" element={<MeineDaten />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
