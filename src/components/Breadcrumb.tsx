import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home } from 'lucide-react';
const BreadcrumbNavigation = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);
  const breadcrumbNameMap: {
    [key: string]: string;
  } = {
    'stock-cases': 'Stock Cases',
    'learning': 'Learning Center',
    'auth': 'Authentication',
    'profile': 'Profile',
    'admin': 'Admin',
    'portfolio-advisor': 'Portfolio Advisor'
  };
  if (pathnames.length === 0) return null;
  return;
};
export default BreadcrumbNavigation;