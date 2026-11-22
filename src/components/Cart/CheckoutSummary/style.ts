import styled from 'styled-components';

export const Container = styled.section`
  box-sizing: border-box;
  padding: 0 5% 5%;
  color: #ececec;
`;

export const Heading = styled.h2`
  margin: 0 0 15px;
  font-size: 1.2em;
  text-align: center;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.secondary};
  }
`;

export const Lines = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const Line = styled.li`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 15px 0;
  border-top: 2px solid rgba(0, 0, 0, 0.2);
`;

export const Details = styled.div`
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const Title = styled.p`
  margin: 0;
`;

export const Desc = styled.p`
  color: #5b5a5e;
  margin: 0;
`;

export const LinePrice = styled.p`
  margin: 0;
  flex-shrink: 0;
  color: ${({ theme }) => theme.colors.secondary};
  text-align: right;
`;

export const Subtotal = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  padding-top: 15px;
  border-top: 2px solid rgba(0, 0, 0, 0.2);
  color: #5b5a5e;
`;

export const Sub = styled.p`
  margin: 0;
`;

export const SubPrice = styled.div`
  text-align: right;
`;

export const SubPriceValue = styled.p`
  color: ${({ theme }) => theme.colors.secondary};
  font-size: 22px;
  margin: 0;
`;

export const SubPriceInstallment = styled.p`
  margin: 0;
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 30px;
`;

export const Button = styled.button`
  width: 100%;
  border: 0;
  color: #ececec;
  text-transform: uppercase;
  background-color: #0c0b10;
  text-align: center;
  padding: 15px 0;
  cursor: pointer;

  transition: background-color 0.2s;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.secondary};
  }

  &:hover {
    background-color: #000;
  }
`;

export const SecondaryButton = styled(Button)`
  background-color: transparent;
  border: 1px solid #5b5a5e;

  &:hover {
    background-color: rgba(0, 0, 0, 0.2);
  }
`;
