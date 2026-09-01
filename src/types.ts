export interface Category {
  id: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  image: string;
  itemCount: string;
  badge: string;
  material: string;
  popularFinishes: string[];
  keyFeatures: string[];
  order?: number; // Display order index for drag and drop reordering
}

export interface ProductImages {
  front: string;
  side: string;
  installed: string;
}

export interface ProductItem {
  id: string;
  name: string; // Product Name (Required)
  categoryId: string; // Category ID (Required)
  categoryName?: string; // Category Name
  images?: string[] | { front?: string; side?: string; installed?: string; [key: string]: any }; // 4-Image array (Base64 or URL)
  
  // Optional / backward-compatibility fields
  productName?: string;
  category?: string;
  sku?: string;
  price?: number;
  wholesalePrice?: number;
  retailPrice?: number;
  stock?: number;
  stockCount?: number;
  unit?: string;
  material?: string;
  finish?: string;
  finishes?: string[];
  sizeOrSpec?: string;
  minOrderQty?: string;
  packSize?: string;
  description?: string;
  image?: string;
  imageBase64?: string;
  image_main?: string;
  image_side?: string;
  image_back?: string;
  image_detail?: string;
  image_url?: string;
  featurePoint1?: string;
  featurePoint2?: string;
  tags?: string[];
  inStock?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface InquiryItem {
  product: ProductItem;
  quantity: number;
  notes?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'Super Admin' | 'Inventory Manager' | 'Sales Admin';
  lastLogin?: string;
}

