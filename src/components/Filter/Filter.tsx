import { useProducts } from 'contexts/products-context';

import * as S from './style';

export const availableSizes = ['XS', 'S', 'M', 'ML', 'L', 'XL', 'XXL'];

export const availableBrands = ['Red Hat'];

const toggle = (selected: string[] | undefined, label: string): string[] => {
  const selectedCheckboxes = new Set(selected);

  if (selectedCheckboxes.has(label)) {
    selectedCheckboxes.delete(label);
  } else {
    selectedCheckboxes.add(label);
  }

  return Array.from(selectedCheckboxes);
};

const Filter = () => {
  const { filters, filterProducts, brandFilters, filterProductsByBrand } =
    useProducts();

  const toggleCheckbox = (label: string) => {
    filterProducts(toggle(filters, label));
  };

  const toggleBrandCheckbox = (label: string) => {
    filterProductsByBrand(toggle(brandFilters, label));
  };

  const createCheckbox = (label: string) => (
    <S.Checkbox label={label} handleOnChange={toggleCheckbox} key={label} />
  );

  const createCheckboxes = () => availableSizes.map(createCheckbox);

  const createBrandCheckbox = (label: string) => (
    <S.BrandCheckbox
      label={label}
      handleOnChange={toggleBrandCheckbox}
      key={label}
    />
  );

  const createBrandCheckboxes = () => availableBrands.map(createBrandCheckbox);

  return (
    <S.Container>
      <S.Title>Sizes:</S.Title>
      {createCheckboxes()}
      <S.Title>Brand:</S.Title>
      {createBrandCheckboxes()}
    </S.Container>
  );
};

export default Filter;
