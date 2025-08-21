import React from "react";
import {motion ,useTransform , useScroll, MotionValue} from 'framer-motion'
import { useRef } from "react";
import Image from "next/image";
import Picture1 from '../../../../public/gallery/img1.jpg'
import Picture2 from '../../../../public/gallery/img10.jpg'
import Picture3 from '../../../../public/gallery/img11.jpg'

export default function TitleMotion(){
    
const container = useRef<HTMLDivElement | null >(null);
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start end', 'end start']
  })
    

    return(
    <div className="overflow-hidden pt-4 md:pt-24">
    <div className="sm:h-[15vh]"/>
      <div ref={container}>
        <Slide src={Picture1} direction={'left'} left={"-40%"} progress={scrollYProgress}/>
        <Slide src={Picture2} direction={'right'} left={"-25%"} progress={scrollYProgress}/>
        <Slide src={Picture3} direction={'left'}  left={"-75%"} progress={scrollYProgress}/>
      </div>
      <div className='h-[50vh]' />
      </div>
    )
}
const Phrase = ({src} :{src:string}) => {

    return (
      <div className={'px-5 flex gap-5 items-center pt-2 '}>
        <p className='text-[7.5vw] lg:text-[5vw]'>معرض الصوَر</p>
        <span className="relative h-[7.5vw] aspect-[4/2] rounded-full overflow-hidden">
          <Image style={{objectFit: "cover"}} src={src} alt="image" fill/>
        </span>
      </div>
    )
  }

const Slide = (props: { direction: string; progress: MotionValue<number>; left: any; src: any; }) => {
    const direction = props.direction == 'left' ? -1 : 1;
    const translateX = useTransform(props.progress, [0, 1], [150 * direction, -150 * direction])
    return (
      <motion.div style={{x: translateX, left: props.left}} className="relative flex whitespace-nowrap">
        <Phrase src={props.src}/>
        <Phrase src={props.src}/>
        <Phrase src={props.src}/>
        <Phrase src={props.src}/>
      </motion.div>
    )
  }