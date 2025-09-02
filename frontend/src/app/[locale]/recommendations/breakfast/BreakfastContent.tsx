"use client"

import RecommendationImage from "../components/RecommendationImage";
import RecommendationTitle from "../components/RecommendationTitle";
import RecommendationDescription from "../components/RecommendationDescription";
import img from "./assets/DSC09943.jpg"

interface BreakfastContentProps {
  locale: string;
}

export default function BreakfastContent({ locale }: BreakfastContentProps) {
  const restaurants = [
    {
      id: 1,
      name: "مقهى الصباح الذهبي",
      nameEn: "Golden Morning Cafe",
      story: "في قلب المدينة القديمة، يقف مقهى الصباح الذهبي كشاهد على تراث الضيافة العربية الأصيلة. يبدأ اليوم هنا مع رائحة الخبز الطازج المخبوز في الفرن التقليدي، والقهوة العربية التي تُحضر بعناية فائقة على الفحم.",
      storyEn: "In the heart of the old city, Golden Morning Cafe stands as a testament to authentic Arab hospitality. The day begins here with the aroma of fresh bread baked in traditional ovens and Arabic coffee carefully prepared over charcoal.",
      signature: "الفطار الشامي التقليدي مع الجبن البلدي والزيتون والعسل الطبيعي",
      signatureEn: "Traditional Levantine breakfast with local cheese, olives, and natural honey",
      image: img,
      rating: 4.8,
      location: "البلدة القديمة، شارع الملك فيصل",
      locationEn: "Old Town, King Faisal Street"
    },
    {
      id: 2,
      name: "بيت الفطائر",
      nameEn: "House of Pancakes",
      story: "أسسته الحاجة أم محمد قبل عشرين عاماً، وأصبح اليوم من أشهر المطاعم المختصة بالفطائر والمعجنات. السر في النجاح يكمن في العجينة المحضرة يومياً بوصفة عائلية موروثة عبر الأجيال.",
      storyEn: "Founded by Hajja Um Mohammed twenty years ago, it has become one of the most famous restaurants specializing in pancakes and pastries. The secret to success lies in the dough prepared daily with a family recipe passed down through generations.",
      signature: "فطائر الجبن والسبانخ مع الشاي الأحمر التركي",
      signatureEn: "Cheese and spinach pastries with Turkish red tea",
      image: "/pancakes.jpg",
      rating: 4.6,
      location: "حي الملز، طريق الملك عبدالله",
      locationEn: "Malaz District, King Abdullah Road"
    },
    {
      id: 3,
      name: "مطعم الفجر",
      nameEn: "Al Fajr Restaurant",
      story: "يفتح أبوابه مع صلاة الفجر، ويستقبل الزبائن بالترحاب الحار والإفطار الشعبي الأصيل. المطعم متخصص في الأكلات التراثية التي تذكرنا بطعم البيت وحنان الأم.",
      storyEn: "Opens its doors at dawn prayer, welcoming customers with warm hospitality and authentic traditional breakfast. The restaurant specializes in heritage dishes that remind us of home cooking and mother's care.",
      signature: "الفول المدمس مع الطحينة والسلطة العربية",
      signatureEn: "Fava beans with tahini and Arabic salad",
      image: "/traditional-breakfast.jpg",
      rating: 4.9,
      location: "حي النسيم، شارع عثمان بن عفان",
      locationEn: "Al Naseem District, Othman Ibn Affan Street"
    }
  ];

  return (
    <>
      {/* Page Header */}
      <article className="prose prose-lg max-w-none">
        <div className="text-center mb-16">
          <RecommendationTitle
            title={locale === 'ar' ? "رحلة في عالم الإفطار الأصيل" : "A Journey Through Authentic Breakfast"}
            icon="🥞"
            size="xl"
            align="center"
            gradient="from-amber-500 to-orange-600"
            locale={locale}
          />
          <RecommendationDescription
            description={locale === 'ar' 
              ? "استكشف معنا أفضل مطاعم الإفطار التي تحكي قصص النكهات الأصيلة والتراث العريق في كل لقمة"
              : "Join us as we explore the finest breakfast restaurants that tell stories of authentic flavors and rich heritage in every bite"
            }
            size="large"
            align="center"
            maxWidth="max-w-4xl"
            className="mt-6"
            locale={locale}
          />
        </div>

        {/* Hero Image */}
        <div className="mb-20">
          <RecommendationImage src={img} alt="breakfast" height="h-96" className="rounded-3xl" />
        </div>

        {/* Golden Morning Cafe Section */}
        <section className="mb-20">
          <div className="mb-8">
            <RecommendationTitle
              title={locale === 'ar' ? restaurants[0].name : restaurants[0].nameEn}
              size="large"
              align={locale === 'ar' ? 'right' : 'left'}
              className="mb-4"
              locale={locale}
            />
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <span className="text-xl">⭐</span>
                <span className="font-semibold">{restaurants[0].rating}</span>
              </div>
              <span className="text-sm">
                📍 {locale === 'ar' ? restaurants[0].location : restaurants[0].locationEn}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <RecommendationImage
              src={restaurants[0].image}
              alt={locale === 'ar' ? restaurants[0].name : restaurants[0].nameEn}
              height="h-80"
              gradient="from-amber-400 to-orange-500"
              className="rounded-2xl"
            />
          </div>

          <div className="mb-8">
            <RecommendationDescription
              description={locale === 'ar' ? restaurants[0].story : restaurants[0].storyEn}
              size="medium"
              align={locale === 'ar' ? 'right' : 'left'}
              maxWidth="max-w-none"
              className="leading-loose"
              locale={locale}
            />
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-6 rounded-lg mb-12">
            <h4 className={`font-bold text-amber-800 mb-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              {locale === 'ar' ? "الطبق المميز:" : "Signature Dish:"}
            </h4>
            <p className={`text-amber-700 text-lg ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              {locale === 'ar' ? restaurants[0].signature : restaurants[0].signatureEn}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-12">
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mx-auto"></div>
          </div>
        </section>

        {/* House of Pancakes Section */}
        <section className="mb-20">
          <div className="mb-8">
            <RecommendationTitle
              title={locale === 'ar' ? restaurants[1].name : restaurants[1].nameEn}
              size="large"
              align="center"
              className="mb-4"
              locale={locale}
            />
            <div className="flex items-center gap-4 text-gray-600 justify-center">
              <div className="flex items-center gap-1">
                <span className="text-xl">⭐</span>
                <span className="font-semibold">{restaurants[1].rating}</span>
              </div>
              <span className="text-sm">
                📍 {locale === 'ar' ? restaurants[1].location : restaurants[1].locationEn}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
            <div>
              <RecommendationDescription
                description={locale === 'ar' ? restaurants[1].story : restaurants[1].storyEn}
                size="medium"
                align={locale === 'ar' ? 'right' : 'left'}
                maxWidth="max-w-none"
                className="leading-loose"
                locale={locale}
              />
            </div>
            <div>
              <RecommendationImage
                src={restaurants[1].image}
                alt={locale === 'ar' ? restaurants[1].name : restaurants[1].nameEn}
                height="h-64"
                gradient="from-blue-400 to-purple-500"
                className="rounded-2xl"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 p-6 rounded-lg mb-12">
            <h4 className={`font-bold text-blue-800 mb-2 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              {locale === 'ar' ? "الطبق المميز:" : "Signature Dish:"}
            </h4>
            <p className={`text-blue-700 text-lg ${locale === 'ar' ? 'text-right' : 'text-left'}`}>
              {locale === 'ar' ? restaurants[1].signature : restaurants[1].signatureEn}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-12">
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto"></div>
          </div>
        </section>

        {/* Al Fajr Restaurant Section */}
        <section className="mb-20">
          <div className="mb-8">
            <RecommendationTitle
              title={locale === 'ar' ? restaurants[2].name : restaurants[2].nameEn}
              size="large"
              align={locale === 'ar' ? 'left' : 'right'}
              className="mb-4"
              locale={locale}
            />
            <div className={`flex items-center gap-4 text-gray-600 ${locale === 'ar' ? 'justify-start' : 'justify-end'}`}>
              <div className="flex items-center gap-1">
                <span className="text-xl">⭐</span>
                <span className="font-semibold">{restaurants[2].rating}</span>
              </div>
              <span className="text-sm">
                📍 {locale === 'ar' ? restaurants[2].location : restaurants[2].locationEn}
              </span>
            </div>
          </div>

          <div className="mb-8">
            <RecommendationImage
              src={restaurants[2].image}
              alt={locale === 'ar' ? restaurants[2].name : restaurants[2].nameEn}
              height="h-96"
              gradient="from-green-400 to-emerald-600"
              className="rounded-3xl"
            />
          </div>

          <div className="mb-8 max-w-4xl mx-auto">
            <RecommendationDescription
              description={locale === 'ar' ? restaurants[2].story : restaurants[2].storyEn}
              size="large"
              align="center"
              maxWidth="max-w-none"
              className="leading-loose text-center"
              locale={locale}
            />
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-8 rounded-xl max-w-3xl mx-auto">
            <h4 className="font-bold text-green-800 mb-3 text-center text-xl">
              {locale === 'ar' ? "الطبق المميز:" : "Signature Dish:"}
            </h4>
            <p className="text-green-700 text-xl text-center font-medium">
              {locale === 'ar' ? restaurants[2].signature : restaurants[2].signatureEn}
            </p>
          </div>
        </section>
      </article>
    </>
  );
}