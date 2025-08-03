
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import type { 
  FinancingApplication, 
  ApplicationStatus, 
  UpdateApplicationStatusInput 
} from '../../../server/src/schema';

interface FinancingApplicationsProps {
  userId: number;
  userType: 'buyer' | 'financing_provider';
}

// Extended application type with additional info for display
interface ApplicationWithDetails extends FinancingApplication {
  part_title?: string;
  part_price?: number;
  financing_option_name?: string;
  buyer_name?: string;
  buyer_email?: string;
}

export function FinancingApplications({ userId, userType }: FinancingApplicationsProps) {
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getFinancingApplications.query({
        userId,
        userType
      });
      setApplications(result);
    } catch (error) {
      console.error('Failed to load applications:', error);
      
      // Demo data for development
      const demoApplications: ApplicationWithDetails[] = userType === 'buyer' ? [
        {
          id: 1,
          buyer_id: userId,
          provider_id: 3,
          part_id: 1,
          financing_option_id: 1,
          requested_amount: 2500.00,
          status: 'pending',
          application_data: JSON.stringify({
            income: 50000,
            employment: 'Full-time',
            credit_score: 720,
            debt_to_income: 0.3
          }),
          created_at: new Date('2024-01-16T11:00:00'),
          updated_at: new Date('2024-01-16T11:00:00'),
          part_title: '2018 Honda Civic Engine Block',
          part_price: 2500.00,
          financing_option_name: 'Standard Auto Parts Financing'
        }
      ] : [
        {
          id: 1,
          buyer_id: 1,
          provider_id: userId,
          part_id: 1,
          financing_option_id: 1,
          requested_amount: 2500.00,
          status: 'pending',
          application_data: JSON.stringify({
            income: 50000,
            employment: 'Full-time',
            credit_score: 720,
            debt_to_income: 0.3
          }),
          created_at: new Date('2024-01-16T11:00:00'),
          updated_at: new Date('2024-01-16T11:00:00'),
          part_title: '2018 Honda Civic Engine Block',
          part_price: 2500.00,
          financing_option_name: 'Standard Auto Parts Financing',
          buyer_name: 'John Buyer',
          buyer_email: 'buyer@demo.com'
        }
      ];
      
      setApplications(demoApplications);
    } finally {
      setIsLoading(false);
    }
  }, [userId, userType]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleStatusUpdate = async (applicationId: number, newStatus: ApplicationStatus) => {
    setIsSubmitting(true);
    try {
      const updateData: UpdateApplicationStatusInput = {
        id: applicationId,
        status: newStatus
      };

      await trpc.updateApplicationStatus.mutate(updateData);
      
      setApplications((prev: ApplicationWithDetails[]) =>
        prev.map((app: ApplicationWithDetails) =>
          app.id === applicationId 
            ? { ...app, status: newStatus, updated_at: new Date() }
            : app
        )
      );

      if (selectedApplication && selectedApplication.id === applicationId) {
        setSelectedApplication((prev: ApplicationWithDetails | null) => 
          prev ? { ...prev, status: newStatus, updated_at: new Date() } : null
        );
      }
    } catch (error) {
      console.error('Failed to update application status:', error);
      alert('Failed to update application status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending': return '⏳ Pending Review';
      case 'approved': return '✅ Approved';
      case 'rejected': return '❌ Rejected';
      case 'withdrawn': return '🚫 Withdrawn';
      default: return status;
    }
  };

  const parseApplicationData = (jsonString: string) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  };

  const calculateMonthlyPayment = (amount: number, interestRate: number, termMonths: number) => {
    const monthlyRate = interestRate / 100 / 12;
    const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                   (Math.pow(1 + monthlyRate, termMonths) - 1);
    return payment;
  };

  const getPriorityByStatus = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending': return 1;
      case 'approved': return 2;
      case 'rejected': return 3;
      case 'withdrawn': return 4;
      default: return 5;
    }
  };

  // Sort applications by status priority and then by date
  const sortedApplications = [...applications].sort((a: ApplicationWithDetails, b: ApplicationWithDetails) => {
    const priorityDiff = getPriorityByStatus(a.status) - getPriorityByStatus(b.status);
    if (priorityDiff !== 0) return priorityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const description = userType === 'buyer' 
    ? 'Track your financing applications for auto parts purchases'
    : 'Review and manage financing applications from buyers';

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>
            {userType === 'buyer' ? '📋 My Financing Applications' : '🏦 Financing Applications'}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Applications List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            Applications ({applications.length} total)
          </h2>
          <div className="flex gap-2 text-sm">
            <Badge className="bg-yellow-100 text-yellow-800">
              {applications.filter((app: ApplicationWithDetails) => app.status === 'pending').length} Pending
            </Badge>
            <Badge className="bg-green-100 text-green-800">
              {applications.filter((app: ApplicationWithDetails) => app.status === 'approved').length} Approved
            </Badge>
            <Badge className="bg-red-100 text-red-800">
              {applications.filter((app: ApplicationWithDetails) => app.status === 'rejected').length} Rejected
            </Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading applications...</p>
          </div>
        ) : applications.length === 0 ? (
          <Alert>
            <AlertDescription>
              {userType === 'buyer' 
                ? "You haven't submitted any financing applications yet. Browse parts and look for financing options."
                : "No financing applications have been submitted yet."
              }
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid gap-4">
            {sortedApplications.map((application: ApplicationWithDetails) => (
              <Card key={application.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {application.part_title || `Part #${application.part_id}`}
                      </CardTitle>
                      <CardDescription>
                        {userType === 'financing_provider' && application.buyer_name && (
                          <>From: {application.buyer_name} ({application.buyer_email})<br /></>
                        )}
                        Financing: {application.financing_option_name || 'Unknown Option'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          ${application.requested_amount.toFixed(2)}
                        </div>
                        {application.part_price && (
                          <div className="text-sm text-gray-500">
                            Part: ${application.part_price.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <Badge className={getStatusColor(application.status)}>
                        {getStatusLabel(application.status)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label className="text-xs text-gray-500">Requested Amount</Label>
                      <div className="font-medium text-lg">
                        ${application.requested_amount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Est. Monthly Payment</Label>
                      <div className="font-medium text-blue-600">
                        ${calculateMonthlyPayment(application.requested_amount, 7.99, 24).toFixed(2)}
                        <span className="text-xs text-gray-500 ml-1">(est.)</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Application Date</Label>
                      <div className="font-medium">
                        {application.created_at.toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Application Data Preview */}
                  {userType === 'financing_provider' && (
                    <div className="p-3 bg-gray-50 rounded-md">
                      <Label className="text-xs text-gray-500">Application Summary</Label>
                      {(() => {
                        const data = parseApplicationData(application.application_data);
                        return (
                          <div className="text-sm mt-1">
                            {data.income && <span>Income: ${data.income.toLocaleString()} • </span>}
                            {data.employment && <span>Employment: {data.employment} • </span>}
                            {data.credit_score && <span>Credit Score: {data.credit_score}</span>}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Applied: {application.created_at.toLocaleDateString()}</span>
                    {application.updated_at > application.created_at && (
                      <span>Updated: {application.updated_at.toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {userType === 'financing_provider' && application.status === 'pending' && (
                      <>
                        <Button 
                          size="sm"
                          onClick={() => handleStatusUpdate(application.id, 'approved')}
                          disabled={isSubmitting}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          ✅ Approve
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          disabled={isSubmitting}
                          className="flex-1"
                        >
                          ❌ Reject
                        </Button>
                      </>
                    )}
                    
                    {userType === 'buyer' && application.status === 'pending' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusUpdate(application.id, 'withdrawn')}
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        🚫 Withdraw
                      </Button>
                    )}

                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedApplication(application)}
                      className="flex-1"
                    >
                      👁️ View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Application Details</CardTitle>
                  <CardDescription>
                    {selectedApplication.part_title}
                    {userType === 'financing_provider' && selectedApplication.buyer_name && (
                      <> - {selectedApplication.buyer_name}</>
                    )}
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedApplication(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Part Information:</Label>
                <div className="mt-1 p-3 bg-blue-50 rounded-md">
                  <div className="font-medium">{selectedApplication.part_title}</div>
                  <div className="text-sm text-gray-600">
                    Part Price: ${selectedApplication.part_price?.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">
                    Requested Financing: ${selectedApplication.requested_amount.toFixed(2)}
                  </div>
                </div>
              </div>

              {userType === 'financing_provider' && selectedApplication.buyer_name && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Buyer Information:</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    <div className="font-medium">{selectedApplication.buyer_name}</div>
                    <div className="text-gray-600">{selectedApplication.buyer_email}</div>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700">Financing Details:</Label>
                <div className="mt-1 p-3 bg-green-50 rounded-md">
                  <div className="font-medium">{selectedApplication.financing_option_name}</div>
                  <div className="text-sm text-gray-600">
                    Estimated Monthly Payment: ${calculateMonthlyPayment(selectedApplication.requested_amount, 7.99, 24).toFixed(2)}
                  </div>
                </div>
              </div>

              {userType === 'financing_provider' && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Application Data:</Label>
                  <div className="mt-1 p-3 bg-yellow-50 rounded-md">
                    {(() => {
                      const data = parseApplicationData(selectedApplication.application_data);
                      return (
                        <div className="space-y-2 text-sm">
                          {data.income && <div><strong>Annual Income:</strong> ${data.income.toLocaleString()}</div>}
                          {data.employment && <div><strong>Employment Status:</strong>  {data.employment}</div>}
                          {data.credit_score && <div><strong>Credit Score:</strong> {data.credit_score}</div>}
                          {data.debt_to_income && <div><strong>Debt-to-Income Ratio:</strong> {(data.debt_to_income * 100).toFixed(1)}%</div>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700">Current Status:</Label>
                <div className="mt-1">
                  {userType === 'financing_provider' && selectedApplication.status === 'pending' ? (
                    <Select 
                      value={selectedApplication.status || 'pending'} 
                      onValueChange={(value: ApplicationStatus) =>
                        handleStatusUpdate(selectedApplication.id, value)
                      }
                      disabled={isSubmitting}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">⏳ Pending Review</SelectItem>
                        <SelectItem value="approved">✅ Approved</SelectItem>
                        <SelectItem value="rejected">❌ Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getStatusColor(selectedApplication.status)}>
                      {getStatusLabel(selectedApplication.status)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="text-xs text-gray-500 border-t pt-4">
                <div>Submitted: {selectedApplication.created_at.toLocaleString()}</div>
                {selectedApplication.updated_at > selectedApplication.created_at && (
                  <div>Last Updated: {selectedApplication.updated_at.toLocaleString()}</div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedApplication(null)}
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
