
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FeedLayout from '@/components/FeedLayout';
import Layout from '@/components/Layout';

const SocialIndex = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <FeedLayout />
    </Layout>
  );
};

export default SocialIndex;
