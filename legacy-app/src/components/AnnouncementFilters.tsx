import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';
import { getCategoryFields, type FieldDefinition } from '@/lib/categoryFields';
import { translateAttribute, translateOption } from '@/lib/translateCategory';
interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface FilterState {
  categoryId: string;
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
  location: string;
  attributes: Record<string, string>;
}

interface AnnouncementFiltersProps {
  categories: Category[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
}

export default function AnnouncementFilters({ 
  categories, 
  filters, 
  onFiltersChange,
  onReset
}: AnnouncementFiltersProps) {
  const { t } = useTranslation();
  const [selectedCategoryFields, setSelectedCategoryFields] = useState<FieldDefinition[]>([]);

  useEffect(() => {
    if (filters.categoryId) {
      const category = categories.find(c => c.id === filters.categoryId);
      if (category) {
        setSelectedCategoryFields(getCategoryFields(category.name));
      }
    } else {
      setSelectedCategoryFields([]);
    }
  }, [filters.categoryId, categories]);

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      categoryId,
      attributes: {}, // Reset attributes when category changes
    });
  };

  const handlePriceChange = (values: number[]) => {
    onFiltersChange({
      ...filters,
      minPrice: values[0],
      maxPrice: values[1],
    });
  };

  const handleAttributeChange = (name: string, value: string) => {
    // Remove attribute if "any" is selected
    if (value === 'any') {
      const newAttributes = { ...filters.attributes };
      delete newAttributes[name];
      onFiltersChange({
        ...filters,
        attributes: newAttributes,
      });
    } else {
      onFiltersChange({
        ...filters,
        attributes: {
          ...filters.attributes,
          [name]: value,
        },
      });
    }
  };

  const handleRemoveAttribute = (name: string) => {
    const newAttributes = { ...filters.attributes };
    delete newAttributes[name];
    onFiltersChange({
      ...filters,
      attributes: newAttributes,
    });
  };

  const hasActiveFilters = filters.categoryId || filters.location || 
    filters.minPrice > 0 || filters.maxPrice < 1000000 || 
    Object.keys(filters.attributes).length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('common.filters')}</CardTitle>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t('common.clearAll')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category Filter */}
        <div className="space-y-2">
          <Label>{t('filters.category')}</Label>
          <Select value={filters.categoryId} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder={t('categories.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('categories.all')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {t(`categories.${category.slug}`, category.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div className="space-y-2">
          <Label htmlFor="location">{t('filters.location')}</Label>
          <Input
            id="location"
            placeholder={t('filters.locationPlaceholder')}
            value={filters.location}
            onChange={(e) => onFiltersChange({ ...filters, location: e.target.value })}
          />
        </div>

        {/* Price Range Filter */}
        <div className="space-y-4">
          <Label>{t('filters.priceRange')}</Label>
          <div className="px-2">
            <Slider
              min={0}
              max={1000000}
              step={1000}
              value={[filters.minPrice, filters.maxPrice]}
              onValueChange={handlePriceChange}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>${filters.minPrice.toLocaleString()}</span>
            <span>-</span>
            <span>${filters.maxPrice.toLocaleString()}</span>
          </div>
        </div>

        {/* Category-Specific Filters */}
        {selectedCategoryFields.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <Label className="text-base font-semibold">{t('attributes.specificFilters')}</Label>
            {selectedCategoryFields.map((field) => (
              <div key={field.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>{translateAttribute(field.name, t)}</Label>
                  {filters.attributes[field.name] && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttribute(field.name)}
                      className="h-auto p-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {field.type === 'select' && field.options ? (
                  <Select
                    value={filters.attributes[field.name] || 'any'}
                    onValueChange={(value) => handleAttributeChange(field.name, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`${t('common.all')} ${translateAttribute(field.name, t).toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{t('common.any')}</SelectItem>
                      {field.options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {translateOption(option, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    value={filters.attributes[field.name] || ''}
                    onChange={(e) => handleAttributeChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
