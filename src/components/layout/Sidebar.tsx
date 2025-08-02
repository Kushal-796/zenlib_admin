import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { colors } from '../styles/GlobalStyles';

const SidebarContainer = styled.nav`
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  height: 100vh;
  background-color: ${colors.cardBackground};
  box-shadow: 2px 0 8px ${colors.shadow};
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  z-index: 100;
  
  @media (max-width: 768px) {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    
    &.open {
      transform: translateX(0);
    }
  }
`;

const Logo = styled.div`
  padding: 0 24px 32px 24px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 24px;
`;

const LogoText = styled.h1`
  color: ${colors.primaryText};
  font-size: 24px;
  font-weight: 700;
  margin: 0;
`;

const LogoSubtext = styled.p`
  color: #666;
  font-size: 14px;
  margin: 4px 0 0 0;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
`;

const NavItem = styled.li<{ isActive: boolean }>`
  margin-bottom: 4px;
`;

const NavLink = styled(Link)<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: ${props => props.isActive ? colors.info : colors.primaryText};
  text-decoration: none;
  font-weight: ${props => props.isActive ? '600' : '400'};
  background-color: ${props => props.isActive ? 'rgba(25, 118, 210, 0.1)' : 'transparent'};
  border-right: ${props => props.isActive ? `3px solid ${colors.info}` : 'none'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(25, 118, 210, 0.05);
    color: ${colors.info};
  }
`;

const NavIcon = styled.span`
  margin-right: 12px;
  font-size: 20px;
`;

const LogoutButton = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 24px;
  border: none;
  background: none;
  color: ${colors.danger};
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(229, 57, 53, 0.05);
  }
`;

interface SidebarProps {
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: '🏠', label: 'Dashboard' },
    { path: '/pending-borrows', icon: '⏰', label: 'Pending Borrows' },
    { path: '/pending-returns', icon: '🔄', label: 'Pending Returns' },
    { path: '/processed-history', icon: '✅', label: 'Processed History' },
    { path: '/penalties', icon: '💰', label: 'Penalty Management' },
    { path: '/users', icon: '👥', label: 'Users List' },
    { path: '/manage-books', icon: '📖', label: 'Manage Books' },
  ];

  return (
    <SidebarContainer>
      <Logo>
        <LogoText>LibraryQR</LogoText>
        <LogoSubtext>Admin Panel</LogoSubtext>
      </Logo>
      
      <NavList>
        {navItems.map((item) => (
          <NavItem key={item.path} isActive={location.pathname === item.path}>
            <NavLink to={item.path} isActive={location.pathname === item.path}>
              <NavIcon>
                {item.icon}
              </NavIcon>
              {item.label}
            </NavLink>
          </NavItem>
        ))}
      </NavList>
      
      <LogoutButton onClick={onLogout}>
        <NavIcon>
          🚪
        </NavIcon>
        Logout
      </LogoutButton>
    </SidebarContainer>
  );
};

export default Sidebar;
