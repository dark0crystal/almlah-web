import React from 'react'
import styles from './menu.module.scss';
import { motion } from 'framer-motion';
import { Link } from "@/i18n/navigation";
import { useTranslations } from 'next-intl';

const anim = {
    initial: {
        opacity: 0
    },
    open: {
        opacity: 1
    },
    exit: {
        opacity: 0
    }
}

export default function SideMenu({menuIsActive}: {menuIsActive: boolean}) {
  const t = useTranslations("navbar");
  
  const navLinks = [
    { direction: "/", name: t("home") },
    { direction: "/places", name: t("places") },
    { direction: "/restaurants", name: t("restaurants") },
    { direction: "/destinations", name: t("destinations") },
    { direction: "/the-gallery", name: t("gallery") },
    { direction: "/zatar", name: t("zatar") },
    { direction: "/about-us", name: t("aboutUs") },
  ];

  return (
    <motion.div 
        className={styles.menu}
        variants={anim}
        initial="initial"
        animate={menuIsActive ? "open" : "closed"}
    >
        {navLinks.map((navLink, index) => (
          <Link key={index} href={navLink.direction}>
            <p className={styles.menuItem}>{navLink.name}</p>
          </Link>
        ))}
    </motion.div>
  )
}