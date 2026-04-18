import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { getBlogPosts } from '@/data/store';

export default function Tips() {
  const searchParams = new URLSearchParams(window.location.search);
  const slug = searchParams.get('slug');

  const { data: posts = [] } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: getBlogPosts,
    initialData: [],
  });

  const publishedPosts = useMemo(
    () => posts
      .filter(post => post.is_published !== false)
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0)),
    [posts]
  );

  const selectedPost = publishedPosts.find(post => post.slug === slug) || null;

  if (selectedPost) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link to={createPageUrl('Tips')} className="text-sm text-[#B68AD8] hover:underline">
          חזרה לכל הטיפים
        </Link>
        <article className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {selectedPost.cover_image && (
            <img src={selectedPost.cover_image} alt={selectedPost.title} className="w-full h-64 md:h-96 object-cover" />
          )}
          <div className="p-6 md:p-10">
            <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">{selectedPost.title}</h1>
            {selectedPost.excerpt && <p className="text-lg text-gray-500 mt-4">{selectedPost.excerpt}</p>}
            <div
              className="prose prose-lg max-w-none mt-8"
              dangerouslySetInnerHTML={{ __html: selectedPost.content_html || '<p>המאמר עדיין ריק.</p>' }}
            />
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900">הטיפים שלנו</h1>
        <p className="text-gray-500 mt-3">רעיונות, השראה וטיפים להורים, גנים והזמנות ממותגות.</p>
      </div>

      {publishedPosts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 text-center py-20 text-gray-400">
          בקרוב יעלו כאן טיפים ומאמרים חדשים.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {publishedPosts.map(post => (
            <Link
              key={post.id}
              to={`${createPageUrl('Tips')}?slug=${encodeURIComponent(post.slug)}`}
              className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
            >
              {post.cover_image && (
                <img src={post.cover_image} alt={post.title} className="w-full h-56 object-cover" />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900">{post.title}</h2>
                <p className="text-gray-500 mt-3 line-clamp-3">{post.excerpt || 'פתחו את המאמר לקריאה מלאה.'}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
