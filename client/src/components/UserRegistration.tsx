
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { CreateUserInput, User, UserType } from '../../../server/src/schema';

interface UserRegistrationProps {
  onUserCreated: (user: User) => void;
}

export function UserRegistration({ onUserCreated }: UserRegistrationProps) {
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    user_type: 'buyer',
    phone: null,
    address: null,
    city: null,
    state: null,
    zip_code: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await trpc.createUser.mutate(formData);
      onUserCreated(response);
      setShowForm(false);
      setFormData({
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        user_type: 'buyer',
        phone: null,
        address: null,
        city: null,
        state: null,
        zip_code: null
      });
    } catch (err) {
      console.error('Failed to create user:', err);
      setError('Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Button 
        onClick={() => setShowForm(true)}
        variant="outline"
        className="w-full sm:w-auto"
      >
        ➕ Create New Account
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Account</CardTitle>
        <CardDescription>Join the AutoParts marketplace</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserInput) => ({ ...prev, first_name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserInput) => ({ ...prev, last_name: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Password *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
              }
              required
              minLength={8}
            />
          </div>

          <div>
            <Label htmlFor="user_type">Account Type *</Label>
            <Select 
              value={formData.user_type || 'buyer'} 
              onValueChange={(value: UserType) =>
                setFormData((prev: CreateUserInput) => ({ ...prev, user_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="buyer">🛒 Buyer - Looking for auto parts</SelectItem>
                <SelectItem value="seller">🏪 Seller - Selling auto parts</SelectItem>
                <SelectItem value="financing_provider">💰 Finance Provider - Offering financing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUserInput) => ({ 
                  ...prev, 
                  phone: e.target.value || null 
                }))
              }
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev: CreateUserInput) => ({ 
                  ...prev, 
                  address: e.target.value || null 
                }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserInput) => ({ 
                    ...prev, 
                    city: e.target.value || null 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={formData.state || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserInput) => ({ 
                    ...prev, 
                    state: e.target.value || null 
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                value={formData.zip_code || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserInput) => ({ 
                    ...prev, 
                    zip_code: e.target.value || null 
                  }))
                }
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Account'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
