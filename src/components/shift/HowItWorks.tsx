import { MessageSquareText, Search, ArrowRight, Package } from "lucide-react";
import { useContact } from "@/context/ContactContext";

const HowItWorks = () => {
  const { openContact } = useContact();

  return (
    <section className="border-t border-border-subtle bg-card/50 py-16 md:py-20">
      <div className="container px-4 md:px-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">
            Browse Our Fleet
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Shift handles everything for you every step of the way.
          </p>
          <p className="text-primary font-semibold text-lg mt-3">
            2 Ways to Book
          </p>
        </div>

        {/* Two paths */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Path 1: Concierge */}
          <div className="rounded-2xl border border-border-subtle bg-background p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/40" />
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <MessageSquareText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Concierge Request</h3>
                <p className="text-xs text-muted-foreground">Tell us what you need, we handle the rest</p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                {
                  step: "1",
                  title: "Tell us what you need",
                  desc: "Send us your dates, city, and preferences. Villas, cars, yachts — or package all three for a top-tier trip.",
                },
                {
                  step: "2",
                  title: "Get curated options",
                  desc: "Our team pulls the best available inventory and sends you a personalized quote within the hour.",
                },
                {
                  step: "3",
                  title: "Confirm & enjoy",
                  desc: "Lock in your booking and we handle every detail from check-in to checkout. No surprises, no hidden fees.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={openContact}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Path 2: Browse & Request */}
          <div className="rounded-2xl border border-border-subtle bg-background p-6 md:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-foreground/20 to-foreground/5" />
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-foreground/10">
                <Search className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Browse & Request</h3>
                <p className="text-xs text-muted-foreground">Explore the fleet, then request to book</p>
              </div>
            </div>

            <div className="space-y-5">
              {[
                {
                  step: "1",
                  title: "Browse the fleet",
                  desc: "Search by city and dates. Filter villas, cars, and yachts by what matters to you.",
                },
                {
                  step: "2",
                  title: "Package your trip",
                  desc: "Mix and match stays, cars, and yachts. Add extras like a private chef or jet skis to build the full experience.",
                },
                {
                  step: "3",
                  title: "Request to book",
                  desc: "Submit your request and our team confirms availability within 1 hour. No commitment until we confirm.",
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/10 text-foreground text-sm font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground/70 transition-colors"
            >
              Start browsing <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom banner */}
        <div className="mt-8 rounded-2xl bg-primary/5 border border-primary/20 p-5 md:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Package className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground">Package your entire trip</p>
              <p className="text-xs text-muted-foreground">Combine villas, cars, and yachts into one seamless booking. Shift handles everything for you.</p>
            </div>
          </div>
          <button
            onClick={openContact}
            className="shrink-0 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Plan My Trip
          </button>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
