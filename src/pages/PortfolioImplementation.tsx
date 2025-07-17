
import React from 'react';
import Layout from '@/components/Layout';
import UserHoldingsManager from '@/components/UserHoldingsManager';

const PortfolioImplementation: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portföljimplementering</h1>
          <p className="text-gray-600">
            Hantera dina nuvarande innehav och kassapositioner
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <UserHoldingsManager />
          </div>
          
          <div className="space-y-6">
            {/* Additional components can be added here later */}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PortfolioImplementation;
