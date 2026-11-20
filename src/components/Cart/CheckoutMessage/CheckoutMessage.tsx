import { Ref } from 'react';

import * as S from './style';

interface IProps {
  heading: string;
  body?: string;
  linkText: string;
  headingRef?: Ref<HTMLHeadingElement>;
}

// A message that ends checkout (thank-you or empty cart), with a link back to
// the store's main page. The link reloads the page on purpose.
const CheckoutMessage = ({ heading, body, linkText, headingRef }: IProps) => (
  <S.Container aria-labelledby="checkout-message-heading">
    <S.Heading id="checkout-message-heading" ref={headingRef} tabIndex={-1}>
      {heading}
    </S.Heading>
    {body && <S.Body>{body}</S.Body>}
    <S.Link href="/">{linkText}</S.Link>
  </S.Container>
);

export default CheckoutMessage;
