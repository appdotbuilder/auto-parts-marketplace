
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import type { 
  BuyerInquiry, 
  InquiryStatus, 
  UpdateInquiryStatusInput 
} from '../../../server/src/schema';

interface InquiryManagementProps {
  sellerId: number;
}

// Extended inquiry type with part and buyer info for display
interface InquiryWithDetails extends BuyerInquiry {
  part_title?: string;
  part_price?: number;
  buyer_name?: string;
  buyer_email?: string;
}

export function InquiryManagement({ sellerId }: InquiryManagementProps) {
  const [inquiries, setInquiries] = useState<InquiryWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryWithDetails | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getSellerInquiries.query(sellerId);
      setInquiries(result);
    } catch (error) {
      console.error('Failed to load inquiries:', error);
      
      // Demo data for development
      const demoInquiries: InquiryWithDetails[] = [
        {
          id: 1,
          buyer_id: 1,
          seller_id: sellerId,
          part_id: 1,
          message: "Hi, I'm interested in the Honda Civic engine block. Is it still available? Can you provide more details about the mileage and any known issues?",
          status: 'pending',
          created_at: new Date('2024-01-16T10:30:00'),
          updated_at: new Date('2024-01-16T10:30:00'),
          part_title: '2018 Honda Civic Engine Block',
          part_price: 2500.00,
          buyer_name: 'John Buyer',
          buyer_email: 'buyer@demo.com'
        },
        {
          id: 2,
          buyer_id: 1,
          seller_id: sellerId,
          part_id: 2,
          message: "Are these brake pads compatible with a 2017 Camry as well? Also, do you offer any warranty?",
          status: 'responded',
          created_at: new Date('2024-01-14T14:20:00'),
          updated_at: new Date('2024-01-15T09:15:00'),
          part_title: 'Toyota Camry Brake Pads Set',
          part_price: 89.99,
          buyer_name: 'John Buyer',
          buyer_email: 'buyer@demo.com'
        }
      ];
      setInquiries(demoInquiries);
    } finally {
      setIsLoading(false);
    }
  }, [sellerId]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const handleStatusUpdate = async (inquiryId: number, newStatus: InquiryStatus) => {
    setIsSubmitting(true);
    try {
      const updateData: UpdateInquiryStatusInput = {
        id: inquiryId,
        status: newStatus
      };

      await trpc.updateInquiryStatus.mutate(updateData);
      
      setInquiries((prev: InquiryWithDetails[]) =>
        prev.map((inquiry: InquiryWithDetails) =>
          inquiry.id === inquiryId 
            ? { ...inquiry, status: newStatus, updated_at: new Date() }
            : inquiry
        )
      );

      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry((prev: InquiryWithDetails | null) => 
          prev ? { ...prev, status: newStatus, updated_at: new Date() } : null
        );
      }
    } catch (error) {
      console.error('Failed to update inquiry status:', error);
      alert('Failed to update inquiry status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: InquiryStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'responded': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: InquiryStatus) => {
    switch (status) {
      case 'pending': return '⏳ Pending';
      case 'responded': return '💬 Responded';
      case 'closed': return '✅ Closed';
      default: return status;
    }
  };

  const getPriorityByStatus = (status: InquiryStatus) => {
    switch (status) {
      case 'pending': return 1;
      case 'responded': return 2;
      case 'closed': return 3;
      default: return 4;
    }
  };

  // Sort inquiries by status priority and then by date
  const sortedInquiries = [...inquiries].sort((a: InquiryWithDetails, b: InquiryWithDetails) => {
    const priorityDiff = getPriorityByStatus(a.status) - getPriorityByStatus(b.status);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>💬 Customer Inquiries</CardTitle>
          <CardDescription>
            Manage inquiries from potential buyers about your parts
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Inquiries List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Inquiries ({inquiries.length} total)
          </h2>
          <div className="flex gap-2 text-sm">
            <Badge className="bg-yellow-100 text-yellow-800">
              {inquiries.filter((i: InquiryWithDetails) => i.status === 'pending').length} Pending
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              {inquiries.filter((i: InquiryWithDetails) => i.status === 'responded').length} Responded
            </Badge>
            <Badge className="bg-gray-100 text-gray-800">
              {inquiries.filter((i: InquiryWithDetails) => i.status === 'closed').length} Closed
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading inquiries...</p>
          </div>
        ) : inquiries.length === 0 ? (
          <Alert>
            <AlertDescription>
              No inquiries yet. When buyers contact you about your parts, they'll appear here.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4">
            {sortedInquiries.map((inquiry: InquiryWithDetails) => (
              <Card key={inquiry.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {inquiry.part_title || `Part #${inquiry.part_id}`}
                      </CardTitle>
                      <CardDescription>
                        From: {inquiry.buyer_name || 'Unknown Buyer'} 
                        {inquiry.buyer_email && ` (${inquiry.buyer_email})`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {inquiry.part_price && (
                        <span className="text-lg font-bold text-green-600">
                          ${inquiry.part_price.toFixed(2)}
                        </span>
                      )}
                      <Badge className={getStatusColor(inquiry.status)}>
                        {getStatusLabel(inquiry.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Customer Message:</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      <p className="text-gray-700">{inquiry.message}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Received: {inquiry.created_at.toLocaleDateString()} at {inquiry.created_at.toLocaleTimeString()}</span>
                    {inquiry.updated_at > inquiry.created_at && (
                      <span>Updated: {inquiry.updated_at.toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {inquiry.status === 'pending' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleStatusUpdate(inquiry.id, 'responded')}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          ✅ Mark as Responded
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="flex-1"
                        >
                          💬 View Details
                        </Button>
                      </>
                    )}
                    {inquiry.status === 'responded' && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleStatusUpdate(inquiry.id, 'closed')}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          🏁 Close Inquiry
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedInquiry(inquiry)}
                          className="flex-1"
                        >
                          👁️ View Details
                        </Button>
                      </>
                    )}
                    {inquiry.status === 'closed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedInquiry(inquiry)}
                        className="w-full"
                      >
                        👁️ View Details
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Inquiry Details Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Inquiry Details</CardTitle>
                  <CardDescription>
                    {selectedInquiry.part_title} - {selectedInquiry.buyer_name}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedInquiry(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Part Information:</Label>
                <div className="mt-1 p-3 bg-blue-50 rounded-md">
                  <div className="font-medium">{selectedInquiry.part_title}</div>
                  {selectedInquiry.part_price && (
                    <div className="text-green-600 font-bold">
                      ${selectedInquiry.part_price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Customer Information:</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <div className="font-medium">{selectedInquiry.buyer_name}</div>
                  <div className="text-gray-600">{selectedInquiry.buyer_email}</div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Customer Message:</Label>
                <div className="mt-1 p-3 bg-yellow-50 rounded-md">
                  <p>{selectedInquiry.message}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Status:</Label>
                <div className="mt-1">
                  <Select 
                    value={selectedInquiry.status || 'pending'} 
                    onValueChange={(value: InquiryStatus) =>
                      handleStatusUpdate(selectedInquiry.id, value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">⏳ Pending</SelectItem>
                      <SelectItem value="responded">💬 Responded</SelectItem>
                      <SelectItem value="closed">✅ Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="response">Your Response (Optional):</Label>
                <Textarea
                  id="response"
                  value={responseMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setResponseMessage(e.target.value)
                  }
                  placeholder="Type your response to the customer here..."
                  rows={4}
                />
              </div>

              <div className="text-xs text-gray-500 border-t pt-4">
                <div>Received: {selectedInquiry.created_at.toLocaleString()}</div>
                {selectedInquiry.updated_at > selectedInquiry.created_at && (
                  <div>Last Updated: {selectedInquiry.updated_at.toLocaleString()}</div>
                )}
              </div>

              <div className="flex gap-2">
                {responseMessage.trim() && (
                  <Button 
                    onClick={() => {
                      // In a real app, this would send the response
                      alert('Response functionality would be implemented here');
                      setResponseMessage('');
                    }}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    📧 Send Response
                  </Button>
                )}
                <Button 
                  variant="outline"
                  onClick={() => setSelectedInquiry(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
