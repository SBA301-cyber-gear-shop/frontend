import { ProductDetails } from "@/features/products";
import { useCart } from "@/features/cart";
export default function ProductPage() {
  const { addToCart } = useCart();
  return <ProductDetails addCart={addToCart} />;
}
