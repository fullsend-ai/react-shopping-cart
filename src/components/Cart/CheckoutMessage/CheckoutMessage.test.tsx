import { screen } from '@testing-library/react';

import { renderWithThemeProvider } from 'utils/test/test-utils';

import CheckoutMessage from '.';

describe('[components] - CheckoutMessage', () => {
  test('should render the heading, the body and a link to the main page', () => {
    renderWithThemeProvider(
      <CheckoutMessage
        heading="Order confirmed — great picks!"
        body="Thanks for shopping with us! We hope you love what you picked."
        linkText="Keep shopping"
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Order confirmed — great picks!' })
    ).toHaveAttribute('tabindex', '-1');
    expect(
      screen.getByText(
        'Thanks for shopping with us! We hope you love what you picked.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Keep shopping' })).toHaveAttribute(
      'href',
      '/'
    );
  });

  test('should render no body when none is given', () => {
    renderWithThemeProvider(
      <CheckoutMessage
        heading="Your cart is empty — let's find you something you'll love."
        linkText="Back to the store"
      />
    );

    expect(screen.queryByText(/./, { selector: 'p' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to the store' })
    ).toHaveAttribute('href', '/');
  });
});
