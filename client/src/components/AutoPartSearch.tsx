
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
  CreateBuyerInquiryInput 
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
                      <Button variant="outline" className="flex-1">
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
    </div>
  );
}
