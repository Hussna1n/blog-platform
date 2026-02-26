import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Eye, Tag, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Post {
  id: number; title: string; slug: string; content: string; coverImage?: string;
  viewCount: number; createdAt: string;
  author: { username: string; avatar?: string; bio?: string };
  tags: { id: number; name: string; slug: string }[];
  comments: { id: number; content: string; createdAt: string; author: { username: string; avatar?: string } }[];
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetch(`/api/posts/${slug}`)
      .then(r => r.json())
      .then(setPost);
  }, [slug]);

  if (!post) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {post.coverImage && (
        <img src={post.coverImage} alt={post.title} className="w-full h-80 object-cover rounded-2xl mb-8" />
      )}

      <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>

      <div className="flex items-center gap-4 mb-6 text-sm text-gray-500">
        <Link to={`/author/${post.author.username}`} className="flex items-center gap-2 hover:text-gray-800">
          <img src={post.author.avatar || `https://ui-avatars.com/api/?name=${post.author.username}`}
            className="w-8 h-8 rounded-full" alt={post.author.username} />
          <span className="font-medium text-gray-700">@{post.author.username}</span>
        </Link>
        <span>{format(new Date(post.createdAt), 'MMM dd, yyyy')}</span>
        <span className="flex items-center gap-1"><Eye size={14} />{post.viewCount}</span>
        <span className="flex items-center gap-1"><MessageCircle size={14} />{post.comments.length}</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        {post.tags.map(tag => (
          <Link key={tag.id} to={`/tags/${tag.slug}`}
            className="flex items-center gap-1 bg-indigo-50 text-indigo-600 text-xs font-medium px-3 py-1 rounded-full hover:bg-indigo-100">
            <Tag size={11} />{tag.name}
          </Link>
        ))}
      </div>

      <article className="prose prose-lg max-w-none mb-12">
        <ReactMarkdown components={{
          code({ className, children }) {
            const lang = /language-(\w+)/.exec(className || '')?.[1];
            return lang
              ? <SyntaxHighlighter style={vscDarkPlus} language={lang}>{String(children)}</SyntaxHighlighter>
              : <code className={className}>{children}</code>;
          }
        }}>
          {post.content}
        </ReactMarkdown>
      </article>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {post.comments.length} Comment{post.comments.length !== 1 ? 's' : ''}
        </h2>
        <div className="space-y-4 mb-8">
          {post.comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <img src={c.author.avatar || `https://ui-avatars.com/api/?name=${c.author.username}`}
                className="w-9 h-9 rounded-full flex-shrink-0" alt={c.author.username} />
              <div className="bg-gray-50 rounded-xl px-4 py-3 flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">@{c.author.username}</span>
                  <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'MMM dd')}</span>
                </div>
                <p className="text-sm text-gray-700">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        <form className="space-y-3">
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            rows={3} placeholder="Share your thoughts..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-400 resize-none" />
          <button type="submit"
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
            Post Comment
          </button>
        </form>
      </section>
    </div>
  );
}
