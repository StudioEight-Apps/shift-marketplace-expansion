import { Compass, Layers, Shield } from "lucide-react";
import whyShiftImage from "@/assets/why-shift-hero.jpg";

const features = [
  {
    icon: Compass,
    title: "Browse Our Curated Fleet",
    mobileTitle: "Exclusive access to Villas, Cars, & Yachts",
    description: "Explore our full collection of luxury villas, exotic vehicles, and yacht experiences. Once you request your booking, dedicated concierge guidance handles the rest. Expert support, zero pressure.",
  },
  {
    icon: Layers,
    title: "One Platform, Full Experience",
    mobileTitle: "Bundle Everything on One Platform",
    description: "Bundle your entire stay in a single request: villa, exotic car, yacht day. No juggling multiple brokers or platforms. One point of contact, everything handled.",
  },
  {
    icon: Shield,
    title: "White-Glove Service",
    mobileTitle: "White-Glove Service, End-to-End",
    description: "Every property, vehicle, and vessel meets Shift's standards. One point of contact from booking through checkout. Premium curation, operational control, zero headaches.",
  },
];

const WhyShiftSection = () => {
  return (
    <section className="w-full bg-slate-50 dark:bg-black">
      <div className="flex flex-row">
        {/* Left: Text Content */}
        <div className="w-1/2 px-4 md:px-12 lg:px-16 py-8 md:py-16 flex flex-col justify-center">
          {/* Heading */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold italic text-gray-900 dark:text-white mb-8 md:mb-14 text-center">
            Shift Rentals
          </h2>

          {/* Feature Blocks */}
          <div className="flex flex-col space-y-5 md:space-y-10">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 md:gap-4">
                {/* Circular outlined icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border border-gray-400 dark:border-gray-500 flex items-center justify-center">
                    <feature.icon
                      className="w-4 h-4 md:w-5 md:h-5 text-gray-500 dark:text-gray-400"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>

                {/* Text */}
                <div>
                  <h3 className="text-[11px] md:text-lg font-semibold text-gray-800 dark:text-white mb-1 md:mb-2">
                    <span className="md:hidden">{feature.mobileTitle}</span>
                    <span className="hidden md:inline">{feature.title}</span>
                  </h3>
                  {/* Body text - hidden on mobile */}
                  <p className="hidden md:block text-[15px] text-gray-600 dark:text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Image with gradient overlay */}
        <div className="w-1/2 relative min-h-[280px] md:min-h-[500px]">
          <img
            src={whyShiftImage}
            alt="Luxury villa with exotic cars"
            className="absolute inset-0 w-full h-full object-cover object-[center_55%] md:object-[center_80%]"
          />
          {/* Left-to-right gradient overlay for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.1) 100%)'
            }}
          />
          {/* Top edge shadow for divider contrast */}
          <div
            className="absolute top-0 left-0 right-0 h-16"
            style={{
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)'
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default WhyShiftSection;
