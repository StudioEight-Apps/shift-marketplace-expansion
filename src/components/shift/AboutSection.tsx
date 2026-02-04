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
    <section className="w-full border-t border-border-subtle py-16 md:py-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <h2 className="text-center text-[28px] md:text-[36px] font-bold text-foreground mb-12 md:mb-16">
          Shift Cities, Maintain Standards
        </h2>

        {/* Feature Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col items-center text-center">
              {/* Icon */}
              <div className="mb-5">
                <feature.icon 
                  className="w-10 h-10 md:w-12 md:h-12 stroke-[1.25]" 
                  style={{ color: '#D4A853' }} 
                />
              </div>
              
              {/* Title */}
              <h3 className="text-lg md:text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm md:text-[15px] text-muted-foreground leading-relaxed max-w-[280px]">
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
