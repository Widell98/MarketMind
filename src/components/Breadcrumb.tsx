import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const Breadcrumb = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  const breadcrumbMap: Record<string, string> = {
    'portfolio-implementation': 'Portfölj & Analys',
    'stock-cases': 'Aktiefall',
    'ai-chat': 'AI-Assistent',
    'portfolio-advisor': 'Portföljrådgivare',
    'auth': 'Inloggning',
    'profile': 'Profil'
  };

  if (pathSegments.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {pathSegments.map((segment, index) => {
        const path = '/' + pathSegments.slice(0, index + 1).join('/');
        const isLast = index === pathSegments.length - 1;
        const displayName = breadcrumbMap[segment] || segment;

        return (
          <React.Fragment key={path}>
            <ChevronRight className="w-4 h-4" />
            {isLast ? (
              <span className="text-foreground font-medium">
                {displayName}
              </span>
            ) : (
              <Link
                to={path}
                className="hover:text-foreground transition-colors"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;