import matchesBrand from '../matchesBrand';

describe('[utils] - matchesBrand', () => {
  test('should match when the title contains the brand', () => {
    expect(
      matchesBrand(
        {
          title: 'Red Hat AI Black T-Shirt',
          description: '100% combed ring-spun cotton, 145gsm',
        },
        'Red Hat'
      )
    ).toBe(true);
  });

  test('should match when only the description contains the brand', () => {
    expect(
      matchesBrand(
        { title: 'Black T-shirt', description: 'Official red hat merch' },
        'Red Hat'
      )
    ).toBe(true);
  });

  test('should ignore case', () => {
    expect(
      matchesBrand({ title: 'RED HAT Cap', description: '' }, 'Red Hat')
    ).toBe(true);
  });

  test('should not match when neither title nor description contains the brand', () => {
    expect(
      matchesBrand(
        { title: 'Black Batman T-shirt', description: '4 MSL' },
        'Red Hat'
      )
    ).toBe(false);
  });

  test('should handle an empty or missing description', () => {
    expect(
      matchesBrand({ title: 'Blue T-Shirt', description: '' }, 'Red Hat')
    ).toBe(false);
    expect(
      matchesBrand(
        { title: 'Blue T-Shirt', description: undefined as unknown as string },
        'Red Hat'
      )
    ).toBe(false);
  });

  test('should not match across the title and description boundary', () => {
    expect(
      matchesBrand({ title: 'Wine Red', description: 'Hat' }, 'Red Hat')
    ).toBe(false);
  });
});
