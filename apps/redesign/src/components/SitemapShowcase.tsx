'use client'

import { useEffect, useRef, type CSSProperties } from 'react'
import { MousePointer } from 'lucide-react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ClickSpark, { type ClickSparkHandle } from './ClickSpark'
import styles from './SitemapShowcase.module.css'

type SitemapCardProps = {
  title: string
  blocks: string[]
  variant: 'home' | 'projects' | 'contact'
  focusBlock?: string
}

const collaborators = [
  {
    name: 'Maya',
    role: 'Design',
    color: '#C2F003',
    message: 'Make this section sell the setup flow, not just the feature list.',
  },
  {
    name: 'Noah',
    role: 'Product',
    color: '#D6A845',
    message: 'Add the API key moment here so agents know exactly what to do next.',
  },
  {
    name: 'Codex',
    role: 'Agent',
    color: '#1ABC9C',
    message: 'Connected the sitemap node to wireframe blocks and page copy.',
  },
] as const

const variantClass = {
  home: styles.cardHome,
  projects: styles.cardProjects,
  contact: styles.cardContact,
} as const

const blockClass = [styles.block0, styles.block1, styles.block2, styles.block3]

function TrashIcon() {
  return (
    <svg className={`${styles.icon} ${styles.iconTrash}`} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 4h1.33333H14" />
      <path d="M12.6667 4v9.3333c0 .3537-.1405.6928-.3906.9429-.25.25-.5891.3905-.9428.3905H4.66667c-.35362 0-.69276-.1405-.94281-.3905-.25005-.2501-.39053-.5892-.39053-.9429V4M5.33333 4V2.66667c0-.35362.14048-.69276.39053-.94281.25005-.25005.58919-.39053.94281-.39053h2.66666c.35362 0 .69277.14048.94277.39053.2501.25005.3906.58919.3906.94281V4" />
      <path d="M6.66667 8v4M9.33333 8v4" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg className={`${styles.icon} ${styles.iconArrow}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.16667 10 10 4.16667 15.8333 10" />
      <path d="M10 15.8333V4.16667" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className={`${styles.icon} ${styles.iconCheck}`} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M16.6667 5 7.5 14.1667 3.33333 10" />
    </svg>
  )
}

function SitemapCard({ title, blocks, variant, focusBlock }: SitemapCardProps) {
  return (
    <article className={`${styles.card} ${variantClass[variant]}`} aria-label={`${title} page`}>
      <div className={styles.cardHeader} aria-hidden="true">
        <span className={`${styles.control} ${styles.controlTrash}`}>
          <TrashIcon />
        </span>
        <span className={`${styles.control} ${styles.controlArrow}`}>
          <ArrowUpIcon />
        </span>
        <span className={`${styles.control} ${styles.controlCheck}`}>
          <CheckIcon />
        </span>
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <div className={styles.cardContent}>
        {blocks.map((block, index) => (
          <div
            className={`${styles.block} ${blockClass[index]} ${block === focusBlock ? styles.focusBlock : ''}`}
            data-focus-block={block === focusBlock ? 'true' : undefined}
            key={`${title}-${block}`}
          >
            <span>{block}</span>
          </div>
        ))}
      </div>
    </article>
  )
}

export default function SitemapShowcase() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const cursorRef = useRef<HTMLDivElement | null>(null)
  const sidebarRef = useRef<HTMLElement | null>(null)
  const sparkRef = useRef<ClickSparkHandle | null>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const section = sectionRef.current
    const cursor = cursorRef.current
    const sidebar = sidebarRef.current

    if (!section || !cursor || !sidebar) {
      return
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      const focusBlock = section.querySelector<HTMLElement>('[data-focus-block="true"]')
      const messages = gsap.utils.toArray<HTMLElement>(`.${styles.chatMessage}`)

      if (!focusBlock) {
        return
      }

      if (reducedMotion) {
        gsap.set(cursor, { autoAlpha: 1, left: '52%', top: '44%', scale: 1 })
        gsap.set(sidebar, { autoAlpha: 1, x: 0 })
        gsap.set(messages, { autoAlpha: 1, y: 0 })
        gsap.set(focusBlock, { scale: 1.02 })
        return
      }

      gsap.set(cursor, { autoAlpha: 0, left: '18%', top: '36%', scale: 1, rotate: -8 })
      gsap.set(sidebar, { autoAlpha: 0, x: 44 })
      gsap.set(messages, { autoAlpha: 0, y: 10 })

      const getTargetPoint = () => {
        const sectionRect = section.getBoundingClientRect()
        const focusRect = focusBlock.getBoundingClientRect()

        return {
          x: focusRect.left - sectionRect.left + focusRect.width * 0.88,
          y: focusRect.top - sectionRect.top + focusRect.height * 0.55,
        }
      }

      const triggerSpark = () => {
        const { x, y } = getTargetPoint()
        sparkRef.current?.sparkAt(x, y)
      }

      const timeline = gsap.timeline({
        defaults: { ease: 'power2.out' },
        scrollTrigger: {
          trigger: section,
          start: 'top 10%',
          end: '+=760',
          scrub: 0.7,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      timeline
        .to(cursor, { autoAlpha: 1, duration: 0.12 })
        .to(cursor, { left: '42%', top: '35%', rotate: -3, duration: 0.34 }, '<')
        .to(cursor, {
          left: () => `${getTargetPoint().x}px`,
          top: () => `${getTargetPoint().y}px`,
          rotate: 2,
          duration: 0.32,
        })
        .to(cursor, { scale: 0.78, duration: 0.08 })
        .to(focusBlock, { scale: 1.035, duration: 0.12 }, '<')
        .call(triggerSpark)
        .to(cursor, { scale: 1, duration: 0.1 })
        .to(sidebar, { autoAlpha: 1, x: 0, duration: 0.32 }, '<0.04')
        .to(messages, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.28 }, '<0.08')
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className={styles.showcase} aria-labelledby="sitemap-showcase-title">
      <ClickSpark
        ref={sparkRef}
        className={styles.sparkSurface}
        sparkColor="#C2F003"
        sparkSize={16}
        sparkRadius={22}
        sparkCount={10}
        duration={460}
        extraScale={1.12}
      >
        <h2 id="sitemap-showcase-title" className="heading-2">
          Design your sitemap and wireframe in one tool
        </h2>

        <svg className={styles.connectors} viewBox="0 0 1196 1196" fill="none" aria-hidden="true">
          <path d="M602 599 C503.827 665.011 277 691.5 277 726.5" />
          <path d="M598.5 600.5 C696.673 666.511 923.5 693 923.5 728" />
        </svg>

        <SitemapCard title="Home" variant="home" blocks={['Header', 'Hero', 'Services', 'Footer']} focusBlock="Services" />
        <SitemapCard title="Projects" variant="projects" blocks={['Header', 'Slideshow', 'Footer']} />
        <SitemapCard title="Contact" variant="contact" blocks={['Header', 'Slideshow', 'Footer']} />

        <div ref={cursorRef} className={styles.cursor} aria-hidden="true">
          <MousePointer />
        </div>

        <aside ref={sidebarRef} className={styles.sidebar} aria-label="Services block collaboration chat">
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarControl} />
            <span className={styles.sidebarControl} />
            <span className={styles.sidebarControl} />
            <h3>Services</h3>
          </div>

          <p className={styles.sidebarDescription}>
            Describe the agent workflow, API setup, and generated wireframe output for visitors comparing tools.
          </p>

          <div className={styles.chatList}>
            {collaborators.map((collaborator) => (
              <article className={styles.chatMessage} key={collaborator.name}>
                <div
                  className={styles.avatar}
                  style={{ '--avatar-color': collaborator.color } as CSSProperties}
                  aria-hidden="true"
                >
                  {collaborator.name.charAt(0)}
                </div>
                <div className={styles.messageBody}>
                  <div className={styles.messageMeta}>
                    <span>{collaborator.name}</span>
                    <span>{collaborator.role}</span>
                  </div>
                  <p>{collaborator.message}</p>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </ClickSpark>
    </section>
  )
}
