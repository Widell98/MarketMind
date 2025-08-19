import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SecurityIssue {
  level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  action?: string;
}

export const SecurityWarnings = () => {
  const [securityIssues] = useState<SecurityIssue[]>([
    {
      level: 'MEDIUM',
      title: 'Leaked Password Protection Disabled',
      description: 'Password leak protection is currently disabled. Enable it in Supabase Auth settings.',
      action: 'Go to Supabase Dashboard > Authentication > Settings > Password Protection'
    },
    {
      level: 'MEDIUM', 
      title: 'Insufficient MFA Options',
      description: 'Multi-factor authentication options are limited. Consider enabling additional MFA methods.',
      action: 'Go to Supabase Dashboard > Authentication > Settings > Multi-Factor Auth'
    }
  ]);

  if (securityIssues.length === 0) {
    return (
      <Card className="p-4 border-success">
        <div className="flex items-center gap-2 text-success">
          <Shield className="h-5 w-5" />
          <span className="font-medium">Security Status: Good</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          No security issues detected. Continue monitoring for optimal protection.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-warning" />
        Security Recommendations
      </h3>
      
      {securityIssues.map((issue, index) => (
        <Alert 
          key={index} 
          variant={issue.level === 'CRITICAL' ? 'destructive' : 'default'}
          className={
            issue.level === 'HIGH' ? 'border-destructive/50' :
            issue.level === 'MEDIUM' ? 'border-warning/50' :
            'border-muted'
          }
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              issue.level === 'CRITICAL' ? 'bg-destructive text-destructive-foreground' :
              issue.level === 'HIGH' ? 'bg-destructive/20 text-destructive' :
              issue.level === 'MEDIUM' ? 'bg-warning/20 text-warning-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {issue.level}
            </span>
            {issue.title}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {issue.description}
            {issue.action && (
              <div className="mt-2 p-2 bg-muted rounded text-sm">
                <strong>Action required:</strong> {issue.action}
              </div>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};