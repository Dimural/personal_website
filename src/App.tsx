import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LandingPage } from './components/LandingPage'
import { PortfolioPage } from './components/PortfolioPage'

type Page = 'landing' | 'portfolio'

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function App() {
  const [page, setPage] = useState<Page>('landing')

  const enterPortfolio = () => setPage('portfolio')
  const enterGym = () => { window.location.href = '/gym.html' }
  const backToLanding = () => setPage('landing')

  return (
    <AnimatePresence mode="wait">
      {page === 'landing' && (
        <motion.div
          key="landing"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'fixed', inset: 0 }}
        >
          <LandingPage onEnterPortfolio={enterPortfolio} onEnterGym={enterGym} />
        </motion.div>
      )}

      {page === 'portfolio' && (
        <motion.div
          key="portfolio"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{ position: 'fixed', inset: 0 }}
        >
          <PortfolioPage onBack={backToLanding} onEnterGym={enterGym} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
