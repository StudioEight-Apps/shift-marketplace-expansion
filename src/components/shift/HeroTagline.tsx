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
      
      {/* Dark Overlay - reduced opacity */}
      <div className="absolute inset-0 bg-black/25" />
      
      {/* Centered Text */}
      <div className="relative z-10 flex items-center justify-center h-full px-4">
        <h1 
          className="text-white text-[28px] md:text-[44px] font-medium italic tracking-wide text-center"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          Book Luxury Anywhere In The World
        </h1>
      </div>
    </section>
  );
};

export default HeroTagline;
