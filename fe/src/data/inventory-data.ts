// Shared inventory data for warehouse system
export interface InventoryItem {
  id: number
  name: string
  sku: string
  category: string
  quantity: number
  unit: string
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  lastUpdated: string
  supplier?: string
  conversionRate?: number
  minQuantity?: number
}

export const inventoryData: InventoryItem[] = [
  { 
    id: 1, 
    name: 'Apple Fuji', 
    sku: 'APL123', 
    category: 'Fresh Produce', 
    quantity: 150, 
    unit: 'kg', 
    status: 'in-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Fresh Farms Co.',
    conversionRate: 5 
  },
  { 
    id: 2, 
    name: 'Instant Noodles', 
    sku: 'NDL456', 
    category: 'Dry Goods', 
    quantity: 20, 
    unit: 'boxes', 
    status: 'low-stock', 
    lastUpdated: '2024-02-24',
    supplier: 'Acecook Vietnam',
    conversionRate: 12,
    minQuantity: 50
  },
  { 
    id: 3, 
    name: 'Fresh Milk 1L', 
    sku: 'MLK789', 
    category: 'Dairy', 
    quantity: 0, 
    unit: 'liters', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-23',
    supplier: 'Vinamilk',
    conversionRate: 1 
  },
  { 
    id: 4, 
    name: 'Bottled Water 500ml', 
    sku: 'WTR555', 
    category: 'Beverages', 
    quantity: 500, 
    unit: 'bottles', 
    status: 'in-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Lavie',
    conversionRate: 1 
  },
  { 
    id: 5, 
    name: 'Cooking Oil 1L', 
    sku: 'OIL678', 
    category: 'Cooking Essentials', 
    quantity: 75, 
    unit: 'liters', 
    status: 'in-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Neptune',
    conversionRate: 1 
  },
  { 
    id: 6, 
    name: 'Rice 5kg', 
    sku: 'RIC901', 
    category: 'Dry Goods', 
    quantity: 120, 
    unit: 'bags', 
    status: 'in-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'ST25 Rice',
    conversionRate: 1 
  },
  { 
    id: 7, 
    name: 'Eggs Pack', 
    sku: 'EGG234', 
    category: 'Dairy', 
    quantity: 8, 
    unit: 'cartons', 
    status: 'low-stock', 
    lastUpdated: '2024-02-24',
    supplier: 'CP Vietnam',
    conversionRate: 12,
    minQuantity: 30
  },
  { 
    id: 8, 
    name: 'Sugar 1kg', 
    sku: 'SUG567', 
    category: 'Cooking Essentials', 
    quantity: 15, 
    unit: 'kg', 
    status: 'low-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Bien Hoa Sugar',
    conversionRate: 5,
    minQuantity: 40
  },
  { 
    id: 9, 
    name: 'Soy Sauce 500ml', 
    sku: 'SOY101', 
    category: 'Cooking Essentials', 
    quantity: 85, 
    unit: 'bottles', 
    status: 'in-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'Chin-su',
    conversionRate: 1 
  },
  { 
    id: 10, 
    name: 'Fresh Tomatoes', 
    sku: 'TOM202', 
    category: 'Fresh Produce', 
    quantity: 60, 
    unit: 'kg', 
    status: 'in-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Fresh Farms Co.',
    conversionRate: 5 
  },
  { 
    id: 11, 
    name: 'Yogurt 100g', 
    sku: 'YOG303', 
    category: 'Dairy', 
    quantity: 12, 
    unit: 'cups', 
    status: 'low-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Vinamilk',
    conversionRate: 4,
    minQuantity: 50
  },
  { 
    id: 12, 
    name: 'Green Tea Bags', 
    sku: 'TEA404', 
    category: 'Beverages', 
    quantity: 200, 
    unit: 'boxes', 
    status: 'in-stock', 
    lastUpdated: '2024-02-28',
    supplier: 'Lipton',
    conversionRate: 25 
  },
  { 
    id: 13, 
    name: 'White Bread', 
    sku: 'BRD505', 
    category: 'Bakery', 
    quantity: 0, 
    unit: 'loaves', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'ABC Bakery',
    conversionRate: 1 
  },
  { 
    id: 14, 
    name: 'Fresh Carrots', 
    sku: 'CAR606', 
    category: 'Fresh Produce', 
    quantity: 45, 
    unit: 'kg', 
    status: 'in-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Fresh Farms Co.',
    conversionRate: 2 
  },
  { 
    id: 15, 
    name: 'Coffee Powder 200g', 
    sku: 'COF707', 
    category: 'Beverages', 
    quantity: 18, 
    unit: 'packs', 
    status: 'low-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Trung Nguyen',
    conversionRate: 1,
    minQuantity: 40
  },
  { 
    id: 16, 
    name: 'Chicken Breast', 
    sku: 'CHK808', 
    category: 'Meat & Poultry', 
    quantity: 30, 
    unit: 'kg', 
    status: 'in-stock', 
    lastUpdated: '2024-02-28',
    supplier: 'CP Vietnam',
    conversionRate: 1 
  },
  { 
    id: 17, 
    name: 'Canned Tuna', 
    sku: 'TUN909', 
    category: 'Canned Goods', 
    quantity: 90, 
    unit: 'cans', 
    status: 'in-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'Thuan Phat',
    conversionRate: 1 
  },
  { 
    id: 18, 
    name: 'Orange Juice 1L', 
    sku: 'ORA010', 
    category: 'Beverages', 
    quantity: 8, 
    unit: 'bottles', 
    status: 'low-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Vinamilk',
    conversionRate: 1,
    minQuantity: 30
  },
  { 
    id: 19, 
    name: 'Fresh Onions', 
    sku: 'ONI111', 
    category: 'Fresh Produce', 
    quantity: 55, 
    unit: 'kg', 
    status: 'in-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'Fresh Farms Co.',
    conversionRate: 3 
  },
  { 
    id: 20, 
    name: 'Butter 200g', 
    sku: 'BUT212', 
    category: 'Dairy', 
    quantity: 25, 
    unit: 'packs', 
    status: 'in-stock', 
    lastUpdated: '2024-02-28',
    supplier: 'Anchor',
    conversionRate: 1 
  },
  { 
    id: 21, 
    name: 'Pasta 500g', 
    sku: 'PST313', 
    category: 'Dry Goods', 
    quantity: 42, 
    unit: 'packs', 
    status: 'in-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Barilla',
    conversionRate: 1 
  },
  { 
    id: 22, 
    name: 'Honey 250ml', 
    sku: 'HON414', 
    category: 'Cooking Essentials', 
    quantity: 0, 
    unit: 'bottles', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-24',
    supplier: 'Dalat Bee',
    conversionRate: 1 
  },
  { 
    id: 23, 
    name: 'Frozen Shrimp', 
    sku: 'SHR515', 
    category: 'Seafood', 
    quantity: 20, 
    unit: 'kg', 
    status: 'in-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'Minh Phu',
    conversionRate: 1 
  },
  { 
    id: 24, 
    name: 'Fresh Bananas', 
    sku: 'BAN616', 
    category: 'Fresh Produce', 
    quantity: 0, 
    unit: 'kg', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Fresh Farms Co.',
    conversionRate: 5 
  },
  { 
    id: 25, 
    name: 'Salt 1kg', 
    sku: 'SAL717', 
    category: 'Cooking Essentials', 
    quantity: 9, 
    unit: 'kg', 
    status: 'low-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Viet Salt',
    conversionRate: 1,
    minQuantity: 30
  },
  { 
    id: 26, 
    name: 'Ice Cream 500ml', 
    sku: 'ICE818', 
    category: 'Frozen Foods', 
    quantity: 0, 
    unit: 'tubs', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-24',
    supplier: 'Wall\'s',
    conversionRate: 1 
  },
  { 
    id: 27, 
    name: 'Mineral Water 1.5L', 
    sku: 'MIN919', 
    category: 'Beverages', 
    quantity: 7, 
    unit: 'bottles', 
    status: 'low-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'Aquafina',
    conversionRate: 1,
    minQuantity: 50
  },
  { 
    id: 28, 
    name: 'Fresh Lettuce', 
    sku: 'LET020', 
    category: 'Fresh Produce', 
    quantity: 0, 
    unit: 'heads', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Fresh Farms Co.',
    conversionRate: 1 
  },
  { 
    id: 29, 
    name: 'Ground Pepper 100g', 
    sku: 'PEP121', 
    category: 'Cooking Essentials', 
    quantity: 6, 
    unit: 'bottles', 
    status: 'low-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Phu Quoc Spices',
    conversionRate: 1,
    minQuantity: 25
  },
  { 
    id: 30, 
    name: 'Cheddar Cheese 200g', 
    sku: 'CHE222', 
    category: 'Dairy', 
    quantity: 0, 
    unit: 'packs', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-23',
    supplier: 'Anchor',
    conversionRate: 1 
  },
  { 
    id: 31, 
    name: 'Corn Flakes 500g', 
    sku: 'COR323', 
    category: 'Breakfast Foods', 
    quantity: 11, 
    unit: 'boxes', 
    status: 'low-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'Kellogg\'s',
    conversionRate: 1,
    minQuantity: 35
  },
  { 
    id: 32, 
    name: 'Tomato Sauce 340g', 
    sku: 'TOM424', 
    category: 'Canned Goods', 
    quantity: 0, 
    unit: 'bottles', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-24',
    supplier: 'Chin-su',
    conversionRate: 1 
  },
  { 
    id: 33, 
    name: 'Fresh Cucumber', 
    sku: 'CUC525', 
    category: 'Fresh Produce', 
    quantity: 10, 
    unit: 'kg', 
    status: 'low-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Fresh Farms Co.',
    conversionRate: 2,
    minQuantity: 30
  },
  { 
    id: 34, 
    name: 'Pork Ribs', 
    sku: 'PRK626', 
    category: 'Meat & Poultry', 
    quantity: 0, 
    unit: 'kg', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Vissan',
    conversionRate: 1 
  },
  { 
    id: 35, 
    name: 'Fish Sauce 500ml', 
    sku: 'FSH727', 
    category: 'Cooking Essentials', 
    quantity: 14, 
    unit: 'bottles', 
    status: 'low-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'Nam Ngu',
    conversionRate: 1,
    minQuantity: 40
  },
  { 
    id: 36, 
    name: 'Fresh Potatoes', 
    sku: 'POT828', 
    category: 'Fresh Produce', 
    quantity: 0, 
    unit: 'kg', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Dalat Fresh',
    conversionRate: 3 
  },
  { 
    id: 37, 
    name: 'Biscuits 200g', 
    sku: 'BIS929', 
    category: 'Snacks', 
    quantity: 9, 
    unit: 'packs', 
    status: 'low-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Oreo',
    conversionRate: 1,
    minQuantity: 35
  },
  { 
    id: 38, 
    name: 'Coconut Milk 400ml', 
    sku: 'COC030', 
    category: 'Canned Goods', 
    quantity: 0, 
    unit: 'cans', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-24',
    supplier: 'Kara',
    conversionRate: 1 
  },
  { 
    id: 39, 
    name: 'Fresh Cabbage', 
    sku: 'CAB131', 
    category: 'Fresh Produce', 
    quantity: 8, 
    unit: 'heads', 
    status: 'low-stock', 
    lastUpdated: '2024-02-27',
    supplier: 'Fresh Farms Co.',
    conversionRate: 1,
    minQuantity: 25
  },
  { 
    id: 40, 
    name: 'Condensed Milk 380g', 
    sku: 'CON232', 
    category: 'Dairy', 
    quantity: 0, 
    unit: 'cans', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-23',
    supplier: 'Ong Tho',
    conversionRate: 1 
  },
  { 
    id: 41, 
    name: 'Garlic Fresh', 
    sku: 'GAR333', 
    category: 'Fresh Produce', 
    quantity: 13, 
    unit: 'kg', 
    status: 'low-stock', 
    lastUpdated: '2024-02-26',
    supplier: 'Fresh Farms Co.',
    conversionRate: 1,
    minQuantity: 35
  },
  { 
    id: 42, 
    name: 'Tofu 500g', 
    sku: 'TOF434', 
    category: 'Protein', 
    quantity: 0, 
    unit: 'blocks', 
    status: 'out-of-stock', 
    lastUpdated: '2024-02-25',
    supplier: 'Vinasoy',
    conversionRate: 1 
  }
]

// Helper function to get out of stock items
export const getOutOfStockItems = () => {
  return inventoryData.filter(item => item.status === 'out-of-stock' || item.quantity === 0)
}

// Helper function to get low stock items
export const getLowStockItems = () => {
  return inventoryData.filter(item => item.status === 'low-stock')
}

// Helper function to get in stock items
export const getInStockItems = () => {
  return inventoryData.filter(item => item.status === 'in-stock' && item.quantity > 0)
}
