
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStockCases } from '@/hooks/useStockCases';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, ArrowLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminStockCases = () => {
  const { user } = useAuth();
  const { createStockCase, uploadImage } = useStockCases();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    company_name: '',
    sector: '',
    market_cap: '',
    description: '',
    admin_comment: '',
  });

  // Check if user is admin (you'll need to implement this check)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center">Du måste vara inloggad som admin för att komma åt denna sida.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Fel filtyp",
          description: "Endast JPG, PNG och WebP-filer är tillåtna",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
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
      
      // Create preview
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
    // Reset file input
    const fileInput = document.getElementById('image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
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
      if (imageFile) {
        console.log('Uploading image file:', imageFile.name);
        imageUrl = await uploadImage(imageFile);
        console.log('Image uploaded successfully:', imageUrl);
      }

      await createStockCase({
        ...formData,
        image_url: imageUrl,
        pe_ratio: null,
        dividend_yield: null,
      });

      // Reset form
      setFormData({
        title: '',
        company_name: '',
        sector: '',
        market_cap: '',
        description: '',
        admin_comment: '',
      });
      setImageFile(null);
      setImagePreview(null);

      toast({
        title: "Framgång",
        description: "Akticase skapat framgångsrikt!",
      });
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      // Error handled in hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till startsidan
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Admin - Skapa Akticase</h1>
          <p className="text-gray-600 mt-2">Ladda upp nya aktiecases för användarna att utforska</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nytt Akticase</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Ex: Tesla - Framtidens mobilitet"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_name">Företagsnamn *</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    placeholder="Ex: Tesla Inc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Sektor</Label>
                  <Input
                    id="sector"
                    name="sector"
                    value={formData.sector}
                    onChange={handleInputChange}
                    placeholder="Ex: Bilindustri"
                  />
                </div>

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
              </div>

              <div className="space-y-2">
                <Label htmlFor="image">Aktiekurs Chart (JPG, PNG, WebP - max 5MB)</Label>
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
                  placeholder="Kort beskrivning av företaget..."
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
                  placeholder="Varför är detta en bra aktie att köpa? Din analys och rekommendation..."
                  rows={4}
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Skapar...' : 'Skapa Akticase'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminStockCases;
