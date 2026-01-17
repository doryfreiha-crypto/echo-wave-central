// Category-specific field definitions
export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
  required?: boolean;
  placeholder?: string;
}

export const categoryFields: Record<string, FieldDefinition[]> = {
  vehicles: [
    { name: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Toyota, BMW' },
    { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g. Corolla, X5' },
    { name: 'year', label: 'Year', type: 'number', placeholder: '2020' },
    { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Black, White' },
    { name: 'mileage', label: 'Mileage (km)', type: 'number', placeholder: '50000' },
    { name: 'transmission', label: 'Transmission', type: 'select', options: ['Manual', 'Automatic', 'Semi-automatic'] },
    { name: 'fuelType', label: 'Fuel Type', type: 'select', options: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG'] },
    { name: 'engineSize', label: 'Engine Size (L)', type: 'number', placeholder: '2.0' },
    { name: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Very Good', 'Good', 'Fair'] },
    { name: 'owners', label: 'Number of Owners', type: 'number', placeholder: '1' },
    { name: 'serviceHistory', label: 'Service History', type: 'select', options: ['Full', 'Partial', 'None'] },
  ],
  'real-estate': [
    { name: 'rooms', label: 'Total Rooms', type: 'number', placeholder: '4' },
    { name: 'bedrooms', label: 'Bedrooms', type: 'number', placeholder: '2' },
    { name: 'bathrooms', label: 'Bathrooms', type: 'number', placeholder: '1' },
    { name: 'floor', label: 'Floor', type: 'number', placeholder: '3' },
    { name: 'totalFloors', label: 'Total Floors', type: 'number', placeholder: '5' },
    { name: 'heatingType', label: 'Heating Type', type: 'select', options: ['Central', 'Individual', 'Gas', 'Electric', 'None'] },
    { name: 'parking', label: 'Parking', type: 'select', options: ['Yes', 'No', 'Optional'] },
    { name: 'balcony', label: 'Balcony', type: 'select', options: ['Yes', 'No'] },
    { name: 'elevator', label: 'Elevator', type: 'select', options: ['Yes', 'No'] },
    { name: 'furnished', label: 'Furnished', type: 'select', options: ['Fully Furnished', 'Semi Furnished', 'Unfurnished'] },
    { name: 'squareMeters', label: 'Size (m²)', type: 'number', placeholder: '75' },
    { name: 'propertyType', label: 'Property Type', type: 'select', options: ['Apartment', 'House', 'Studio', 'Villa', 'Loft'] },
  ],
  electronics: [
    { name: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Apple, Samsung' },
    { name: 'model', label: 'Model', type: 'text', placeholder: 'e.g. iPhone 14, Galaxy S23' },
    { name: 'condition', label: 'Condition', type: 'select', options: ['New', 'Like New', 'Good', 'Fair', 'For Parts'] },
    { name: 'warranty', label: 'Warranty', type: 'select', options: ['Yes', 'No', 'Expired'] },
    { name: 'storage', label: 'Storage', type: 'text', placeholder: 'e.g. 128GB, 256GB' },
    { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Black, Silver' },
  ],
  fashion: [
    { name: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Nike, Zara' },
    { name: 'size', label: 'Size', type: 'text', placeholder: 'e.g. M, L, 42' },
    { name: 'condition', label: 'Condition', type: 'select', options: ['New with tags', 'New without tags', 'Excellent', 'Good', 'Fair'] },
    { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Black, Blue' },
    { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Cotton, Leather' },
  ],
};

export function getCategoryFields(categoryName: string): FieldDefinition[] {
  const normalizedName = categoryName.toLowerCase().replace(/\s+/g, '-');
  return categoryFields[normalizedName] || [];
}
