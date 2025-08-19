import { supabase } from '@/integrations/supabase/client';

interface SecurityEvent {
  action: string;
  resource_type: string;
  resource_id?: string;
}

export const useSecurityAudit = () => {
  const logSecurityEvent = async ({ action, resource_type, resource_id }: SecurityEvent) => {
    try {
      await supabase.rpc('log_security_event', {
        p_action: action,
        p_resource_type: resource_type,
        p_resource_id: resource_id || null
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const logDataAccess = async (resource_type: string, resource_id?: string) => {
    await logSecurityEvent({
      action: 'data_access',
      resource_type,
      resource_id
    });
  };

  const logAdminAction = async (action: string, resource_id?: string) => {
    await logSecurityEvent({
      action: `admin_${action}`,
      resource_type: 'admin_action',
      resource_id
    });
  };

  return {
    logSecurityEvent,
    logDataAccess,
    logAdminAction
  };
};