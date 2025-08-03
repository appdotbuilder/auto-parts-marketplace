
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { 
  FinancingOption, 
  CreateFinancingOptionInput 
} from '../../../server/src/schema';

interface FinancingOptionsProps {
  providerId: number;
}

export function FinancingOptions({ providerId }: FinancingOptionsProps) {
  const [options, setOptions] = useState<FinancingOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateFinancingOptionInput>({
    provider_id: providerId,
    name: '',
    description: '',
    min_amount: 0,
    max_amount: 0,
    interest_rate: 0,
    term_months: 12
  });

  const loadOptions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getFinancingOptions.query();
      // Filter for this provider (in real implementation, API would handle this)
      const providerOptions = result.filter((option: FinancingOption) => option.provider_id === providerId);
      setOptions(providerOptions);
    } catch (error) {
      console.error('Failed to load financing options:', error);
      
      // Demo data for development
      const demoOptions: FinancingOption[] = [
        {
          id: 1,
          provider_id: providerId,
          name: 'Standard Auto Parts Financing',
          description: 'Competitive rates for auto parts purchases over $500. Quick approval process with flexible terms.',
          min_amount: 500,
          max_amount: 10000,
          interest_rate: 7.99,
          term_months: 24,
          is_active: true,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01')
        },
        {
          id: 2,
          provider_id: providerId,
          name: 'Premium Engine Financing',
          description: 'Special financing for high-value engine and transmission purchases. Extended terms available for qualified buyers.',
          min_amount: 2000,
          max_amount: 25000,
          interest_rate: 6.49,
          term_months: 36,
          is_active: true,
          created_at: new Date('2024-01-05'),
          updated_at: new Date('2024-01-05')
        }
      ];
      setOptions(demoOptions);
    } finally {
      setIsLoading(false);
    }
  }, [providerId]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await trpc.createFinancingOption.mutate(formData);
      setOptions((prev: FinancingOption[]) => [...prev, response]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create financing option:', error);
      alert('Failed to create financing option. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      provider_id: providerId,
      name: '',
      description: '',
      min_amount: 0,
      max_amount: 0,
      interest_rate: 0,
      term_months: 12
    });
  };

  const calculateMonthlyPayment = (amount: number, interestRate: number, termMonths: number) => {
    const monthlyRate = interestRate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                   (Math.pow(1 + monthlyRate, termMonths) - 1);
    return payment;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>💰 Financing Options</CardTitle>
              <CardDescription>
                Manage your financing products and terms for auto parts buyers
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              ➕ Add New Option
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create Option Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Financing Option</CardTitle>
            <CardDescription>Add a new financing product for buyers</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateOption} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateFinancingOptionInput) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Standard Auto Parts Financing"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateFinancingOptionInput) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="Describe the financing option, eligibility requirements, and benefits..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_amount">Minimum Amount ($) *</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    value={formData.min_amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateFinancingOptionInput) => ({ ...prev, min_amount: parseFloat(e.target.value) || 0 }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="max_amount">Maximum Amount ($) *</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    value={formData.max_amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateFinancingOptionInput) => ({ ...prev, max_amount: parseFloat(e.target.value) || 0 }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="interest_rate">Interest Rate (%) *</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    value={formData.interest_rate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateFinancingOptionInput) => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))
                    }
                    step="0.01"
                    min="0"
                    max="100"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="term_months">Term (Months) *</Label>
                  <Input
                    id="term_months"
                    type="number"
                    value={formData.term_months}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateFinancingOptionInput) => ({ ...prev, term_months: parseInt(e.target.value) || 12 }))
                    }
                    min="1"
                    max="120"
                    required
                  />
                </div>
              </div>

              {/* Preview calculation */}
              {formData.min_amount > 0 && formData.max_amount > 0 && formData.interest_rate > 0 && formData.term_months > 0 && (
                <Alert>
                  <AlertDescription>
                    <strong>Preview:</strong> For a ${formData.min_amount.toFixed(2)} loan, monthly payment would be ${calculateMonthlyPayment(formData.min_amount, formData.interest_rate, formData.term_months).toFixed(2)}
                    {formData.max_amount !== formData.min_amount && (
                      <> • For a ${formData.max_amount.toFixed(2)} loan, monthly payment would be ${calculateMonthlyPayment(formData.max_amount, formData.interest_rate, formData.term_months).toFixed(2)}</>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Option'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Options List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Your Financing Options ({options.length} active)
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading financing options...</p>
          </div>
        ) : options.length === 0 ? (
          <Alert>
            <AlertDescription>
              You haven't created any financing options yet. Click "Add New Option" to create your first financing product.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {options.map((option: FinancingOption) => (
              <Card key={option.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        💰 {option.name}
                        {option.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {option.interest_rate}% APR • {option.term_months} months
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    {option.description}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Amount Range</Label>
                      <div className="font-medium">
                        ${option.min_amount.toLocaleString()} - ${option.max_amount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Interest Rate</Label>
                      <div className="font-medium text-blue-600">
                        {option.interest_rate}% APR
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Term</Label>
                      <div className="font-medium">
                        {option.term_months} months
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Min. Monthly Payment</Label>
                      <div className="font-medium text-green-600">
                        ${calculateMonthlyPayment(option.min_amount, option.interest_rate, option.term_months).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 border-t pt-2">
                    Created: {option.created_at.toLocaleDateString()}
                    {option.updated_at > option.created_at && (
                      <span> • Updated: {option.updated_at.toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      ✏️ Edit
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      {option.is_active ? '📴 Deactivate' : '✅ Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Summary Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {options.filter((o: FinancingOption) => o.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active Options</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {options.length > 0 ? Math.min(...options.map((o: FinancingOption) => o.interest_rate)).toFixed(2) : 0}%
              </div>
              <div className="text-sm text-gray-600">Lowest Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${options.length > 0 ? Math.max(...options.map((o: FinancingOption) => o.max_amount)).toLocaleString() : 0}
              </div>
              <div className="text-sm text-gray-600">Max Loan Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {options.length > 0 ? Math.max(...options.map((o: FinancingOption) => o.term_months)) : 0}
              </div>
              <div className="text-sm text-gray-600">Max Term (months)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
