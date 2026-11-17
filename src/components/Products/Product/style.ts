import styled from 'styled-components';

export const BuyButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  color: #fff;
  padding: 15px 0;
  margin-top: 10px;
  cursor: pointer;
  width: 100%;
  border: 0;

  transition: background-color 0.2s;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.secondary};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

export const ColorPicker = styled.fieldset`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 10px 0 0;
  padding: 0;
  border: 0;

  legend {
    padding: 0;
    margin-bottom: 5px;
    width: 100%;
  }
`;

export const ColorOption = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;

  input {
    margin: 0;
    accent-color: ${({ theme }) => theme.colors.primary};
    cursor: pointer;
  }

  input:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.secondary};
  }
`;

export const ColorStatus = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const ColorHint = styled.p`
  margin: 5px 0 0;
  color: #9c9b9b;
`;

interface IImage {
  alt: string;
}
export const Image = styled.div<IImage>``;

interface IContainer {
  $sku: number | string;
}
export const Container = styled.div<IContainer>`
  position: relative;
  text-align: center;
  box-sizing: border-box;
  padding: 10px;
  margin-bottom: 30px;
  cursor: default;
  outline: none;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.secondary};
  }

  ${Image} {
    width: 100%;
    height: 270px;
    position: relative;
    background-image: ${({ $sku }) =>
      `url(${require(`static/products/${$sku}-1-product.webp`)})`};
    background-repeat: no-repeat;
    background-size: cover;
    background-position: center;

    ::before {
      content: '';
      display: block;
      position: absolute;
      background: #eee;
      width: 100%;
      height: 100%;
      z-index: -1;
    }

    @media only screen and (min-width: ${({ theme: { breakpoints } }) =>
        breakpoints.tablet}) {
      height: 320px;
    }
  }

  &:hover {
    ${Image} {
      background-image: ${({ $sku }) =>
        `url(${require(`static/products/${$sku}-2-product.webp`)})`};
    }

    ${BuyButton}:not(:disabled) {
      background-color: ${({ theme }) => theme.colors.secondary};
    }
  }
`;

export const Stopper = styled.div`
  position: absolute;
  color: #ececec;
  top: 10px;
  right: 10px;
  padding: 5px;
  font-size: 0.6em;
  background-color: ${({ theme }) => theme.colors.primary};
  cursor: default;
  z-index: 1;
`;

export const Title = styled.p`
  position: relative;
  padding: 0 20px;
  height: 45px;

  &::before {
    content: '';
    width: 20px;
    height: 2px;
    background-color: ${({ theme }) => theme.colors.secondary};
    position: absolute;
    bottom: 0;
    left: 50%;
    margin-left: -10px;
  }
`;

export const Price = styled.div`
  height: 60px;

  .val {
    b {
      font-size: 1.5em;
      margin-left: 5px;
    }
  }
`;

export const Val = styled.p`
  margin: 0;
  b {
    font-size: 1.5em;
    margin-left: 5px;
  }
`;

export const Installment = styled.p`
  margin: 0;
  color: #9c9b9b;
`;
