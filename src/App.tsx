import { FC } from 'react';
import { useKrakenTicker } from './hooks/useKrakenTicker';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { LiveBoard } from './components/LiveBoard';
import { SignalsSection } from './components/SignalsSection';
import { HowItWorks } from './components/HowItWorks';
import { FooterCTA } from './components/FooterCTA';

export const App: FC = () => {
  const { status, tickers, errorMessage, reconnect } = useKrakenTicker();

  return (
    <div className="app-shell">
      <Header
        status={status}
        errorMessage={errorMessage}
        onReconnect={reconnect}
      />
      <main id="main-content" role="main">
        <Hero />
        <LiveBoard
          status={status}
          tickers={tickers}
          errorMessage={errorMessage}
          onReconnect={reconnect}
        />
        <SignalsSection />
        <HowItWorks />
      </main>
      <FooterCTA />
    </div>
  );
};

export default App;
