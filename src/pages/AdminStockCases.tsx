import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useStockCases } from '@/hooks/useStockCases';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft, X, Edit, Trash2, Plus, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import AdminImageHistoryManager from '@/components/AdminImageHistoryManager';
import AdminAnalysesDashboard from '@/components/AdminAnalysesDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type StockCaseWithActions = {
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

type Category = {
  id: string;
  name: string;
  color: string;
};

const AdminStockCases = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { stockCases: allStockCases, loading: stockCasesLoading } = useStockCases();
  const { createStockCase, uploadImage, deleteStockCase } = useStockCaseOperations();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // All useState hooks must be called before any conditional returns
  const [loading, setLoading] = useState(false);
  const [allCases, setAllCases] = useState<StockCaseWithActions[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCase, setEditingCase] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isCreatingIndex, setIsCreatingIndex] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    sector: '',
    market_cap: '',
    description: '',
    admin_comment: '',
    entry_price: '',
    current_price: '',
    target_price: '',
    stop_loss: '',
    category_id: '',
  });

  // Move useEffect here, before any conditional returns
  useEffect(() => {
    if (user?.id && !roleLoading) {
      fetchAllCases();
      fetchCategories();
    }
  }, [user?.id, isAdmin, roleLoading]);

  // Add redirect effect for non-admin users
  useEffect(() => {
    if (!roleLoading && user && !isAdmin) {
      console.log('Non-admin user trying to access admin page, redirecting...');
      toast({
        title: "Åtkomst nekad",
        description: "Du har inte behörighet att komma åt den här sidan",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [roleLoading, user, isAdmin, navigate, toast]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('case_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda kategorier",
        variant: "destructive",
      });
    }
  };

  const fetchAllCases = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('stock_cases')
        .select('*')
        .order('created_at', { ascending: false });

      // If not admin, only show user's own cases
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }

      const { data: casesData, error } = await query;

      if (error) throw error;

      // Get unique user IDs for profiles
      const userIds = [...new Set(casesData?.map(c => c.user_id).filter(Boolean) || [])];
      
      // Fetch profiles for these users
      let profilesData: any[] = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Profiles fetch error:', profilesError);
        } else {
          profilesData = profiles || [];
        }
      }

      // Get unique category IDs
      const categoryIds = [...new Set(casesData?.map(c => c.category_id).filter(Boolean) || [])];
      
      // Fetch categories
      let categoriesData: any[] = [];
      if (categoryIds.length > 0) {
        const { data: categories, error: categoriesError } = await supabase
          .from('case_categories')
          .select('id, name, color')
          .in('id', categoryIds);

        if (categoriesError) {
          console.error('Categories fetch error:', categoriesError);
        } else {
          categoriesData = categories || [];
        }
      }

      // Transform the data to ensure proper typing
      const transformedData: StockCaseWithActions[] = (casesData || []).map(stockCase => {
        const profile = profilesData.find(p => p.id === stockCase.user_id);
        const category = categoriesData.find(c => c.id === stockCase.category_id);
        
        return {
          ...stockCase,
          status: (stockCase.status || 'active') as 'active' | 'winner' | 'loser',
          profiles: profile ? { 
            username: profile.username, 
            display_name: profile.display_name 
          } : undefined,
          case_categories: category ? { 
            name: category.name, 
            color: category.color 
          } : undefined
        };
      });

      setAllCases(transformedData);
    } catch (error: any) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda aktiecases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Kontrollerar behörigheter...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
            <p className="text-gray-600 mb-4">
              Du måste vara inloggad för att komma åt denna sida.
            </p>
            <Button onClick={() => navigate('/')}>
              Tillbaka till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is admin - this will now be handled by the useEffect redirect above
  // but we keep this as a fallback
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Åtkomst nekad</h2>
            <p className="text-gray-600 mb-4">
              Du har inte administratörsbehörighet för att komma åt denna sida.
            </p>
            <Button onClick={() => navigate('/')}>
              Tillbaka till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Handle ticker field with automatic $ prefix
    if (e.target.name === 'company_name') {
      if (value && !value.startsWith('$')) {
        value = '$' + value;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category_id: value === "none" ? "" : value,
    }));
  };

  const handleIndexCheckboxChange = (checked: boolean) => {
    setIsCreatingIndex(checked);
    
    if (checked) {
      // Find the "Index" category or create default values for index
      const indexCategory = categories.find(cat => cat.name.toLowerCase().includes('index'));
      setFormData(prev => ({
        ...prev,
        sector: 'Index',
        market_cap: '', // Clear market cap for index
        category_id: indexCategory ? indexCategory.id : '',
      }));
    } else {
      // Reset to normal values
      setFormData(prev => ({
        ...prev,
        sector: '',
        market_cap: '',
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Fel filtyp",
          description: "Endast JPG, PNG och WebP-filer är tillåtna",
          variant: "destructive",
        });
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({
          title: "Fil för stor",
          description: "Maximal filstorlek är 5MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      company_name: '',
      sector: '',
      market_cap: '',
      description: '',
      admin_comment: '',
      entry_price: '',
      current_price: '',
      target_price: '',
      stop_loss: '',
      category_id: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setShowCreateForm(false);
    setEditingCase(null);
    setIsCreatingIndex(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.company_name) {
      toast({
        title: "Fel",
        description: "Titel och företagsnamn är obligatoriska",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      
      // If editing and no new image file, preserve existing image
      if (editingCase && !imageFile && imagePreview) {
        // Find the existing case to get its current image_url
        const existingCase = allCases.find(c => c.id === editingCase);
        imageUrl = existingCase?.image_url || null;
      } else if (imageFile) {
        // Only upload new image if one was selected
        imageUrl = await uploadImage(imageFile);
      }

      const caseData = {
        ...formData,
        image_url: imageUrl,
        pe_ratio: null,
        dividend_yield: null,
        status: 'active' as const,
        entry_price: formData.entry_price ? parseFloat(formData.entry_price) : null,
        current_price: formData.current_price ? parseFloat(formData.current_price) : null,
        target_price: formData.target_price ? parseFloat(formData.target_price) : null,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null,
        performance_percentage: null,
        closed_at: null,
        is_public: true,
        category_id: formData.category_id || null,
      };

      if (editingCase) {
        // When editing, preserve the original user_id and don't overwrite it
        await updateStockCase(editingCase, caseData);
      } else {
        // When creating new, set user_id to null (admin-created)
        const newCaseData = {
          ...caseData,
          user_id: null,
        };
        await createStockCase(newCaseData);
      }

      resetForm();
      fetchAllCases();

      toast({
        title: "Framgång",
        description: editingCase ? "Akticase uppdaterat framgångsrikt!" : "Akticase skapat framgångsrikt!",
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStockCase = async (caseId: string, caseData: any) => {
    const { error } = await supabase
      .from('stock_cases')
      .update(caseData)
      .eq('id', caseId);

    if (error) throw error;
  };

  const handleEdit = (stockCase: StockCaseWithActions) => {
    setFormData({
      title: stockCase.title,
      company_name: stockCase.company_name,
      sector: stockCase.sector || '',
      market_cap: stockCase.market_cap || '',
      description: stockCase.description || '',
      admin_comment: stockCase.admin_comment || '',
      entry_price: stockCase.entry_price?.toString() || '',
      current_price: stockCase.current_price?.toString() || '',
      target_price: stockCase.target_price?.toString() || '',
      stop_loss: stockCase.stop_loss?.toString() || '',
      category_id: stockCase.category_id || '',
    });
    if (stockCase.image_url) {
      setImagePreview(stockCase.image_url);
    }
    setEditingCase(stockCase.id);
    setShowCreateForm(true);
  };

  const handleStatusChange = async (caseId: string, newStatus: 'active' | 'winner' | 'loser') => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };
      
      if (newStatus !== 'active') {
        updateData.closed_at = new Date().toISOString();
      } else {
        updateData.closed_at = null;
      }

      const { error } = await supabase
        .from('stock_cases')
        .update(updateData)
        .eq('id', caseId);

      if (error) throw error;

      toast({
        title: "Framgång",
        description: "Status uppdaterad framgångsrikt",
      });

      fetchAllCases();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (caseId: string) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta aktiecase?')) {
      return;
    }

    try {
      await deleteStockCase(caseId);
      fetchAllCases();
    } catch (error) {
      console.error('Error deleting case:', error);
    }
  };

  const canEditCase = (stockCase: StockCaseWithActions) => {
    return isAdmin || stockCase.user_id === user.id;
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-yellow-100 text-yellow-800',
      winner: 'bg-green-100 text-green-800',
      loser: 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      active: 'Aktiv',
      winner: 'Vinnare',
      loser: 'Förlorare'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  const getCategoryBadge = (category: { name: string; color: string } | undefined) => {
    if (!category) return null;
    
    return (
      <Badge style={{ backgroundColor: category.color + '20', color: category.color, borderColor: category.color }}>
        {category.name}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isAdmin ? 'Admin - Hantera Innehåll' : 'Mina Aktiecases'}
              </h1>
              <p className="text-gray-600 mt-2">
                {isAdmin 
                  ? 'Hantera aktiecases och analyser i systemet' 
                  : 'Hantera dina egna aktiecases'
                }
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="stock-cases" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stock-cases">Aktiecases</TabsTrigger>
            <TabsTrigger value="analyses">Analyser</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stock-cases" className="space-y-8">
            <div className="flex justify-end">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Skapa nytt case
              </Button>
            </div>

            {showCreateForm && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>
                    {editingCase ? 'Redigera Akticase' : 'Skapa nytt Akticase'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Index checkbox - only show when creating new case */}
                    {!editingCase && (
                      <div className="flex items-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Checkbox
                          id="creating-index"
                          checked={isCreatingIndex}
                          onCheckedChange={handleIndexCheckboxChange}
                        />
                        <Label htmlFor="creating-index" className="text-sm font-medium">
                          Skapar nytt index
                        </Label>
                        <p className="text-xs text-gray-600 dark:text-gray-400 ml-2">
                          (Ställer automatiskt in kategori till "Index" och döljer irrelevanta fält)
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Titel *</Label>
                        <Input
                          id="title"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder={isCreatingIndex ? "Ex: S&P 500 - Amerikanska storbolag" : "Ex: Tesla - Framtidens mobilitet"}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company_name">Ticker *</Label>
                        <Input
                          id="company_name"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                          placeholder={isCreatingIndex ? "Ex: $SPY" : "Ex: $TSLA"}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Kategori/Sektor</Label>
                        <Select 
                          value={formData.category_id || "none"} 
                          onValueChange={handleCategoryChange}
                          disabled={isCreatingIndex}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Välj kategori..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Ingen kategori</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: category.color }}
                                  />
                                  {category.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {isCreatingIndex && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Kategori sätts automatiskt till "Index"
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sector">Sektor (fritext)</Label>
                        <Input
                          id="sector"
                          name="sector"
                          value={formData.sector}
                          onChange={handleInputChange}
                          placeholder={isCreatingIndex ? "Index" : "Ex: Bilindustri"}
                          disabled={isCreatingIndex}
                        />
                        {isCreatingIndex && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Sektor sätts automatiskt till "Index"
                          </p>
                        )}
                      </div>

                      {/* Hide market cap field when creating index */}
                      {!isCreatingIndex && (
                        <div className="space-y-2">
                          <Label htmlFor="market_cap">Börsvärde</Label>
                          <Input
                            id="market_cap"
                            name="market_cap"
                            value={formData.market_cap}
                            onChange={handleInputChange}
                            placeholder="Ex: 800 miljarder USD"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="entry_price">Inköpspris (kr)</Label>
                        <Input
                          id="entry_price"
                          name="entry_price"
                          type="number"
                          step="0.01"
                          value={formData.entry_price}
                          onChange={handleInputChange}
                          placeholder="Ex: 1250.50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="current_price">Nuvarande pris (kr)</Label>
                        <Input
                          id="current_price"
                          name="current_price"
                          type="number"
                          step="0.01"
                          value={formData.current_price}
                          onChange={handleInputChange}
                          placeholder="Ex: 1450.75"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target_price">Målpris (kr)</Label>
                        <Input
                          id="target_price"
                          name="target_price"
                          type="number"
                          step="0.01"
                          value={formData.target_price}
                          onChange={handleInputChange}
                          placeholder="Ex: 1800.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stop_loss">Stop Loss (kr)</Label>
                        <Input
                          id="stop_loss"
                          name="stop_loss"
                          type="number"
                          step="0.01"
                          value={formData.stop_loss}
                          onChange={handleInputChange}
                          placeholder="Ex: 1100.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">
                        {isCreatingIndex ? 'Index Chart (JPG, PNG, WebP - max 5MB)' : 'Aktiekurs Chart (JPG, PNG, WebP - max 5MB)'}
                      </Label>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Input
                            id="image"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleImageChange}
                            className="flex-1"
                          />
                          <Upload className="w-4 h-4 text-gray-400" />
                        </div>
                        
                        {imagePreview && (
                          <div className="relative inline-block">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-32 h-32 object-cover rounded-lg border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={removeImage}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                        
                        {imageFile && (
                          <p className="text-sm text-gray-600">Vald fil: {imageFile.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Beskrivning</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder={isCreatingIndex ? "Kort beskrivning av indexet..." : "Kort beskrivning av företaget..."}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin_comment">Admin Kommentar</Label>
                      <Textarea
                        id="admin_comment"
                        name="admin_comment"
                        value={formData.admin_comment}
                        onChange={handleInputChange}
                        placeholder={isCreatingIndex ? "Varför är detta ett bra index att investera i? Din analys och rekommendation..." : "Varför är detta en bra aktie att köpa? Din analys och rekommendation..."}
                        rows={4}
                      />
                    </div>

                    <div className="flex gap-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? 'Sparar...' : editingCase ? 'Uppdatera Case' : 'Skapa Case'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={resetForm}
                        className="flex-1"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Avbryt
                      </Button>
                    </div>
                  </form>

                  {/* Add image history manager for editing mode */}
                  {editingCase && (
                    <AdminImageHistoryManager
                      stockCaseId={editingCase}
                      canEdit={true}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>
                  {isAdmin ? 'Alla Aktiecases' : 'Mina Aktiecases'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Laddar aktiecases...</p>
                  </div>
                ) : allCases.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Inga aktiecases hittades.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Ticker</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Skapare</TableHead>
                          <TableHead>Inköp/Mål</TableHead>
                          <TableHead>Skapad</TableHead>
                          <TableHead>Åtgärder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allCases.map((stockCase) => (
                          <TableRow key={stockCase.id}>
                            <TableCell className="font-medium">
                              {stockCase.title}
                            </TableCell>
                            <TableCell>{stockCase.company_name}</TableCell>
                            <TableCell>
                              {getCategoryBadge(stockCase.case_categories)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(stockCase.status)}
                                <Select
                                  value={stockCase.status}
                                  onValueChange={(value) => handleStatusChange(stockCase.id, value as 'active' | 'winner' | 'loser')}
                                  disabled={!canEditCase(stockCase)}
                                >
                                  <SelectTrigger className="w-32 h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Aktiv</SelectItem>
                                    <SelectItem value="winner">Vinnare</SelectItem>
                                    <SelectItem value="loser">Förlorare</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </TableCell>
                            <TableCell>
                              {stockCase.profiles?.display_name || stockCase.profiles?.username || 'Admin'}
                            </TableCell>
                            <TableCell>
                              {stockCase.entry_price && stockCase.target_price ? (
                                <div className="text-sm">
                                  <div>{stockCase.entry_price} kr</div>
                                  <div className="text-gray-500">→ {stockCase.target_price} kr</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(stockCase.created_at).toLocaleDateString('sv-SE')}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {canEditCase(stockCase) && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(stockCase)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDelete(stockCase.id)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analyses">
            <AdminAnalysesDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminStockCases;
