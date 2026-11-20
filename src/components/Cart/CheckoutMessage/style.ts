import styled from 'styled-components';

export const Container = styled.section`
  box-sizing: border-box;
  padding: 0 5% 5%;
  color: #ececec;
  text-align: center;
  overflow-wrap: anywhere;
`;

export const Heading = styled.h2`
  margin: 0 0 15px;
  font-size: 1.2em;
  line-height: 1.5;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.secondary};
  }
`;

export const Body = styled.p`
  margin: 0 0 30px;
  color: #b7b7b7;
  line-height: 1.5;
`;

export const Link = styled.a`
  display: block;
  margin-top: 30px;
  padding: 15px 0;
  color: #ececec;
  background-color: #0c0b10;
  text-transform: uppercase;
  text-decoration: none;

  transition: background-color 0.2s;

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.secondary};
  }

  &:hover {
    background-color: #000;
  }
`;
