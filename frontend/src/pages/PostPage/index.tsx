import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Clock, Eye, Calendar, Tag } from 'lucide-react';

interface Post {
  id: number; title: string; content: string; excerpt: string; coverImage: string;
  views: number; readTime: number; createdAt: string;
  author: { name: string; avatar: string; bio: string };
  tags: { id: number; name: string; slug: string }[];
  comments: { id: number; content: string; createdAt: string; author: { name: string; avatar: string } }[];
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`/api/posts/${slug}`)
      .then(r => setPost(r.data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!post) return <div className="text-center p-12">Post not found</div>;

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full h-80 object-cover rounded-2xl mb-8" />}
      <div className="flex flex-wrap gap-2 mb-4">
        {post.tags.map(tag => (
          <span key={tag.id} className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full">
            <Tag className="w-3 h-3" />{tag.name}
          </span>
        ))}
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
      <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b">
        <img src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.name}`}
          className="w-10 h-10 rounded-full" alt={post.author.name} />
        <div>
          <p className="font-medium text-gray-800">{post.author.name}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(post.createdAt).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime} min read</span>
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views} views</span>
          </div>
        </div>
      </div>
      <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Comments ({post.comments.length})</h2>
        <textarea value={comment} onChange={e => setComment(e.target.value)}
          className="w-full border rounded-xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4} placeholder="Share your thoughts..." />
        <button className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Post Comment
        </button>
        <div className="mt-8 space-y-6">
          {post.comments.map(c => (
            <div key={c.id} className="flex gap-4">
              <img src={c.author.avatar || `https://ui-avatars.com/api/?name=${c.author.name}`}
                className="w-9 h-9 rounded-full flex-shrink-0" alt="" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">{c.author.name}</span>
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 text-sm">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
}
