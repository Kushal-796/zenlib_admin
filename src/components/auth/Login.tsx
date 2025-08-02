import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setLoading, setUser, setError } from '../../store/slices/authSlice';
import { AuthService } from '../../services/authService';
import { Button, Input, Card, ErrorMessage, LoadingSpinner, colors } from '../styles/GlobalStyles';

const LoginContainer = styled.div`
  min-height: 100vh;
  background-color: ${colors.primaryBackground};
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
`;

const LoginCard = styled(Card)`
  max-width: 400px;
  width: 100%;
  text-align: center;
`;

const LoginTitle = styled.h1`
  color: ${colors.primaryText};
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const LoginSubtitle = styled.p`
  color: #666;
  font-size: 16px;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  text-align: left;
`;

const Label = styled.label`
  display: block;
  color: ${colors.primaryText};
  font-weight: 500;
  margin-bottom: 8px;
`;

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      dispatch(setError('Please fill in all fields'));
      return;
    }

    dispatch(setLoading(true));
    
    try {
      const user = await AuthService.login(email, password);
      dispatch(setUser(user));
    } catch (error: any) {
      dispatch(setError(error.message));
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <LoginTitle>LibraryQR</LoginTitle>
        <LoginSubtitle>Admin Panel</LoginSubtitle>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
            />
          </InputGroup>
          
          <InputGroup>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
            />
          </InputGroup>
          
          <Button type="submit" disabled={loading} size="large">
            {loading ? <LoadingSpinner /> : 'Sign In'}
          </Button>
        </Form>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;
