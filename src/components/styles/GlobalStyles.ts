import styled from 'styled-components';

// Color palette from README
export const colors = {
  primaryBackground: '#F3FAF8',
  primaryText: '#00253A',
  secondaryText: '#666666',
  cardBackground: '#FFFFFF',
  success: '#2E7D32',
  danger: '#E53935',
  info: '#1976D2',
  warning: '#FFA000',
  shadow: 'rgba(0,0,0,0.08)'
};

// Common styled components
export const Container = styled.div`
  min-height: 100vh;
  background-color: ${colors.primaryBackground};
  display: flex;
`;

export const MainContent = styled.main`
  flex: 1;
  padding: 24px;
  margin-left: 280px;
  
  @media (max-width: 768px) {
    margin-left: 0;
    padding: 16px;
  }
`;

export const Card = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 16px;
  box-shadow: 0 2px 4px ${colors.shadow};
  padding: 24px;
  margin-bottom: 24px;
`;

export const PageTitle = styled.h1`
  color: ${colors.primaryText};
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 24px;
`;

export const SubTitle = styled.h2`
  color: ${colors.primaryText};
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 16px;
`;

export const Button = styled.button<{
  variant?: 'primary' | 'success' | 'danger' | 'info' | 'warning';
  size?: 'small' | 'medium' | 'large';
}>`
  padding: ${props => {
    switch (props.size) {
      case 'small': return '8px 16px';
      case 'large': return '16px 32px';
      default: return '12px 24px';
    }
  }};
  border-radius: 8px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: ${props => props.size === 'small' ? '14px' : '16px'};
  
  background-color: ${props => {
    switch (props.variant) {
      case 'primary': return colors.info;
      case 'success': return colors.success;
      case 'danger': return colors.danger;
      case 'info': return colors.info;
      case 'warning': return colors.warning;
      default: return colors.primaryText;
    }
  }};
  
  color: white;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: ${colors.info};
  }
`;

export const SearchBox = styled.div`
  position: relative;
  margin-bottom: 24px;
  max-width: 400px;
`;

export const Grid = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns || 'auto-fit'}, minmax(300px, 1fr));
  gap: 24px;
  margin-top: 24px;
`;

export const FlexContainer = styled.div<{
  direction?: 'row' | 'column';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  align?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: string;
}>`
  display: flex;
  flex-direction: ${props => props.direction || 'row'};
  justify-content: ${props => props.justify || 'flex-start'};
  align-items: ${props => props.align || 'stretch'};
  gap: ${props => props.gap || '0'};
`;

export const Badge = styled.span<{
  variant?: 'success' | 'danger' | 'info' | 'warning' | 'default';
}>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  
  background-color: ${props => {
    switch (props.variant) {
      case 'success': return colors.success;
      case 'danger': return colors.danger;
      case 'info': return colors.info;
      case 'warning': return colors.warning;
      default: return '#6c757d';
    }
  }};
  
  color: white;
`;

export const LoadingSpinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid ${colors.info};
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const ErrorMessage = styled.div`
  background-color: #ffebee;
  color: ${colors.danger};
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid ${colors.danger};
  margin-bottom: 16px;
`;

export const SuccessMessage = styled.div`
  background-color: #e8f5e8;
  color: ${colors.success};
  padding: 16px;
  border-radius: 8px;
  border-left: 4px solid ${colors.success};
  margin-bottom: 16px;
`;

export const Modal = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ModalContent = styled.div`
  background-color: ${colors.cardBackground};
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
`;

export const TableHeader = styled.th`
  text-align: left;
  padding: 12px;
  border-bottom: 2px solid #e0e0e0;
  color: ${colors.primaryText};
  font-weight: 600;
  background-color: #f8f9fa;
`;

export const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid #e0e0e0;
  color: ${colors.primaryText};
`;

export const TableRow = styled.tr`
  &:hover {
    background-color: #f8f9fa;
  }
`;
