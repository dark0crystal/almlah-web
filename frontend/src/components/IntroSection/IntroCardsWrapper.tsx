// CardsWrapper.tsx - Main Wrapper Component
import  YellowCard1  from "./cards/Card1";
import  YellowCard2  from "./cards/Card2";
import  YellowCard3  from "./cards/Card3";

export default function ThreeCardsWrapper() {
  return (
    <div className="w-full max-w-7xl mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 place-items-center">
        <YellowCard1 />
        <YellowCard2 />
        <YellowCard3 />
      </div>
    </div>
  );
}