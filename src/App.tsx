import { useRef } from 'react'
import { LandingPage } from './components/LandingPage'
import { PortfolioPage } from './components/PortfolioPage'

export default function App() {
  const portfolioRef = useRef<HTMLDivElement>(null)

  const enterPortfolio = () =>
    portfolioRef.current?.scrollIntoView({ behavior: 'smooth' })

  const enterGym = () => { window.location.href = '/gym.html' }

  return (
    <>
      <LandingPage onEnterPortfolio={enterPortfolio} onEnterGym={enterGym} />
      <div ref={portfolioRef}>
        <PortfolioPage onEnterGym={enterGym} />
      </div>
    </>
  )
}
