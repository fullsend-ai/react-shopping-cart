import 'styled-components';

import { StyleClosetTheme } from './theme';

declare module 'styled-components' {
  export interface DefaultTheme extends StyleClosetTheme {}
}
