import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import Header from "@/components/shift/Header";
import Footer from "@/components/shift/Footer";
import { Badge } from "@/components/ui/badge";
import { useAuth, BookingRequest } from "@/context/AuthContext";

const statusColors: Record<BookingRequest["status"], string> = {
  New: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Contacted: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  Confirmed: "bg-green-500/20 text-green-400 border-green-500/30",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const MyTrips = () => {
  const navigate = useNavigate();
  const { user, bookingRequests, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container px-6 py-12 text-center text-muted-foreground">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 container px-6 py-8 max-w-3xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h1 className="text-2xl font-semibold text-foreground mb-8">My Trips</h1>

        {bookingRequests.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">No booking requests yet</p>
            <button
              onClick={() => navigate("/")}
              className="text-primary hover:underline text-sm"
            >
              Browse listings
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {bookingRequests
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
              .map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl bg-card border border-border-subtle p-5"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {request.destination}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(request.checkIn)} - {formatDate(request.checkOut)}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${statusColors[request.status]}`}
                    >
                      {request.status}
                    </Badge>
                  </div>

                  {/* Items */}
                  <div className="border-t border-border-subtle pt-3 space-y-2">
                    {request.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.type}: {item.name}
                        </span>
                        <span className="text-foreground">${item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-border-subtle">
                    <span className="text-xs text-muted-foreground font-mono">{request.id}</span>
                    <span className="font-semibold text-primary">
                      ${request.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MyTrips;
