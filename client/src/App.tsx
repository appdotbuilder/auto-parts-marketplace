
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';

// Import components
import { AutoPartSearch } from '@/components/AutoPartSearch';
import { UserRegistration } from '@/components/UserRegistration';
import { PartListing } from '@/components/PartListing';
import { InquiryManagement } from '@/components/InquiryManagement';
import { FinancingOptions } from '@/components/FinancingOptions';
import { FinancingApplications } from '@/components/FinancingApplications';

// Type imports from server
import type { User, UserType } from '../../server/src/schema';

function App() {
  // Current user simulation (in real app, this would come from auth)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load users for demo purposes
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await trpc.getUsers.query();
      setUsers(result);
      
      // Auto-select first user for demo if none selected
      if (!currentUser && result.length > 0) {
        setCurrentUser(result[0]);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Currently using demo mode. Backend connection unavailable.');
      
      // Demo users for development
      const demoUsers: User[] = [
        {
          id: 1,
          email: 'buyer@demo.com',
          password_hash: 'demo',
          first_name: 'John',
          last_name: 'Buyer',
          user_type: 'buyer',
          phone: '555-0123',
          address: '123 Main St',
          city: 'Denver',
          state: 'CO',
          zip_code: '80202',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 2,
          email: 'seller@demo.com',
          password_hash: 'demo',
          first_name: 'Jane',
          last_name: 'Seller',
          user_type: 'seller',
          phone: '555-0124',
          address: '456 Oak Ave',
          city: 'Denver',
          state: 'CO',
          zip_code: '80203',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 3,
          email: 'finance@demo.com',
          password_hash: 'demo',
          first_name: 'Bob',
          last_name: 'Finance',
          user_type: 'financing_provider',
          phone: '555-0125',
          address: '789 Pine St',
          city: 'Denver',
          state: 'CO',
          zip_code: '80204',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      setUsers(demoUsers);
      setCurrentUser(demoUsers[0]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUserCreated = (user: User) => {
    setUsers((prev: User[]) => [...prev, user]);
    setCurrentUser(user);
  };

  const getUserTypeColor = (userType: UserType) => {
    switch (userType) {
      case 'buyer': return 'bg-blue-100 text-blue-800';
      case 'seller': return 'bg-green-100 text-green-800';
      case 'financing_provider': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeLabel = (userType: UserType) => {
    switch (userType) {
      case 'buyer': return '🛒 Buyer';
      case 'seller': return '🏪 Seller';
      case 'financing_provider': return '💰 Finance Provider';
      default: return userType;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading marketplace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🚗 AutoParts Marketplace
        </h1>
        <p className="text-gray-600 text-lg">
          Connect buyers, sellers, and financing providers in one platform
        </p>
        
        {error && (
          <Alert className="mt-4 border-amber-200 bg-amber-50">
            <AlertDescription className="text-amber-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* User Selection / Demo Mode */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            👤 Current User
            {currentUser && (
              <Badge className={getUserTypeColor(currentUser.user_type)}>
                {getUserTypeLabel(currentUser.user_type)}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {users.length > 0 ? 'Switch between demo users or create new account' : 'Create your first account to get started'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {users.map((user: User) => (
                <Button
                  key={user.id}
                  variant={currentUser?.id === user.id ? 'default' : 'outline'}
                  onClick={() => setCurrentUser(user)}
                  className="h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">
                      {user.first_name} {user.last_name}
                    </div>
                    <div className="text-xs opacity-75">
                      {getUserTypeLabel(user.user_type)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
          
          <UserRegistration onUserCreated={handleUserCreated} />
        </CardContent>
      </Card>

      {/* Main Application Tabs */}
      {currentUser ? (
        <Tabs defaultValue="browse" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
            <TabsTrigger value="browse">🔍 Browse Parts</TabsTrigger>
            {(currentUser.user_type === 'seller' || currentUser.user_type === 'buyer') && (
              <TabsTrigger value="listings">
                {currentUser.user_type === 'seller' ? '📦 My Listings' : '🛒 My Inquiries'}
              </TabsTrigger>
            )}
            {currentUser.user_type === 'seller' && (
              <TabsTrigger value="inquiries">💬 Inquiries</TabsTrigger>
            )}
            {currentUser.user_type === 'financing_provider' && (
              <TabsTrigger value="financing">💰 Financing Options</TabsTrigger>
            )}
            {(currentUser.user_type === 'buyer' || currentUser.user_type === 'financing_provider') && (
              <TabsTrigger value="applications">
                {currentUser.user_type === 'buyer' ? '📋 My Applications' : '🏦 Applications'}
              </TabsTrigger>
            )}
            <TabsTrigger value="profile">👤 Profile</TabsTrigger>
          </TabsList>

          {/* Browse Parts - Available to all users */}
          <TabsContent value="browse">
            <AutoPartSearch currentUser={currentUser} />
          </TabsContent>

          {/* Listings - Different for sellers vs buyers */}
          {(currentUser.user_type === 'seller' || currentUser.user_type === 'buyer') && (
            <TabsContent value="listings">
              {currentUser.user_type === 'seller' ? (
                <PartListing sellerId={currentUser.id} />
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Your Inquiries</h3>
                  <p className="text-gray-600">View and manage your part inquiries here.</p>
                  {/* This would show buyer's inquiries */}
                </div>
              )}
            </TabsContent>
          )}

          {/* Seller Inquiries Management */}
          {currentUser.user_type === 'seller' && (
            <TabsContent value="inquiries">
              <InquiryManagement sellerId={currentUser.id} />
            </TabsContent>
          )}

          {/* Financing Options - For financing providers */}
          {currentUser.user_type === 'financing_provider' && (
            <TabsContent value="financing">
              <FinancingOptions providerId={currentUser.id} />
            </TabsContent>
          )}

          {/* Applications - Different for buyers vs financing providers */}
          {(currentUser.user_type === 'buyer' || currentUser.user_type === 'financing_provider') && (
            <TabsContent value="applications">
              <FinancingApplications 
                userId={currentUser.id} 
                userType={currentUser.user_type as 'buyer' | 'financing_provider'} 
              />
            </TabsContent>
          )}

          {/* Profile */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>👤 Profile Information</CardTitle>
                <CardDescription>Your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Name</label>
                    <p className="text-gray-900">{currentUser.first_name} {currentUser.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{currentUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">User Type</label>
                    <div>
                      <Badge className={getUserTypeColor(currentUser.user_type)}>
                        {getUserTypeLabel(currentUser.user_type)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-900">{currentUser.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                {currentUser.address && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">
                      {currentUser.address}<br />
                      {currentUser.city}, {currentUser.state} {currentUser.zip_code}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Member Since</label>
                  <p className="text-gray-900">{currentUser.created_at.toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-900 mb-2">Welcome to AutoParts Marketplace</h3>
            <p className="text-gray-600">Create an account or select a demo user to get started</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default App;
