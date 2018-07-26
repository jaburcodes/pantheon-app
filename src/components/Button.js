//@flow
import React from 'react';
import styled from 'styled-components/native';

const Wrapper = styled.TouchableOpacity`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 60;
  border-radius: 50;  
  background-color: ${props => (props.fill ? props.theme.colors.secondaryColor : 'transparent')};
  margin-left: auto;
  margin-right: auto;
  border: 2px solid ${props => props.theme.colors.secondaryColor};
`;

type Props = {
  onPress?: any,
  children?: any,
  fill?: boolean,
};

const Button = (props: Props) => (
  <Wrapper onPress={props.onPress} {...props}>
    {props.children}
  </Wrapper>
);

export default Button;
