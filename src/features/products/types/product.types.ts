// ==========================================
// 2. SẢN PHẨM & THÔNG SỐ KỸ THUẬT
// Map: Table Brands, Categories, Products,
//      Product_Variants, Specifications,
//      Category_Specifications, Specification_value
// ==========================================

/** Bảng Brands */
export interface Brand {
  id: number;
  name: string;
  logoUrl?: string;
  description?: string;
}

/**
 * Bảng Categories – hỗ trợ danh mục đa cấp (self-referencing).
 * parentId = null → danh mục gốc (vd: "Linh kiện PC", "Laptop").
 */
export interface Category {
  id: number;
  name: string;
  slug?: string;
  parentId: number | null;
  description?: string;
}

/** Trạng thái sản phẩm – map cột Products.status */
export type ProductStatus = "active" | "inactive";

/** Bảng Products – thông tin cấp sản phẩm (chưa phân biến thể) */
export interface Product {
  id: number;
  brandId: number;
  categoryId: number;
  warrantyPeriodMonths: number;
  name: string;
  description?: string;
  status: ProductStatus;
}

/**
 * Bảng Product_Variants – biến thể cụ thể bán ra.
 * Mỗi product có thể có nhiều variant (vd: RAM 16GB vs 32GB).
 */
export interface ProductVariant {
  id: number;
  productId: number;
  serialCode: string;
  variantName?: string; // VD: "Đen / 16GB / 5600 MT/s"
  slug?: string;
  price: number;
  originalPrice?: number;
  stockQuantity: number;
  imageUrl?: string;
}

/**
 * Bảng Specifications – định nghĩa thuộc tính kỹ thuật.
 * VD: "Socket", "Chuẩn RAM", "Dung lượng", "Tốc độ", "Công suất".
 */
export interface Specification {
  id: number;
  name: string;
}

/**
 * Bảng Category_Specifications – cấu hình spec nào thuộc danh mục nào,
 * có lọc được không, hiển thị ở menu/trang chính không.
 */
export interface CategorySpecification {
  id: number;
  categoryId: number;
  specificationId: number;
  isFilterable: boolean;
  isPrimary: boolean;
  showInMenu: boolean;
}

/**
 * Bảng Specification_value – giá trị thông số cụ thể của từng biến thể.
 * Đây là bảng EAV (Entity-Attribute-Value).
 * VD: product_variant "RAM 16GB" có specification "Chuẩn RAM" = "DDR5".
 */
export interface SpecificationValue {
  id: number;
  productVariantId: number;
  specificationId: number;
  value: string; // VD: "LGA1700", "DDR5", "3200MHz"
}

// -------------------------------------------------
// Các interface phụ trợ (dùng ở Frontend sau khi đã join/resolve)
// -------------------------------------------------

/**
 * Sản phẩm đã resolve đầy đủ để hiển thị trên giao diện cửa hàng.
 * Đây là shape mà API trả về sau khi JOIN Products + Variants + Brand + Specs.
 */
export interface ProductDisplay {
  averageRating?: number;
  reviewCount?: number;
  /** Số tài khoản khác nhau có đơn completed cho phiên bản này. */
  buyerCount?: number;
  id: number; // variant id
  productId: number;
  name: string; // từ Products.name
  category: string; // từ Categories.slug
  brand: string; // từ Brands.name
  price: number;
  originalPrice: number;
  variant: string; // Product_Variants.variant_name
  sku: string; // Product_Variants.serial_code
  stock: number; // Product_Variants.stock_quantity
  warranty: number; // Products.warranty_period_months
  status: ProductStatus;
  image: string; // Product_Variants.image_url
  specs: Record<string, string>; // Specification_value đã resolve (EAV → flat object)
}
