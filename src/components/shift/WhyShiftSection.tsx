import { Compass, Layers, Shield } from "lucide-react";
import whyShiftImage from "@/assets/why-shift-hero.jpg";

const features = [
  {
    icon: Compass,
    title: "Browse Our Curated Fleet",
    description: "Explore our full collection of luxury villas, exotic vehicles, and yacht experiences. Once you request your booking, dedicated concierge guidance handles the rest. Expert support, zero pressure.",
  },
  {
    icon: Layers,
    title: "One Platform, Full Experience",
    description: "Bundle your entire stay in a single request: villa, exotic car, yacht day. No juggling multiple brokers or platforms. One point of contact, everything handled.",
  },
  {
    icon: Shield,
    title: "White-Glove Service",
    description: "Every property, vehicle, and vessel meets Shift's standards. One point of contact from booking through checkout. Premium curation, operational control, zero headaches.",
  },
];

const WhyShiftSection = () => {
  return (
    <section className="w-full bg-black dark:bg-black">
      <div className="flex flex-row">
        {/* Left: Text Content */}
        <div className="w-1/2 px-4 md:px-12 lg:px-16 py-6 md:py-16 flex flex-col justify-center">
          {/* Heading */}
          <h2 className="text-xl md:text-3xl lg:text-4xl font-light italic text-white mb-6 md:mb-14">
            Why Shift
          </h2>

          {/* Feature Blocks */}
          <div className="flex flex-col space-y-4 md:space-y-10">
            {features.map((feature) => (
              <div key={feature.title} className="flex items-start gap-3 md:gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                  <feature.icon 
                    className="w-5 h-5 md:w-7 md:h-7 text-gray-400" 
                    strokeWidth={1.25}
                  />
                </div>
                
                {/* Text */}
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-white md:mb-2">
                    {feature.title}
                  </h3>
                  {/* Body text - hidden on mobile */}
                  <p className="hidden md:block text-[15px] text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Image with overlay */}
        <div className="w-1/2 relative min-h-[220px] md:min-h-[500px]">
          <img
            src={whyShiftImage}
            alt="Luxury villa with exotic cars"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* 30% opacity overlay */}
          <div className="absolute inset-0 bg-black/30" />
        </div>
      </div>
    </section>
  );
};

export default WhyShiftSection;
