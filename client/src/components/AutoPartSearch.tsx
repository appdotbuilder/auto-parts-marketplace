
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import type { 
  AutoPart, 
  SearchPartsInput, 
  User, 
  PartCategory, 
  PartCondition,
  CreateBuyerInquiryInput,
  FinancingOption,
  CreateFinancingApplicationInput
} from '../../../server/src/schema';

interface AutoPartSearchProps {
  currentUser: User;
}

export function AutoPartSearch({ currentUser }: AutoPartSearchProps) {
  const [parts, setParts] = useState<AutoPart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Partial<SearchPartsInput>>({
    category: undefined,
    condition: undefined,
    make: '',
    model: '',
    year: undefined,
    min_price: undefined,
    max_price: undefined
  });

  // Inquiry state
  const [selectedPart, setSelectedPart] = useState<AutoPart | null>(null);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);

  // Financing state
  const [selectedPartForFinancing, setSelectedPartForFinancing] = useState<AutoPart | null>(null);
  const [financingOptions, setFinancingOptions] = useState<FinancingOption[]>([]);
  const [selectedFinancingOption, setSelectedFinancingOption] = useState<number | null>(null);
  const [requestedAmount, setRequestedAmount] = useState<string>('');
  const [applicationData, setApplicationData] = useState('');
  const [isLoadingFinancingOptions, setIsLoadingFinancingOptions] = useState(false);
  const [isSubmittingFinancingApplication, setIsSubmittingFinancingApplication] = useState(false);
  const [financingModalOpen, setFinancingModalOpen] = useState(false);

  const searchParts = useCallback(async () => {
    setIsLoading(true);
    try {
      const searchInput: SearchPartsInput = {
        query: searchQuery || undefined,
        ...filters,
        make: filters.make || undefined,
        model: filters.model || undefined,
        limit: 20,
        offset: 0
      };

      const result = await trpc.searchAutoParts.query(searchInput);
      setParts(result);
    } catch (error) {
      console.error('Failed to search parts:', error);
      
      // Demo data for development
      const demoParts: AutoPart[] = [
        {
          id: 1,
          seller_id: 2,
          title: '2018 Honda Civic Engine Block',
          description: 'Complete engine block from 2018 Honda Civic. Low mileage, excellent condition. Perfect for engine rebuilds or replacements.',
          category: 'engine',
          condition: 'used_excellent',
          price: 2500.00,
          make: 'Honda',
          model: 'Civic',
          year: 2018,
          part_number: 'HC-ENG-2018-001',
          is_active: true,
          created_at: new Date('2024-01-15'),
          updated_at: new Date('2024-01-15')
        },
        {
          id: 2,
          seller_id: 2,
          title: 'Toyota Camry Brake Pads Set',
          description: 'Brand new OEM brake pads for Toyota Camry 2015-2020. Never used, still in original packaging.',
          category: 'brakes',
          condition: 'new',
          price: 89.99,
          make: 'Toyota',
          model: 'Camry',
          year: 2018,
          part_number: 'TC-BRK-2018-005',
          is_active: true,
          created_at: new Date('2024-01-10'),
          updated_at: new Date('2024-01-10')
        },
        {
          id: 3,
          seller_id: 2,
          title: 'Ford F-150 Transmission Assembly',
          description: 'Rebuilt transmission assembly for Ford F-150. Professionally rebuilt with 12-month warranty.',
          category: 'transmission',
          condition: 'refurbished',
          price: 1800.00,
          make: 'Ford',
          model: 'F-150',
          year: 2016,
          part_number: 'FF-TRN-2016-003',
          is_active: true,
          created_at: new Date('2024-01-12'),
          updated_at: new Date('2024-01-12')
        }
      ];
      
      // Apply basic filtering to demo data
      let filteredParts = demoParts;
      
      if (searchQuery) {
        filteredParts = filteredParts.filter((part: AutoPart) =>
          part.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
          part.model.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      if (filters.category) {
        filteredParts = filteredParts.filter((part: AutoPart) => part.category === filters.category);
      }
      
      if (filters.condition) {
        filteredParts = filteredParts.filter((part: AutoPart) => part.condition === filters.condition);
      }
      
      if (filters.make) {
        filteredParts = filteredParts.filter((part: AutoPart) => 
          part.make.toLowerCase().includes(filters.make!.toLowerCase())
        );
      }
      
      if (filters.model) {
        filteredParts = filteredParts.filter((part: AutoPart) => 
          part.model.toLowerCase().includes(filters.model!.toLowerCase())
        );
      }
      
      if (filters.year) {
        filteredParts = filteredParts.filter((part: AutoPart) => part.year === filters.year);
      }
      
      if (filters.min_price) {
        filteredParts = filteredParts.filter((part: AutoPart) => part.price >= filters.min_price!);
      }
      
      if (filters.max_price) {
        filteredParts = filteredParts.filter((part: AutoPart) => part.price <= filters.max_price!);
      }
      
      setParts(filteredParts);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters]);

  useEffect(() => {
    searchParts();
  }, [searchParts]);

  const handleInquiry = async () => {
    if (!selectedPart || !inquiryMessage.trim()) return;
    
    setIsSubmittingInquiry(true);
    try {
      const inquiryData: CreateBuyerInquiryInput = {
        buyer_id: currentUser.id,
        part_id: selectedPart.id,
        message: inquiryMessage.trim()
      };

      await trpc.createBuyerInquiry.mutate(inquiryData);
      setSelectedPart(null);
      setInquiryMessage('');
      
      // Show success message (in real app, you might want to use a toast)
      alert('Inquiry sent successfully!');
    } catch (error) {
      console.error('Failed to send inquiry:', error);
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const loadFinancingOptions = useCallback(async () => {
    setIsLoadingFinancingOptions(true);
    try {
      const options = await trpc.getFinancingOptions.query();
      setFinancingOptions(options);
    } catch (error) {
      console.error('Failed to load financing options:', error);
      alert('Failed to load financing options. Please try again.');
    } finally {
      setIsLoadingFinancingOptions(false);
    }
  }, []);

  const handleFinanceClick = (part: AutoPart) => {
    setSelectedPartForFinancing(part);
    setRequestedAmount(part.price.toString());
    setApplicationData('');
    setSelectedFinancingOption(null);
    setFinancingModalOpen(true);
    loadFinancingOptions();
  };

  const handleFinancingApplication = async () => {
    if (!selectedPartForFinancing || !selectedFinancingOption || !requestedAmount || !applicationData.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSubmittingFinancingApplication(true);
    try {
      const applicationInput: CreateFinancingApplicationInput = {
        buyer_id: currentUser.id,
        part_id: selectedPartForFinancing.id,
        financing_option_id: selectedFinancingOption,
        requested_amount: parseFloat(requestedAmount),
        application_data: applicationData.trim()
      };

      await trpc.createFinancingApplication.mutate(applicationInput);
      
      // Reset and close modal
      setSelectedPartForFinancing(null);
      setRequestedAmount('');
      setApplicationData('');
      setSelectedFinancingOption(null);
      setFinancingModalOpen(false);
      
      alert('Financing application submitted successfully! You will be notified of the decision.');
    } catch (error) {
      console.error('Failed to submit financing application:', error);
      alert('Failed to submit financing application. Please try again.');
    } finally {
      setIsSubmittingFinancingApplication(false);
    }
  };

  const resetFinancingModal = () => {
    setSelectedPartForFinancing(null);
    setRequestedAmount('');
    setApplicationData('');
    setSelectedFinancingOption(null);
    setFinancingModalOpen(false);
  };

  const getConditionColor = (condition: PartCondition) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'used_excellent': return 'bg-blue-100 text-blue-800';
      case 'used_good': return 'bg-yellow-100 text-yellow-800';
      case 'used_fair': return 'bg-orange-100 text-orange-800';
      case 'refurbished': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConditionLabel = (condition: PartCondition) => {
    switch (condition) {
      case 'new': return '✨ New';
      case 'used_excellent': return '⭐ Used - Excellent';
      case 'used_good': return '👍 Used - Good';
      case 'used_fair': return '⚠️ Used - Fair';
      case 'refurbished': return '🔧 Refurbished';
      default: return condition;
    }
  };

  const getCategoryIcon = (category: PartCategory) => {
    switch (category) {
      case 'engine': return '🔧';
      case 'transmission': return '⚙️';
      case 'brakes': return '🛑';
      case 'suspension': return '🏁';
      case 'electrical': return '⚡';
      case 'exhaust': return '💨';
      case 'interior': return '🪑';
      case 'exterior': return '🚗';
      case 'tires_wheels': return '🛞';
      default: return '🔩';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Search Auto Parts</CardTitle>
          <CardDescription>
            Find the perfect parts for your vehicle from trusted sellers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div>
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by part name, description, make, or model..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select 
                value={filters.category || 'all'} 
                onValueChange={(value: string) =>
                  setFilters((prev: Partial<SearchPartsInput>) => ({ 
                    ...prev, 
                    category: value === 'all' ? undefined : value as PartCategory 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="engine">🔧 Engine</SelectItem>
                  <SelectItem value="transmission">⚙️ Transmission</SelectItem>
                  <SelectItem value="brakes">🛑 Brakes</SelectItem>
                  <SelectItem value="suspension">🏁 Suspension</SelectItem>
                  <SelectItem value="electrical">⚡ Electrical</SelectItem>
                  <SelectItem value="exhaust">💨 Exhaust</SelectItem>
                  <SelectItem value="interior">🪑 Interior</SelectItem>
                  <SelectItem value="exterior">🚗 Exterior</SelectItem>
                  <SelectItem value="tires_wheels">🛞 Tires & Wheels</SelectItem>
                  <SelectItem value="other">🔩 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select 
                value={filters.condition || 'all'} 
                onValueChange={(value: string) =>
                  setFilters((prev: Partial<SearchPartsInput>) => ({ 
                    ...prev, 
                    condition: value === 'all' ? undefined : value as PartCondition 
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Conditions</SelectItem>
                  <SelectItem value="new">✨ New</SelectItem>
                  <SelectItem value="used_excellent">⭐ Used - Excellent</SelectItem>
                  <SelectItem value="used_good">👍 Used - Good</SelectItem>
                  <SelectItem value="used_fair">⚠️ Used - Fair</SelectItem>
                  <SelectItem value="refurbished">🔧 Refurbished</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                placeholder="Honda, Toyota..."
                value={filters.make || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: Partial<SearchPartsInput>) => ({ 
                    ...prev, 
                    make: e.target.value 
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="Civic, Camry..."
                value={filters.model || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: Partial<SearchPartsInput>) => ({ 
                    ...prev, 
                    model: e.target.value 
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                placeholder="2020"
                value={filters.year || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFilters((prev: Partial<SearchPartsInput>) => ({ 
                    ...prev, 
                    year: e.target.value ? parseInt(e.target.value) : undefined 
                  }))
                }
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <Label>Price Range</Label>
              <div className="flex gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.min_price || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilters((prev: Partial<SearchPartsInput>) => ({ 
                      ...prev, 
                      min_price: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))
                  }
                  min="0"
                  step="0.01"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.max_price || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFilters((prev: Partial<SearchPartsInput>) => ({ 
                      ...prev, 
                      max_price: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))
                  }
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <Button onClick={searchParts} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Searching...' : '🔍 Search Parts'}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Search Results ({parts.length} parts found)
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Searching for parts...</p>
          </div>
        ) : parts.length === 0 ? (
          <Alert>
            <AlertDescription>
              No parts found matching your criteria. Try adjusting your search filters.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {parts.map((part: AutoPart) => (
              <Card key={part.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(part.category)}</span>
                      <div>
                        <CardTitle className="text-lg">{part.title}</CardTitle>
                        <CardDescription>
                          {part.year} {part.make} {part.model}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${part.price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {part.description}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getConditionColor(part.condition)}>
                      {getConditionLabel(part.condition)}
                    </Badge>
                    {part.part_number && (
                      <Badge variant="outline">
                        #{part.part_number}
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    Listed: {part.created_at.toLocaleDateString()}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {currentUser.user_type === 'buyer' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="flex-1"
                            onClick={() => setSelectedPart(part)}
                          >
                            💬 Contact Seller
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Contact Seller</DialogTitle>
                            <DialogDescription>
                              Send an inquiry about: {part.title}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="inquiry-message">Your Message</Label>
                              <Textarea
                                id="inquiry-message"
                                placeholder="Hi, I'm interested in this part. Is it still available? Can you provide more details?"
                                value={inquiryMessage}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                                  setInquiryMessage(e.target.value)
                                }
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                onClick={handleInquiry}
                                disabled={isSubmittingInquiry || !inquiryMessage.trim()}
                                className="flex-1"
                              >
                                {isSubmittingInquiry ? 'Sending...' : 'Send Inquiry'}
                              </Button>
                              <Button 
                                variant="outline"
                                onClick={() => {
                                  setSelectedPart(null);
                                  setInquiryMessage('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {currentUser.user_type === 'buyer' && part.price > 1000 && (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleFinanceClick(part)}
                      >
                        💰 Finance
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Financing Application Modal */}
      <Dialog open={financingModalOpen} onOpenChange={setFinancingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>💰 Apply for Financing</DialogTitle>
            <DialogDescription>
              Submit a financing application for this auto part
            </DialogDescription>
          </DialogHeader>
          
          {selectedPartForFinancing && (
            <div className="space-y-6">
              {/* Part Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Part Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {selectedPartForFinancing.title}
                  </div>
                  <div>
                    <span className="font-medium">Price:</span> ${selectedPartForFinancing.price.toFixed(2)}
                  </div>
                  <div>
                    <span className="font-medium">Vehicle:</span> {selectedPartForFinancing.year} {selectedPartForFinancing.make} {selectedPartForFinancing.model}
                  </div>
                  <div>
                    <span className="font-medium">Condition:</span> {getConditionLabel(selectedPartForFinancing.condition)}
                  </div>
                </div>
              </div>

              {/* Financing Options */}
              <div>
                <Label htmlFor="financing-option">Select Financing Option *</Label>
                {isLoadingFinancingOptions ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading financing options...</p>
                  </div>
                ) : financingOptions.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No financing options are currently available. Please try again later.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Select 
                    value={selectedFinancingOption?.toString() || ''} 
                    onValueChange={(value: string) => setSelectedFinancingOption(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a financing option" />
                    </SelectTrigger>
                    <SelectContent>
                      {financingOptions.map((option: FinancingOption) => (
                        <SelectItem key={option.id} value={option.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{option.name}</span>
                            <span className="text-sm text-gray-500">
                              {option.interest_rate}% APR • {option.term_months} months • 
                              ${option.min_amount.toFixed(0)}-${option.max_amount.toFixed(0)}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Selected Option Details */}
              {selectedFinancingOption && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  {(() => {
                    const option = financingOptions.find((opt: FinancingOption) => opt.id === selectedFinancingOption);
                    return option ? (
                      <div>
                        <h4 className="font-semibold text-blue-900 mb-2">{option.name}</h4>
                        <p className="text-blue-800 text-sm mb-3">{option.description}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Interest Rate:</span> {option.interest_rate}% APR
                          </div>
                          <div>
                            <span className="font-medium">Term:</span> {option.term_months} months
                          </div>
                          <div>
                            <span className="font-medium">Min Amount:</span> ${option.min_amount.toFixed(2)}
                          </div>
                          <div>
                            <span className="font-medium">Max Amount:</span> ${option.max_amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Requested Amount */}
              <div>
                <Label htmlFor="requested-amount">Requested Amount *</Label>
                <Input
                  id="requested-amount"
                  type="number"
                  placeholder="Enter requested amount"
                  value={requestedAmount}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequestedAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pre-filled with part price (${selectedPartForFinancing.price.toFixed(2)}), but you can adjust as needed
                </p>
              </div>

              {/* Application Data */}
              <div>
                <Label htmlFor="application-data">Financial Information *</Label>
                <Textarea
                  id="application-data"
                  placeholder="Please provide your financial details in JSON format, for example:
{
  &quot;annual_income&quot;: 50000,
  &quot;credit_score&quot;: 720,
  &quot;employment_status&quot;: &quot;employed&quot;,
  &quot;monthly_expenses&quot;: 2500,
  &quot;existing_debt&quot;: 15000,
  &quot;years_at_current_job&quot;: 3
}"
                  value={applicationData}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setApplicationData(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Please provide accurate financial information in JSON format. This will be reviewed by the financing provider.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={handleFinancingApplication}
                  disabled={
                    isSubmittingFinancingApplication || 
                    !selectedFinancingOption || 
                    !requestedAmount || 
                    !applicationData.trim()
                  }
                  className="flex-1"
                >
                  {isSubmittingFinancingApplication ? 'Submitting...' : 'Submit Application'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={resetFinancingModal}
                  disabled={isSubmittingFinancingApplication}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
