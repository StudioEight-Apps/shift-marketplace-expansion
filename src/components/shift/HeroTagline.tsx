import heroImage from "@/assets/hero-luxury.jpg";

const HeroTagline = () => {
  return (
    <section className="relative w-full h-[180px] md:h-[250px] overflow-hidden">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Luxury lifestyle"
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Centered Text */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <h1 
          className="text-white text-[36px] md:text-[56px] font-bold tracking-[-1px] text-center"
        >
          LUXURY TRAVEL, MADE SIMPLE.
        </h1>
      </div>
    </section>
  );
};

export default HeroTagline;
