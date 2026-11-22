import { useCallback } from 'react';

import { useProductsContext } from './ProductsContextProvider';
import { IProduct } from 'models';
import { getProducts } from 'services/products';
import matchesBrand from 'utils/matchesBrand';

// A product with no sizes (availableSizes: []) is listed under any size
// selection (decision 0004).
const matchesSizes = (product: IProduct, sizes: string[]) =>
  !sizes ||
  sizes.length === 0 ||
  product.availableSizes.length === 0 ||
  sizes.some((filter: string) =>
    product.availableSizes.some((size: string) => size === filter)
  );

const matchesBrands = (product: IProduct, brands: string[]) =>
  !brands ||
  brands.length === 0 ||
  brands.some((brand: string) => matchesBrand(product, brand));

const useProducts = () => {
  const {
    isFetching,
    setIsFetching,
    products,
    setProducts,
    filters,
    setFilters,
    brandFilters,
    setBrandFilters,
  } = useProductsContext();

  const fetchProducts = useCallback(() => {
    setIsFetching(true);
    getProducts().then((products: IProduct[]) => {
      setIsFetching(false);
      setProducts(products);
    });
  }, [setIsFetching, setProducts]);

  const applyFilters = (sizes: string[], brands: string[]) => {
    setIsFetching(true);

    getProducts().then((products: IProduct[]) => {
      setIsFetching(false);

      const filteredProducts = products.filter(
        (p: IProduct) => matchesSizes(p, sizes) && matchesBrands(p, brands)
      );

      setFilters(sizes);
      setBrandFilters(brands);
      setProducts(filteredProducts);
    });
  };

  const filterProducts = (filters: string[]) =>
    applyFilters(filters, brandFilters);

  const filterProductsByBrand = (brands: string[]) =>
    applyFilters(filters, brands);

  return {
    isFetching,
    fetchProducts,
    products,
    filterProducts,
    filters,
    filterProductsByBrand,
    brandFilters,
  };
};

export default useProducts;
