import styles from './TheProcess.module.css'

const steps = [
  {
    number: '01',
    title: 'Brainstorm with your AI agent',
    description: 'Talk through the idea with Codex, Claude or Openclaw. No rigid brief needed.',
  },
  {
    number: '02',
    title: 'Generate structure via MCP and API',
    description: 'Layoutr turns the conversation into pages, sections and flow you can inspect visually.',
  },
  {
    number: '03',
    title: 'Review visually with your team',
    description: 'Refine the sitemap together, leave comments, and keep the agent loop moving.',
  },
]

function Step({ number, title, description }: (typeof steps)[number]) {
  return (
    <div className={styles.step}>
      <div className={styles.badge}>
        <span className={styles.badgeNumber}>{number}</span>
      </div>
      <p className={styles.stepTitle}>{title}</p>
      <p className={styles.stepDesc}>{description}</p>
    </div>
  )
}

export default function TheProcess() {
  return (
    <div className={styles.container}>
      <div className={styles.glowOrange} />
      <div className={styles.glowBlue} />
      <p className={styles.subtitle}>From idea to visual sitemap in three clear steps.</p>
      <div className={styles.divider} />
      <ol className={styles.steps}>
        {steps.map((step) => (
          <li key={step.number} style={{ listStyle: 'none', display: 'contents' }}>
            <Step {...step} />
          </li>
        ))}
      </ol>
    </div>
  )
}
