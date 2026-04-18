import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/localClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Check, X, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const { data: reviews, isLoading } = useQuery({ queryKey: ['admin-reviews'], queryFn: () => base44.entities.Review.list('-created_date'), initialData: [] });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Review.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Review.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  return (
    <AdminLayout currentPage="AdminReviews">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">ביקורות</h1>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#B68AD8]" /></div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <strong>{review.reviewer_name}</strong>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'fill-[#F5B731] text-[#F5B731]' : 'fill-gray-200 text-gray-200'}`} />
                    ))}
                  </div>
                  <Badge className={review.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                    {review.is_approved ? 'מאושר' : 'ממתין'}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm">{review.text}</p>
                <p className="text-gray-400 text-xs mt-1">{review.created_date && format(new Date(review.created_date), 'dd/MM/yyyy')}</p>
              </div>
              <div className="flex gap-2">
                {!review.is_approved && (
                  <Button variant="outline" size="sm" className="text-green-600 rounded-lg" onClick={() => updateMutation.mutate({ id: review.id, data: { is_approved: true } })}>
                    <Check className="w-3 h-3 ml-1" /> אשר
                  </Button>
                )}
                {review.is_approved && (
                  <Button variant="outline" size="sm" className="text-yellow-600 rounded-lg" onClick={() => updateMutation.mutate({ id: review.id, data: { is_approved: false } })}>
                    <X className="w-3 h-3 ml-1" /> השהה
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-red-500 rounded-lg" onClick={() => deleteMutation.mutate(review.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
