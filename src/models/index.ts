export interface IProduct {
  id: number;
  sku: number;
  title: string;
  description: string;
  availableSizes: string[];
  style: string;
  price: number;
  installments: number;
  currencyId: string;
  currencyFormat: string;
  isFreeShipping: boolean;
  availableColors?: string[];
  // Image number per color: `${sku}-N-product.webp` / `${sku}-N-cart.webp`.
  colorImages?: Record<string, number>;
}

export interface ICartProduct extends IProduct {
  quantity: number;
  color?: string;
}

export interface ICartTotal {
  productQuantity: number;
  installments: number;
  totalPrice: number;
  currencyId: string;
  currencyFormat: string;
}

export interface IGetProductsResponse {
  data: {
    products: IProduct[];
  };
}
