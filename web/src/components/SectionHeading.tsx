type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const isCenter = align === "center";
  return (
    <div className={`${isCenter ? "text-center max-w-3xl mx-auto" : "max-w-3xl"}`}>
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-balance text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base md:text-lg text-gray-600 leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
