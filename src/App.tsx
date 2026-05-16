import { useRef } from 'react'
import { LandingPage } from './components/LandingPage'
import { PortfolioPage } from './components/PortfolioPage'

export default function App() {
  const portfolioRef = useRef<HTMLDivElement>(null)

  const enterPortfolio = () =>
    portfolioRef.current?.scrollIntoView({ behavior: 'smooth' })

  const backToLanding = () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })

  const enterGym = () => { window.location.href = '/gym.html' }

  return (
    <div>
      <LandingPage onEnterPortfolio={enterPortfolio} onEnterGym={enterGym} />
      <div ref={portfolioRef}>
        <PortfolioPage onBack={backToLanding} onEnterGym={enterGym} />
      </div>
    </div>
  )
}
