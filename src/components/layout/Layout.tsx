import React from 'react';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';

const LayoutContainer = styled.div`
  min-height: 100vh;
  background-color: ${colors.primaryBackground};
  display: flex;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 280px;
  padding: 24px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 16px;
  }
`;

interface LayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, sidebar }) => {
  return (
    <LayoutContainer>
      {sidebar}
      <MainContent>
        {children}
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;
