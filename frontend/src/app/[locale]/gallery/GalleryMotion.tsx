'use client'
import React, { useRef } from 'react'
import {motion} from 'framer-motion'
import { useScroll , useTransform } from 'framer-motion'
import styles from './globals.module.css'
import Image from 'next/image'
import pic1 from '../../../../public/gallery/img1.jpg' 
import pic2 from '../../../../public/gallery/img1.jpg' 
import pic3 from '../../../../public/gallery/img1.jpg' 
import pic4 from '../../../../public/gallery/img1.jpg' 
import pic5 from '../../../../public/gallery/img1.jpg' 
import pic6 from '../../../../public/gallery/img1.jpg' 
import pic7 from '../../../../public/gallery/img1.jpg' 



const GallryMotion =()=>{
    const targetRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end end"]
    });

    const scale4 = useTransform(scrollYProgress , [0 , 1] , [1 ,4])
    const scale5 = useTransform(scrollYProgress , [0 , 1] , [1 ,5])
    const scale6 = useTransform(scrollYProgress , [0 , 1] , [1 ,6])
    const scale8 = useTransform(scrollYProgress , [0 , 1] , [1 ,8])
    const scale9 = useTransform(scrollYProgress , [0 , 1] , [1 ,9])

    const pictures  = [
        {
            src:pic1 , 
            scale:scale4
        },
        {
            src:pic2 , 
            scale:scale5
        },
        {
            src:pic3 , 
            scale:scale5
        },
        {
            src:pic4 , 
            scale:scale6
        },
        {
            src:pic5 , 
            scale:scale8
        },
        {
            src:pic6 , 
            scale:scale9
        },
        {
            src:pic7 , 
            scale:scale6
        },
       
    ]


    return(
        <>
        <div ref={targetRef} className={styles.container}>
            <div className={styles.sticky}>
                {pictures.map(({src , scale},index:number)=>{
                    return <motion.div key={index} className={styles.el} style={{scale}}>
                        <div className={styles.imageContainer} >
                            <Image alt="img"  fill src={src} placeholder='blur' className={styles.img}/>
                        </div>
                </motion.div>
                })}
                
            </div>
        </div>
        <div className='h-[20vh]'/>
        </>

    )
} 


export default GallryMotion;