import heroImage from "@/assets/hero-luxury.jpg";

const HeroTagline = () => {
  return (
    <section className="relative w-full h-[238px] md:h-[480px] xl:h-[540px] 2xl:h-[600px] overflow-hidden">
      {/* Background Image */}
      <img
        src={heroImage}
        alt="Luxury lifestyle"
        className="absolute inset-0 w-full h-full object-cover object-[center_35%] md:object-[center_42%] xl:object-center"
      />
      
      {/* Dark Overlay - lighter for visibility */}
      <div className="absolute inset-0 bg-black/20" />
      
      {/* Centered Text */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <h1 
          className="text-white text-[28px] md:text-[44px] font-bold tracking-widest text-center uppercase"
          style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 1), 0 2px 8px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.7)' }}
        >
          Curated Luxury Travel
        </h1>
        <p 
          className="text-white text-[16px] md:text-[18px] font-medium tracking-wide text-center mt-2"
          style={{ textShadow: '0 4px 16px rgba(0, 0, 0, 1), 0 2px 8px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 0, 0, 0.7)' }}
        >
          Villas • Cars • Yachts
        </p>
      </div>
    </section>
  );
};

export default HeroTagline;
