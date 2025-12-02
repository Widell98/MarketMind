import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbMap: Record<string, string> = {
    'portfolio-implementation': 'Din portfölj',
    'stock-cases': 'Aktiefall',
    'ai-chat': 'AI-Assistent',
    'portfolio-advisor': 'Portföljrådgivare',
    'auth': 'Inloggning',
    'profile': 'Profil'
  };
  if (pathSegments.length === 0) {
    return null;
  }
  return;
};
export default Breadcrumb;