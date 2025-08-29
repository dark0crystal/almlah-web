'use client';
import { useState ,useEffect} from "react";
import Scene from './Scene';
import Projects from './Projects';
import Lenis from 'lenis'


const Galleries: React.FC = () => {

  useEffect( ()=>{
    const lenis = new Lenis()
    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  },[])
  

  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  return (
    <div className="relative">
      <div className="relative z-10 mix-blend-difference">
        <Projects setActiveMenu={setActiveMenu} />
      </div>
      <div className="fixed top-0 left-0 w-full h-screen -z-10 ">
        <Scene activeMenu={activeMenu} />
      </div>
      <div className="h-[10vh] md:h-[20vh] lg:h-[40vh]"></div>
    </div>
  );
}

export default Galleries;
