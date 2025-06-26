
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useStockCaseOperations } from '@/hooks/useStockCaseOperations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft, X, Edit, Trash2, Plus, Save, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

type StockCaseWithActions = {
  id: string;
  title: string;
  company_name: string;
  image_url: string | null;
  sector: string | null;
  market_cap: string | null;
  description: string | null;
  admin_comment: string | null;
  user_id: string | null;
  status: 'active' | 'winner' | 'loser';
  entry_price: number | null;
  current_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  is_public: boolean;
  category_id: string | null;
  created_at: string;
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

const MyStockCases = () => {
  const { user, loading: authLoading } = useAuth();
  const { createStockCase, uploadImage, deleteStockCase } = useStockCaseOperations();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [myCases, setMyCases] = useState<StockCaseWithActions[]>([]);
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.id && !authLoading) {
      fetchMyCases();
      fetchCategories();
    }
  }, [user?.id, authLoading]);

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

  const fetchMyCases = async () => {
    try {
      setLoading(true);
      
      const { data: casesData, error } = await supabase
        .from('stock_cases')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      // Transform the data
      const transformedData: StockCaseWithActions[] = (casesData || []).map(stockCase => {
        const category = categoriesData.find(c => c.id === stockCase.category_id);
        
        return {
          ...stockCase,
          status: (stockCase.status || 'active') as 'active' | 'winner' | 'loser',
          case_categories: category ? { 
            name: category.name, 
            color: category.color 
          } : undefined
        };
      });

      setMyCases(transformedData);
    } catch (error: any) {
      console.error('Error fetching cases:', error);
      toast({
        title: "Fel",
        description: "Kunde inte ladda dina aktiecases",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    let value = e.target.value;
    
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
      const indexCategory = categories.find(cat => cat.name.toLowerCase().includes('index'));
      setFormData(prev => ({
        ...prev,
        sector: 'Index',
        market_cap: '',
        category_id: indexCategory ? indexCategory.id : '',
      }));
    } else {
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
      
      if (editingCase && !imageFile && imagePreview) {
        const existingCase = myCases.find(c => c.id === editingCase);
        imageUrl = existingCase?.image_url || null;
      } else if (imageFile) {
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
        user_id: user?.id,
      };

      if (editingCase) {
        await updateStockCase(editingCase, caseData);
      } else {
        await createStockCase(caseData);
      }

      resetForm();
      fetchMyCases();

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
      .eq('id', caseId)
      .eq('user_id', user?.id);

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

  const handleDelete = async (caseId: string) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta aktiecase?')) {
      return;
    }

    try {
      await deleteStockCase(caseId);
      fetchMyCases();
    } catch (error) {
      console.error('Error deleting case:', error);
    }
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

  if (authLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-[70vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finance-navy"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Mina Aktiecases
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Hantera dina egna aktiecases och följ deras utveckling
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Skapa nytt case
            </Button>
          </div>
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
                  </div>

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
                  <Label htmlFor="admin_comment">Din Analys</Label>
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
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Mina Aktiecases ({myCases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Laddar dina aktiecases...</p>
              </div>
            ) : myCases.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Du har inte skapat några aktiecases än.</p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Skapa ditt första aktiecase
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {myCases.map((stockCase) => (
                  <div key={stockCase.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                          {stockCase.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {stockCase.company_name}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(stockCase.status)}
                          {getCategoryBadge(stockCase.case_categories)}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/stock-cases/${stockCase.id}`)}>
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(stockCase)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Ta bort aktiecase</AlertDialogTitle>
                              <AlertDialogDescription>
                                Är du säker på att du vill ta bort detta aktiecase? Denna åtgärd kan inte ångras.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(stockCase.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Ta bort
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    
                    {stockCase.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {stockCase.description.substring(0, 150)}...
                      </p>
                    )}
                    
                    {(stockCase.entry_price || stockCase.current_price || stockCase.target_price || stockCase.stop_loss) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        {stockCase.entry_price && (
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Entry</div>
                            <div className="text-sm font-semibold">{stockCase.entry_price} kr</div>
                          </div>
                        )}
                        {stockCase.current_price && (
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Current</div>
                            <div className="text-sm font-semibold">{stockCase.current_price} kr</div>
                          </div>
                        )}
                        {stockCase.target_price && (
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Target</div>
                            <div className="text-sm font-semibold">{stockCase.target_price} kr</div>
                          </div>
                        )}
                        {stockCase.stop_loss && (
                          <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="text-xs text-gray-500 dark:text-gray-400">Stop Loss</div>
                            <div className="text-sm font-semibold">{stockCase.stop_loss} kr</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Skapad: {new Date(stockCase.created_at).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyStockCases;
