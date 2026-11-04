import { render, screen } from '@testing-library/react';

import Header from '.';

describe('[components] - Header', () => {
  const setup = () => {
    return render(<Header />);
  };

  test('should render correctly', () => {
    const view = setup();
    expect(view).toMatchSnapshot();
  });

  test('should render the Red Hat logo', () => {
    setup();
    expect(screen.getByRole('img', { name: /red hat/i })).toBeInTheDocument();
  });
});
