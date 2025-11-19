import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';
import { z } from 'zod';
import { getCategoryFields, type FieldDefinition } from '@/lib/categoryFields';

const announcementSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  description: z.string().trim().min(20, 'Description must be at least 20 characters').max(5000, 'Description too long'),
  price: z.number().positive('Price must be positive').max(999999999, 'Price too high'),
  location: z.string().trim().max(200, 'Location too long').optional(),
  categoryId: z.string().uuid('Invalid category'),
});

interface Category {
  id: string;
  name: string;
}

export default function CreateAnnouncement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [attributes, setAttributes] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
  }, [user, navigate]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    setCategories(data || []);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const priceStr = formData.get('price') as string;
    const price = parseFloat(priceStr);
    const location = formData.get('location') as string;
    const categoryId = formData.get('category') as string;

    // Validate input
    if (isNaN(price)) {
      toast.error('Please enter a valid price');
      setIsLoading(false);
      return;
    }

    const validation = announcementSchema.safeParse({ 
      title, 
      description, 
      price, 
      location: location || '', 
      categoryId 
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const file of selectedImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('announcements')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('announcements')
          .getPublicUrl(fileName);

        imageUrls.push(publicUrl);
      }

      // Create announcement
      const { error } = await supabase
        .from('announcements')
        .insert({
          user_id: user.id,
          category_id: validation.data.categoryId,
          title: validation.data.title,
          description: validation.data.description,
          price: validation.data.price,
          location: validation.data.location || null,
          images: imageUrls,
          attributes: attributes,
        });

      if (error) throw error;

      toast.success('Announcement created successfully!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create announcement');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Create New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="What are you selling?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select 
                  name="category" 
                  required
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setAttributes({}); // Reset attributes when category changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category-specific fields */}
              {selectedCategory && (() => {
                const category = categories.find(c => c.id === selectedCategory);
                if (!category) return null;
                
                const fields = getCategoryFields(category.name);
                if (fields.length === 0) return null;

                return (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                    <h3 className="font-semibold">Additional Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {fields.map((field: FieldDefinition) => (
                        <div key={field.name} className="space-y-2">
                          <Label htmlFor={field.name}>
                            {field.label}
                            {field.required && ' *'}
                          </Label>
                          {field.type === 'select' ? (
                            <Select
                              value={attributes[field.name] || ''}
                              onValueChange={(value) => setAttributes({ ...attributes, [field.name]: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              id={field.name}
                              type={field.type}
                              value={attributes[field.name] || ''}
                              onChange={(e) => setAttributes({ ...attributes, [field.name]: e.target.value })}
                              placeholder={field.placeholder}
                              required={field.required}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe your item..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (€) *</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="City"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="images">Images (max 5)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="images"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('images')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Images
                  </Button>
                  {selectedImages.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {selectedImages.length} image(s) selected
                    </span>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create Announcement'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
