import { Home, Car, Anchor } from "lucide-react";

const benefits = [
  {
    icon: Home,
    title: "Luxury Stays",
    text: "From Waterfront villas to City Penthouses to Snowy Cabins",
  },
  {
    icon: Car,
    title: "Exotic Vehicles",
    text: "Lamborghini, Rolls Royce, Ferrari and more",
  },
  {
    icon: Anchor,
    title: "Private Charters",
    text: "40-100ft yachts with crew",
  },
];

const BundlingBenefits = () => {
  return (
    <section className="w-full bg-[#0a0a0a] py-16 md:py-20 px-6 md:px-10">
      <div className="max-w-5xl mx-auto">
        {/* Copy Block */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-[28px] md:text-[32px] font-bold text-white mb-4">
            Shift Cities, Maintain Lifestyle.
          </h2>
          <p className="text-[16px] md:text-[18px] text-gray-400 max-w-2xl mx-auto leading-relaxed">
            In any major city, access luxury villas, exotic vehicles, and private yacht charters.
            <br className="hidden md:block" />
            Book individually or bundle them during checkout for a seamless trip experience.
          </p>
        </div>

        {/* 3 Icon Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 mb-10">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center text-center">
              <div className="mb-4">
                <benefit.icon className="w-[60px] h-[60px] text-white stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-[240px]">
                {benefit.text}
              </p>
            </div>
          ))}
        </div>

        {/* Bundle CTA Text */}
        <p className="text-center text-[#00D9FF] text-sm font-medium">
          Bundle any combination for your perfect trip
        </p>
      </div>
    </section>
  );
};

export default BundlingBenefits;
