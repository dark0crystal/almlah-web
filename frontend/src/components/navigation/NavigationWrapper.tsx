'use client';
import styles from './main.module.scss'
import { useState } from 'react';
import SideHeader from './SideHeader';
import SideMenu from './SideMenu';
import VerticalPixelTransition from './VerticalPixelTransition';

interface NavigationWrapperProps {
  children: React.ReactNode;
}

export default function NavigationWrapper({ children }: NavigationWrapperProps) {
  const [menuIsActive, setMenuIsActive] = useState(false);
  
  return (
    <main className={styles.main}>
      <SideHeader menuIsActive={menuIsActive} setMenuIsActive={setMenuIsActive}/>
      <SideMenu menuIsActive={menuIsActive}/>
      <VerticalPixelTransition menuIsActive={menuIsActive}/>
      <div className={styles.content}>
        {children}
      </div>
    </main>
  )
}