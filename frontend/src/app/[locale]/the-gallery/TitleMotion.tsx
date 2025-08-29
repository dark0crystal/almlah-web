import React from "react";
import {motion ,useTransform , useScroll, MotionValue} from 'framer-motion'
import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from 'next-intl';
import Picture1 from '../../../../public/gallery-alkhalil/img1.jpg'
import Picture2 from '../../../../public/gallery-alkhalil/img1.jpg'
import Picture3 from '../../../../public/gallery-alkhalil/img1.jpg'

export default function TitleMotion(){
    
const container = useRef<HTMLDivElement | null >(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'end start']
  })
  
  const locale = useLocale();
  const t = useTranslations('gallery');
  const isArabic = locale === 'ar';

    return(
    <div className="overflow-hidden pt-4 md:pt-24" dir={isArabic ? 'rtl' : 'ltr'}>
    <div className="sm:h-[15vh]"/>
      <div ref={container}>
        <Slide src={Picture1} direction={isArabic ? 'right' : 'left'} left={isArabic ? "40%" : "-40%"} progress={scrollYProgress} title={t('title')}/>
        <Slide src={Picture2} direction={isArabic ? 'left' : 'right'} left={isArabic ? "25%" : "-25%"} progress={scrollYProgress} title={t('title')}/>
        <Slide src={Picture3} direction={isArabic ? 'right' : 'left'}  left={isArabic ? "75%" : "-75%"} progress={scrollYProgress} title={t('title')}/>
      </div>
      <div className='h-[10vh] md:h-[30vh]' />
      </div>
    )
}
const Phrase = ({src, title} :{src:string, title:string}) => {

    return (
      <div className={'px-5 flex gap-5 items-center pt-2 '}>
        <p className='text-[9vw] font-bold lg:text-[5vw] lg:font-normal'>{title}</p>
        <span className="relative h-[7.5vw] aspect-[4/2] rounded-full overflow-hidden">
          <Image style={{objectFit: "cover"}} src={src} alt="image" fill/>
        </span>
      </div>
    )
  }

const Slide = (props: { direction: string; progress: MotionValue<number>; left: string; src: typeof Picture1; title: string; }) => {
    const [repetitions, setRepetitions] = useState(4);
    
    useEffect(() => {
      const calculateRepetitions = () => {
        const screenWidth = window.innerWidth;
        // Different calculations for Arabic vs other languages
        const isArabic = document.documentElement.dir === 'rtl' || document.documentElement.lang === 'ar';
        // Arabic text tends to be wider, so use smaller divisor and more buffer
        const textWidth = isArabic ? 250 : 300;
        const buffer = isArabic ? 4 : 2;
        const baseRepetitions = Math.ceil(screenWidth / textWidth) + buffer;
        setRepetitions(Math.max(6, baseRepetitions)); // Minimum 6 for Arabic
      };
      
      calculateRepetitions();
      window.addEventListener('resize', calculateRepetitions);
      
      return () => window.removeEventListener('resize', calculateRepetitions);
    }, []);
    
    const direction = props.direction == 'left' ? -1 : 1;
    const translateX = useTransform(props.progress, [0, 1], [150 * direction, -150 * direction])
    
    return (
      <motion.div style={{x: translateX, left: props.left}} className="relative flex whitespace-nowrap">
        {Array.from({ length: repetitions }, (_, index) => (
          <Phrase key={index} src={props.src} title={props.title} />
        ))}
      </motion.div>
    )
  }