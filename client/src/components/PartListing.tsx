
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/utils/trpc';
import type { 
  AutoPart, 
  CreateAutoPartInput, 
  UpdateAutoPartInput,
  PartCategory, 
  PartCondition 
} from '../../../server/src/schema';

interface PartListingProps {
  sellerId: number;
}

export function PartListing({ sellerId }: PartListingProps) {
  const [parts, setParts] = useState<AutoPart[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPart, setEditingPart] = useState<AutoPart | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateAutoPartInput>({
    seller_id: sellerId,
    title: '',
    description: '',
    category: 'other',
    condition: 'used_good',
    price: 0,
    make: '',
    model: '',
    year: new Date().getFullYear(),
    part_number: null
  });

  const loadParts = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would filter by seller_id
      const result = await trpc.getAutoParts.query();
      // Filter for this seller (demo)
      const sellerParts = result.filter((part: AutoPart) => part.seller_id === sellerId);
      setParts(sellerParts);
    } catch (error) {
      console.error('Failed to load parts:', error);
      
      // Demo data for seller
      const demoParts: AutoPart[] = [
        {
          id: 1,
          seller_id: sellerId,
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
          seller_id: sellerId,
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
        }
      ];
      setParts(demoParts);
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    loadParts();
  }, [loadParts]);

  const handleCreatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await trpc.createAutoPart.mutate(formData);
      setParts((prev: AutoPart[]) => [...prev, response]);
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Failed to create part:', error);
      alert('Failed to create part. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePart = async (updateData: UpdateAutoPartInput) => {
    setIsSubmitting(true);
    
    try {
      const response = await trpc.updateAutoPart.mutate(updateData);
      setParts((prev: AutoPart[]) => 
        prev.map((part: AutoPart) => part.id === updateData.id ? response : part)
      );
      setEditingPart(null);
    } catch (error) {
      console.error('Failed to update part:', error);
      alert('Failed to update part. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      seller_id: sellerId,
      title: '',
      description: '',
      category: 'other',
      condition: 'used_good',
      price: 0,
      make: '',
      model: '',
      year: new Date().getFullYear(),
      part_number: null
    });
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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📦 My Part Listings</CardTitle>
              <CardDescription>
                Manage your auto parts inventory and listings
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              ➕ Add New Part
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create Part Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Part Listing</CardTitle>
            <CardDescription>Add a new auto part to your inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreatePart} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAutoPartInput) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g., 2018 Honda Civic Engine Block"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateAutoPartInput) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Detailed description of the part, condition, and any relevant information..."
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select 
                    value={formData.category || 'other'} 
                    onValueChange={(value: PartCategory) =>
                      setFormData((prev: CreateAutoPartInput) => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="condition">Condition *</Label>
                  <Select 
                    value={formData.condition || 'used_good'} 
                    onValueChange={(value: PartCondition) =>
                      setFormData((prev: CreateAutoPartInput) => ({ ...prev, condition: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">✨ New</SelectItem>
                      <SelectItem value="used_excellent">⭐ Used - Excellent</SelectItem>
                      <SelectItem value="used_good">👍 Used - Good</SelectItem>
                      <SelectItem value="used_fair">⚠️ Used - Fair</SelectItem>
                      <SelectItem value="refurbished">🔧 Refurbished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAutoPartInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                    }
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="make">Make *</Label>
                  <Input
                    id="make"
                    value={formData.make}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAutoPartInput) => ({ ...prev, make: e.target.value }))
                    }
                    placeholder="Honda, Toyota, Ford..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model *</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAutoPartInput) => ({ ...prev, model: e.target.value }))
                    }
                    placeholder="Civic, Camry, F-150..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="year">Year *</Label>
                  <Input
                    id="year"
                    type="number"
                    value={formData.year}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAutoPartInput) => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))
                    }
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="part_number">Part Number</Label>
                  <Input
                    id="part_number"
                    value={formData.part_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAutoPartInput) => ({ 
                        ...prev, 
                        part_number: e.target.value || null 
                      }))
                    }
                    placeholder="OEM or aftermarket part number"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
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

      {/* Parts List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Your Listings ({parts.length} parts)
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading your parts...</p>
          </div>
        ) : parts.length === 0 ? (
          <Alert>
            <AlertDescription>
              You haven't listed any parts yet. Click "Add New Part" to create your first listing.
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
                      <div className="flex items-center gap-1 mt-1">
                        {part.is_active ? (
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
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
                    {part.updated_at > part.created_at && (
                      <span> • Updated: {part.updated_at.toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setEditingPart(part)}
                      className="flex-1"
                    >
                      ✏️ Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleUpdatePart({ 
                        id: part.id, 
                        is_active: !part.is_active 
                      })}
                      className="flex-1"
                    >
                      {part.is_active ? '📴 Deactivate' : '✅ Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      {editingPart && (
        <Dialog open={!!editingPart} onOpenChange={() => setEditingPart(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Part Listing</DialogTitle>
              <DialogDescription>
                Update your part information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editingPart.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setEditingPart((prev: AutoPart | null) => 
                      prev ? { ...prev, title: e.target.value } : null
                    )
                  }
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingPart.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setEditingPart((prev: AutoPart | null) => 
                      prev ? { ...prev, description: e.target.value } : null
                    )
                  }
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={editingPart.price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingPart((prev: AutoPart | null) => 
                        prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null
                      )
                    }
                    step="0.01"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Part Number</Label>
                  <Input
                    value={editingPart.part_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEditingPart((prev: AutoPart | null) => 
                        prev ? { ...prev, part_number: e.target.value || null } : null
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingPart.is_active}
                  onCheckedChange={(checked: boolean) =>
                    setEditingPart((prev: AutoPart | null) => 
                      prev ? { ...prev, is_active: checked } : null
                    )
                  }
                />
                <Label>Active listing</Label>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => {
                    if (editingPart) {
                      handleUpdatePart({
                        id: editingPart.id,
                        title: editingPart.title,
                        description: editingPart.description,
                        price: editingPart.price,
                        part_number: editingPart.part_number,
                        is_active: editingPart.is_active
                      });
                    }
                  }}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Updating...' : 'Update Part'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditingPart(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
