import * as React from 'react';
import 'react-native';

declare module 'react-native' {
  export class StatusBar extends React.Component<any> {}
}
