import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserCapability } from '../../types/auth';
import { UnauthorizedView } from './UnauthorizedView';

interface CapabilityGuardProps {
  capability: UserCapability;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  actionName?: string;
  mode?: 'view' | 'disable' | 'hide';
}

export const CapabilityGuard: React.FC<CapabilityGuardProps> = ({
  capability,
  children,
  fallback,
  actionName,
  mode = 'view'
}) => {
  const { hasCapability, recordDeniedAction } = useAuth();
  const allowed = hasCapability(capability);

  if (allowed) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return fallback ? <>{fallback}</> : null;
  }

  if (mode === 'disable') {
    return (
      <div 
        onClick={() => recordDeniedAction(actionName || capability, capability)}
        className="opacity-45 cursor-not-allowed select-none relative group"
        title={`Missing capability: ${capability}`}
      >
        {children}
      </div>
    );
  }

  // mode === 'view'
  return fallback || (
    <UnauthorizedView
      requiredCapability={capability}
      actionName={actionName}
    />
  );
};
