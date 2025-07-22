
import React from 'react';
import Layout from '@/components/Layout';
import StockCasesFeed from '@/components/StockCasesFeed';

const StockCases = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <StockCasesFeed />
      </div>
    </Layout>
  );
};

export default StockCases;
