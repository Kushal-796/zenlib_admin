import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import { setLoading, setUser, setError } from './store/slices/authSlice';
import { AuthService } from './services/authService';

// Components
import Login from './components/auth/Login';
import Layout from './components/layout/Layout';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/pages/Dashboard';
import PendingBorrowRequests from './components/pages/PendingBorrowRequests';
import PendingReturnRequests from './components/pages/PendingReturnRequests';
import ProcessedHistory from './components/pages/ProcessedHistory';

// Placeholder components for now
const PenaltyManagement = () => <div>Penalty Management - Coming Soon</div>;
const UsersList = () => <div>Users List - Coming Soon</div>;
const ManageBooks = () => <div>Manage Books - Coming Soon</div>;

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user, loading } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(setLoading(true));
    
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      if (user) {
        dispatch(setUser(user));
      } else {
        dispatch(setUser(null));
      }
      dispatch(setLoading(false));
    });

    return () => unsubscribe();
  }, [dispatch]);

  const handleLogout = async () => {
    try {
      await AuthService.logout();
    } catch (error: any) {
      dispatch(setError(error.message));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Router>
      <Layout
        sidebar={<Sidebar onLogout={handleLogout} />}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pending-borrows" element={<PendingBorrowRequests />} />
          <Route path="/pending-returns" element={<PendingReturnRequests />} />
          <Route path="/processed-history" element={<ProcessedHistory />} />
          <Route path="/penalties" element={<PenaltyManagement />} />
          <Route path="/users" element={<UsersList />} />
          <Route path="/manage-books" element={<ManageBooks />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
