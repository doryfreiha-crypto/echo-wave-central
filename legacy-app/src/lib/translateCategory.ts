import { TFunction } from 'i18next';

// Map category names/slugs to translation keys
const categoryKeyMap: Record<string, string> = {
  'vehicles': 'vehicles',
  'real-estate': 'real-estate',
  'real estate': 'real-estate',
  'electronics': 'electronics',
  'fashion': 'fashion',
  'jobs': 'jobs',
  'services': 'services',
  'furniture': 'furniture',
  'sports': 'sports',
  'pets': 'pets',
  'other': 'other',
};

export function translateCategory(name: string, t: TFunction): string {
  const normalizedName = name.toLowerCase().replace(/\s+/g, '-');
  const key = categoryKeyMap[normalizedName] || categoryKeyMap[name.toLowerCase()];
  
  if (key) {
    const translated = t(`categories.${key}`);
    // If translation exists and is different from the key, return it
    if (translated && translated !== `categories.${key}`) {
      return translated;
    }
  }
  
  // Fallback to original name if no translation found
  return name;
}

// Map attribute field names to translation keys
const attributeKeyMap: Record<string, string> = {
  'brand': 'brand',
  'model': 'model',
  'year': 'year',
  'color': 'color',
  'mileage': 'mileage',
  'transmission': 'transmission',
  'fuelType': 'fuelType',
  'engineSize': 'engineSize',
  'condition': 'condition',
  'owners': 'owners',
  'serviceHistory': 'serviceHistory',
  'rooms': 'rooms',
  'bedrooms': 'bedrooms',
  'bathrooms': 'bathrooms',
  'floor': 'floor',
  'totalFloors': 'totalFloors',
  'heatingType': 'heatingType',
  'parking': 'parking',
  'balcony': 'balcony',
  'elevator': 'elevator',
  'furnished': 'furnished',
  'squareMeters': 'squareMeters',
  'propertyType': 'propertyType',
  'warranty': 'warranty',
  'storage': 'storage',
  'size': 'size',
  'material': 'material',
};

export function translateAttribute(name: string, t: TFunction): string {
  const key = attributeKeyMap[name];
  
  if (key) {
    const translated = t(`attributes.${key}`);
    if (translated && translated !== `attributes.${key}`) {
      return translated;
    }
  }
  
  return name;
}

// Map option values to translation keys
const optionKeyMap: Record<string, string> = {
  'Manual': 'manual',
  'Automatic': 'automatic',
  'Semi-automatic': 'semiAutomatic',
  'Petrol': 'petrol',
  'Diesel': 'diesel',
  'Electric': 'electric',
  'Hybrid': 'hybrid',
  'LPG': 'lpg',
  'Excellent': 'excellent',
  'Very Good': 'veryGood',
  'Good': 'good',
  'Fair': 'fair',
  'Full': 'full',
  'Partial': 'partial',
  'None': 'none',
  'Central': 'central',
  'Individual': 'individual',
  'Gas': 'gas',
  'Yes': 'yes',
  'No': 'no',
  'Optional': 'optional',
  'Fully Furnished': 'fullyFurnished',
  'Semi Furnished': 'semiFurnished',
  'Unfurnished': 'unfurnished',
  'Apartment': 'apartment',
  'House': 'house',
  'Studio': 'studio',
  'Villa': 'villa',
  'Loft': 'loft',
  'New': 'new',
  'Like New': 'likeNew',
  'For Parts': 'forParts',
  'Expired': 'expired',
  'New with tags': 'newWithTags',
  'New without tags': 'newWithoutTags',
};

export function translateOption(option: string, t: TFunction): string {
  const key = optionKeyMap[option];
  
  if (key) {
    const translated = t(`attributes.options.${key}`);
    if (translated && translated !== `attributes.options.${key}`) {
      return translated;
    }
  }
  
  return option;
}
