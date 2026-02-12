import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useStore } from './store/useStore';
import { Header } from './components/Dashboard/Header';
import { Sidebar } from './components/Dashboard/Sidebar';
import { StatsCards } from './components/Dashboard/StatsCards';
import { PriceTicker } from './components/Prices/PriceTicker';
import { PriceTable } from './components/Prices/PriceTable';
import { OpportunityList } from './components/Arbitrage/OpportunityList';
import { TriangularArbitrage } from './components/Arbitrage/TriangularArbitrage';
import { LoadingSpinner } from './components/Shared/LoadingSpinner';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

type Tab = 'dashboard' | 'prices' | 'arbitrage' | 'triangular';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const { setPrices, setOpportunities, setConnectionStatus } = useStore();

  useEffect(() => {
    const socket: Socket = io(WS_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('✅ Connected to WebSocket');
      setIsConnected(true);
      setConnectionStatus(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from WebSocket');
      setIsConnected(false);
      setConnectionStatus(false);
    });

    socket.on('price:update', (data) => {
      setPrices(data);
    });

    socket.on('arbitrage:opportunity', (data) => {
      setOpportunities(data);
    });

    socket.on('exchange:status', (data) => {
      console.log(`Exchange status: ${data.exchange} - ${data.connected}`);
    });

    // Triangle opportunities
    socket.on('triangle:opportunity', (data) => {
      console.log('🔺 Triangle opportunity:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, [setPrices, setOpportunities, setConnectionStatus]);

  if (!isConnected) {
    return <LoadingSpinner message="Conectando ao servidor..." />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab as any} />
      
      <div className="flex-1 ml-64 p-6">
        <Header />
        
        {activeTab === 'dashboard' && (
          <>
            <StatsCards />
            <div className="mt-6">
              <PriceTicker />
            </div>
          </>
        )}
        
        {activeTab === 'prices' && (
          <PriceTable />
        )}
        
        {activeTab === 'arbitrage' && (
          <OpportunityList />
        )}

        {activeTab === 'triangular' && (
          <TriangularArbitrage />
        )}
      </div>
    </div>
  );
}

export default App;
