import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { getCategoryFields, type FieldDefinition } from '@/lib/categoryFields';
import ImageUpload from '@/components/ImageUpload';

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

export default function EditAnnouncement() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isResubmit = searchParams.get('resubmit') === 'true';
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    categoryId: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchCategories();
    fetchAnnouncement();
  }, [user, navigate, id]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');
    
    setCategories(data || []);
  };

  const fetchAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.user_id !== user!.id) {
        toast.error('You can only edit your own listings');
        navigate('/my-listings');
        return;
      }

      setFormData({
        title: data.title,
        description: data.description,
        price: data.price.toString(),
        location: data.location || '',
        categoryId: data.category_id,
      });
      setExistingImages(data.images || []);
      setAttributes((data.attributes as Record<string, any>) || {});
    } catch (error) {
      console.error('Error fetching announcement:', error);
      toast.error('Failed to load announcement');
      navigate('/my-listings');
    } finally {
      setLoading(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    const price = parseFloat(formData.price);

    if (isNaN(price)) {
      toast.error('Please enter a valid price');
      setIsLoading(false);
      return;
    }

    const validation = announcementSchema.safeParse({ 
      title: formData.title, 
      description: formData.description, 
      price, 
      location: formData.location || '', 
      categoryId: formData.categoryId 
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      setIsLoading(false);
      return;
    }

    try {
      // Upload new images
      const newImageUrls: string[] = [];
      for (const file of selectedImages) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('announcements')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('announcements')
          .getPublicUrl(fileName);

        newImageUrls.push(publicUrl);
      }

      // Combine existing and new images
      const allImages = [...existingImages, ...newImageUrls];

      // Build update data
      const updateData: Record<string, any> = {
        title: validation.data.title,
        description: validation.data.description,
        price: validation.data.price,
        location: validation.data.location || null,
        category_id: validation.data.categoryId,
        images: allImages,
        attributes: attributes,
      };

      // If resubmitting, reset status to pending and clear rejection reason
      if (isResubmit) {
        updateData.status = 'pending';
        updateData.rejection_reason = null;
      }

      // Update announcement
      const { error } = await supabase
        .from('announcements')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      if (isResubmit) {
        navigate('/my-listings?resubmitted=true');
      } else {
        toast.success('Listing updated successfully!');
        navigate('/my-listings');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update listing');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Button variant="ghost" onClick={() => navigate('/my-listings')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>{isResubmit ? 'Edit & Resubmit Listing' : 'Edit Listing'}</CardTitle>
            {isResubmit && (
              <p className="text-sm text-muted-foreground">
                Make your changes and save to resubmit for admin review.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="What are you selling?"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your item..."
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, categoryId: value });
                    // Don't reset attributes when changing category during edit
                  }}
                  required
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
              {formData.categoryId && (() => {
                const category = categories.find(c => c.id === formData.categoryId);
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
                <Label>Images (max 5)</Label>
                <ImageUpload
                  maxImages={5}
                  existingImages={existingImages}
                  onExistingImagesChange={setExistingImages}
                  selectedFiles={selectedImages}
                  onFilesChange={setSelectedImages}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Saving...' : isResubmit ? 'Save & Resubmit for Review' : 'Update Listing'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
