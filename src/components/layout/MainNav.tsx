import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const MainNav = () => {
  const location = useLocation();
  const companySlug = location.pathname.split('/')[1];
  
  const items = [
    {
      href: `/${companySlug}/dashboard`,
      label: "Dashboard",
    },
    {
      href: `/${companySlug}/template-editor`,
      label: "Templates",
    },
    {
      href: `/${companySlug}/users`,
      label: "Users",
    },
    {
      href: `/${companySlug}/reports`,
      label: "Reports",
    },
  ];

  return (
    <nav className="flex items-center space-x-6">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            location.pathname === item.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default MainNav;
