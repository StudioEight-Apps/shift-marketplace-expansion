import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { SearchProvider } from "./context/SearchContext";
import { ContactProvider } from "./context/ContactContext";
import ContactModal from "./components/shift/ContactModal";
import ListWithUsModal from "./components/shift/ListWithUsModal";
import Index from "./pages/Index";
import ListingDetail from "./pages/ListingDetail";
import Profile from "./pages/Profile";
import MyTrips from "./pages/MyTrips";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <SearchProvider>
          <ContactProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ContactModal />
              <ListWithUsModal />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/listing/:id" element={<ListingDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/trips" element={<MyTrips />} />
                  <Route path="/terms" element={<Terms />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ContactProvider>
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
