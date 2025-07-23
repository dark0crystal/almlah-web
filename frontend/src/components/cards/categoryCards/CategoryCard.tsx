
import Image from "next/image";

const categories = [
  {
    title: "حياك حياك ",
    image: "/pic/card-1.jpeg",
  },
    {
    title: "حياك حياك ",
    image: "/pic/card-1.jpeg",
  },
    {
    title: "حياك حياك ",
    image: "/pic/card-1.jpeg",
  },
];

export default function CategoryCard() {
  return (
    <div className="px-4">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {categories.map((item, index) => (
          <div
            key={index}
            className="relative min-w-[160px] h-[160px] rounded-xl overflow-hidden shadow-md shrink-0"
          >
            {/* Background Image */}
            <Image
              src={item.image}
              alt={item.title}
              fill
              className="object-cover"
            />

            {/* Shadow Gradient Overlay */}
             <div className="absolute inset-0 bg-gradient-to-tl from-[oklch(55.4%_0.135_66.442)] to-transparent" />

            {/* Optional text (on top of shadow) */}
            <div className="absolute bottom-2 right-2 text-white text-sm font-bold">
              {item.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

}