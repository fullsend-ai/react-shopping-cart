import redHatLogo from 'static/red-hat-logo.svg';

import * as S from './style';

const Header = () => (
  <S.Container>
    <S.Logo src={redHatLogo} alt="Red Hat" />
  </S.Container>
);

export default Header;
