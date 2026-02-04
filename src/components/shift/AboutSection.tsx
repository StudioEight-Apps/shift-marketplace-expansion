import { Compass, Layers, Shield } from "lucide-react";

const features = [
  {
    icon: Compass,
    title: "Browse Our Curated Fleet",
    description: "Every vehicle, villa, and yacht is hand-selected to meet our exacting standards for luxury, performance, and reliability.",
  },
  {
    icon: Layers,
    title: "One Platform, Full Experience",
    description: "Book your entire trip in one place. Seamlessly combine accommodations, exotic cars, and private charters.",
  },
  {
    icon: Shield,
    title: "White-Glove Service",
    description: "Dedicated concierge support from booking to checkout. We handle the details so you can focus on the experience.",
  },
];

const AboutSection = () => {
  return (
    <section className="w-full border-t border-border-subtle py-16 px-6">
      <div className="max-w-[1300px] mx-auto">
        {/* Heading */}
        <h2 className="text-center text-[28px] md:text-[36px] font-bold text-foreground mb-16">
          Shift Cities, Maintain Standards
        </h2>

        {/* Feature Blocks - Mobile: stacked with spacing, Desktop: 3 columns */}
        <div className="flex flex-col space-y-16 md:space-y-0 md:grid md:grid-cols-3 md:gap-8">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center md:items-center">
              {/* Icon */}
              <div className="mb-6">
                <feature.icon 
                  className="w-10 h-10 md:w-12 md:h-12 text-gray-400" 
                  strokeWidth={1.5}
                />
              </div>
              
              {/* Title */}
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              
              {/* Description - centered on mobile, left-aligned on desktop */}
              <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed max-w-[300px] text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
