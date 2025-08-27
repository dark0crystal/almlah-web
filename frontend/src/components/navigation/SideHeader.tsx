import styles from './style.module.scss';

export default function SideHeader({menuIsActive, setMenuIsActive}: {menuIsActive: boolean, setMenuIsActive: (active: boolean) => void}) {
  return (
    <div className={styles.header}>
        <div onClick={() => {setMenuIsActive(!menuIsActive)}} className={`${styles.burger} ${menuIsActive ? styles.burgerActive : ""}`}>
        </div>
    </div>
  )
}