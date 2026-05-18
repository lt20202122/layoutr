import styles from './SectionThreeTransition.module.css'

export default function SectionThreeTransition() {
  return (
    <div className={`${styles.transition} absolute`} aria-hidden="true">
      <svg
        viewBox="0 0 1440 1110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.transitionShape}
        preserveAspectRatio="none"
      >
        <path
          d="M972.02 0C960.743 352.359 1053.4 400.464 1440 0V1750H-17.9386V94.499C11.1144 66.3366 42.3955 34.8687 76.0566 0C64.7795 352.359 137.443 400.464 524.039 0C512.762 352.359 585.424 400.464 972.02 0Z"
          fill="#4C6992"
          fillOpacity="0.76"
        />
      </svg>
    </div>
  )
}
