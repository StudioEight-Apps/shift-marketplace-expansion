const AboutSection = () => {
  return (
    <section className="relative w-full bg-slate-100 dark:bg-black">
      {/* Top divider line with glow - dark mode only */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-500 to-transparent hidden dark:block" />
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-700/20 to-transparent pointer-events-none hidden dark:block" />

      {/* Content */}
      <div className="py-12 md:py-16 px-6">
        <div className="max-w-[900px] mx-auto text-center">
          <p className="text-gray-700 dark:text-white text-base md:text-lg lg:text-xl font-light italic leading-relaxed tracking-wide">
            Curated luxury stays, cars, and yachts — booked together or separately,
            <br className="hidden md:block" />
            {" "}managed end-to-end.
          </p>
        </div>
      </div>

      {/* Bottom divider line with stronger glow - dark mode only */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent hidden dark:block" />
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-600/30 to-transparent pointer-events-none hidden dark:block" />
    </section>
  );
};

export default AboutSection;
