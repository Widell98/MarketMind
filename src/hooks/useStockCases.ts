import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type StockCase = {
  id: string;
  title: string;
  company_name: string;
  image_url: string | null;
  sector: string | null;
  market_cap: string | null;
  pe_ratio: string | null;
  dividend_yield: string | null;
  description: string | null;
  admin_comment: string | null;
  user_id: string | null;
  status: 'active' | 'winner' | 'loser';
  entry_price: number | null;
  current_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  performance_percentage: number | null;
  closed_at: string | null;
  is_public: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
  };
  case_categories?: {
    name: string;
    color: string;
  };
};

// Helper function to ensure proper typing from database
const transformStockCase = (rawCase: any): StockCase => {
  return {
    ...rawCase,
    status: (rawCase.status || 'active') as 'active' | 'winner' | 'loser',
    is_public: rawCase.is_public ?? true,
  };
};

export const useStockCases = (showFollowedOnly: boolean = false) => {
  const [stockCases, setStockCases] = useState<StockCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStockCases = async () => {
    try {
      // First, get all public stock cases
      const { data: casesData, error: casesError } = await supabase
        .from('stock_cases')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Get unique user IDs
      const userIds = [...new Set(casesData?.map(c => c.user_id).filter(Boolean) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
      }

      // Get unique category IDs
      const categoryIds = [...new Set(casesData?.map(c => c.category_id).filter(Boolean) || [])];
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('case_categories')
        .select('id, name, color')
        .in('id', categoryIds);

      if (categoriesError) {
        console.error('Categories fetch error:', categoriesError);
      }

      // Combine the data manually
      const transformedData = (casesData || []).map(stockCase => {
        const profile = profilesData?.find(p => p.id === stockCase.user_id);
        const category = categoriesData?.find(c => c.id === stockCase.category_id);
        
        return transformStockCase({
          ...stockCase,
          profiles: profile ? { username: profile.username, display_name: profile.display_name } : null,
          case_categories: category ? { name: category.name, color: category.color } : null
        });
      });

      setStockCases(transformedData);
    } catch (error: any) {
      console.error('Error fetching stock cases:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda aktiecases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowedStockCases = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStockCases([]);
        setLoading(false);
        return;
      }

      // First get the stock case IDs that the user follows
      const { data: followsData, error: followsError } = await supabase
        .from('stock_case_follows')
        .select('stock_case_id')
        .eq('user_id', user.id);

      if (followsError) throw followsError;

      const followedCaseIds = followsData?.map(f => f.stock_case_id) || [];

      if (followedCaseIds.length === 0) {
        setStockCases([]);
        setLoading(false);
        return;
      }

      // Now get the stock cases that are followed
      const { data: casesData, error: casesError } = await supabase
        .from('stock_cases')
        .select('*')
        .in('id', followedCaseIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Get unique user IDs
      const userIds = [...new Set(casesData?.map(c => c.user_id).filter(Boolean) || [])];
      
      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
      }

      // Get unique category IDs
      const categoryIds = [...new Set(casesData?.map(c => c.category_id).filter(Boolean) || [])];
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('case_categories')
        .select('id, name, color')
        .in('id', categoryIds);

      if (categoriesError) {
        console.error('Categories fetch error:', categoriesError);
      }

      // Combine the data manually
      const transformedData = (casesData || []).map(stockCase => {
        const profile = profilesData?.find(p => p.id === stockCase.user_id);
        const category = categoriesData?.find(c => c.id === stockCase.category_id);
        
        return transformStockCase({
          ...stockCase,
          profiles: profile ? { username: profile.username, display_name: profile.display_name } : null,
          case_categories: category ? { name: category.name, color: category.color } : null
        });
      });

      setStockCases(transformedData);
    } catch (error: any) {
      console.error('Error fetching followed stock cases:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda följda aktiecases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteStockCase = async (stockCaseId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        throw new Error('Du måste vara inloggad för att ta bort aktiecase');
      }

      // Check if user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      const isAdmin = !!adminCheck && !adminError;

      // First check if the user owns this stock case or is admin
      const { data: stockCase, error: fetchError } = await supabase
        .from('stock_cases')
        .select('user_id')
        .eq('id', stockCaseId)
        .single();

      if (fetchError) throw fetchError;

      if (stockCase.user_id !== user.id && !isAdmin) {
        throw new Error('Du kan bara ta bort dina egna aktiecases');
      }

      // Delete the stock case
      const { error: deleteError } = await supabase
        .from('stock_cases')
        .delete()
        .eq('id', stockCaseId);

      if (deleteError) throw deleteError;

      // Remove from local state
      setStockCases(prev => prev.filter(stockCase => stockCase.id !== stockCaseId));
      
      toast({
        title: "Framgång",
        description: isAdmin && stockCase.user_id !== user.id 
          ? "Akticase borttaget som admin" 
          : "Akticase borttaget",
      });

    } catch (error: any) {
      console.error('Error deleting stock case:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ta bort akticase",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    if (showFollowedOnly) {
      fetchFollowedStockCases();
    } else {
      fetchStockCases();
    }
  }, [showFollowedOnly]);

  const createStockCase = async (stockCase: Omit<StockCase, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!user) {
        throw new Error('Du måste vara inloggad för att skapa aktiecase');
      }

      // Ensure user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile check error:', profileError);
        throw new Error('Kunde inte verifiera användarprofil');
      }

      // If profile doesn't exist, create it
      if (!profileData) {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            username: user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`,
            display_name: user.user_metadata?.display_name || 'Ny användare'
          });

        if (createProfileError) {
          console.error('Profile creation error:', createProfileError);
          throw new Error('Kunde inte skapa användarprofil');
        }
      }

      const caseData = {
        ...stockCase,
        user_id: user.id
      };

      // First, insert the stock case without trying to join with profiles
      const { data: insertedCase, error: insertError } = await supabase
        .from('stock_cases')
        .insert([caseData])
        .select('*')
        .single();

      if (insertError) throw insertError;

      // Then, fetch the profile data separately
      const { data: profileInfo, error: profileFetchError } = await supabase
        .from('profiles')
        .select('username, display_name')
        .eq('id', user.id)
        .single();

      if (profileFetchError) {
        console.error('Profile fetch error:', profileFetchError);
      }

      // Combine the data manually
      const transformedCase = transformStockCase({
        ...insertedCase,
        profiles: profileInfo || { username: 'unknown', display_name: null }
      });

      setStockCases(prev => [transformedCase, ...prev]);
      toast({
        title: "Framgång",
        description: "Akticase skapat framgångsrikt",
      });

      return transformedCase;
    } catch (error: any) {
      console.error('Error creating stock case:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte skapa akticase",
        variant: "destructive",
      });
      throw error;
    }
  };

  const uploadImage = async (file: File) => {
    try {
      console.log('Starting image upload:', file.name, file.type, file.size);
      
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Endast JPG, PNG och WebP-filer är tillåtna');
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error('Filen är för stor. Maximal storlek är 5MB');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('stock-cases')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('stock-cases')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ladda upp bild",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    stockCases,
    loading,
    createStockCase,
    uploadImage,
    deleteStockCase,
    refetch: showFollowedOnly ? fetchFollowedStockCases : fetchStockCases,
  };
};

export const useStockCase = (id: string) => {
  const [stockCase, setStockCase] = useState<StockCase | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStockCase = async () => {
      try {
        // First get the stock case
        const { data: caseData, error: caseError } = await supabase
          .from('stock_cases')
          .select('*')
          .eq('id', id)
          .single();

        if (caseError) throw caseError;

        // Then get the profile if user_id exists
        let profileData = null;
        if (caseData.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', caseData.user_id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
          } else {
            profileData = profile;
          }
        }

        // Then get the category if category_id exists
        let categoryData = null;
        if (caseData.category_id) {
          const { data: category, error: categoryError } = await supabase
            .from('case_categories')
            .select('name, color')
            .eq('id', caseData.category_id)
            .single();

          if (categoryError) {
            console.error('Category fetch error:', categoryError);
          } else {
            categoryData = category;
          }
        }

        // Combine the data manually
        const transformedCase = transformStockCase({
          ...caseData,
          profiles: profileData,
          case_categories: categoryData
        });

        setStockCase(transformedCase);
      } catch (error: any) {
        console.error('Error fetching stock case:', error);
        toast({
          title: "Fel",
          description: "Kunde inte ladda akticase",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchStockCase();
    }
  }, [id, toast]);

  return { stockCase, loading };
};
