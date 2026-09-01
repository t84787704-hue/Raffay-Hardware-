import { Category, ProductItem } from '../types';
import { INITIAL_CATEGORIES_100 } from './allCategories';
import { INITIAL_PRODUCTS } from './initialProducts';

export const COMPANY_INFO = {
  name: 'Raffay Hardware Company',
  groupName: 'RHC Group',
  tagline: 'Leading Wholesale Hardware Importers & Manufacturers',
  whatsappDisplay: '0311-9655243',
  whatsappRaw: '923119655243',
  phone: '+92 311 9655243',
  email: 'info@rhchardware.com',
  address: 'Raffay Hardware, Brandreth Road, Lahore, Pakistan',
  workingHours: 'Mon - Sat: 9:00 AM - 8:00 PM',
  establishedYear: '2008',
  deliveryCoverage: 'Nationwide Cargo Delivery across Lahore, Karachi, Rawalpindi, Peshawar, Faisalabad, Multan & all cities',
};

export const CATEGORIES: Category[] = INITIAL_CATEGORIES_100;
export const FEATURED_PRODUCTS: ProductItem[] = INITIAL_PRODUCTS;

export const WHOLESALE_BENEFITS = [
  {
    icon: 'Factory',
    title: 'Direct Factory & Import Rates',
    description: 'Cut out middlemen with direct manufacturing and direct container imports from top global hardware foundries.'
  },
  {
    icon: 'Truck',
    title: 'Nationwide Bulk Dispatch',
    description: 'Express freight and cargo delivery to Lahore, Karachi, Rawalpindi, Peshawar, Faisalabad, Multan, and all cities.'
  },
  {
    icon: 'ShieldCheck',
    title: '100% Quality Guaranteed',
    description: 'Strict metallurgical testing on all die-cast zinc alloys, solid brass castings, and bearing longevity.'
  },
  {
    icon: 'Layers',
    title: '100+ Categories in Volume',
    description: 'Extensive ready inventory with thousands of dozens ready for same-day cargo dispatch for projects and retail shops.'
  }
];
