import { Request, Response } from 'express';
import slugify from 'slugify';
import { prisma } from '../lib/prisma';

export const getPosts = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, tag, search } = req.query;
  const where: any = { published: true };
  if (tag) where.tags = { some: { slug: String(tag) } };
  if (search) where.OR = [
    { title: { contains: String(search), mode: 'insensitive' } },
    { content: { contains: String(search), mode: 'insensitive' } }
  ];

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where, skip: (+page - 1) * +limit, take: +limit,
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, username: true, avatar: true } }, tags: true, _count: { select: { comments: true } } }
    }),
    prisma.post.count({ where })
  ]);

  res.json({ posts, total, pages: Math.ceil(total / +limit) });
};

export const getPost = async (req: Request, res: Response) => {
  const post = await prisma.post.update({
    where: { slug: req.params.slug, published: true },
    data: { viewCount: { increment: 1 } },
    include: {
      author: { select: { id: true, username: true, avatar: true, bio: true } },
      tags: true,
      comments: { include: { author: { select: { id: true, username: true, avatar: true } } }, orderBy: { createdAt: 'asc' } }
    }
  });
  if (!post) return res.status(404).json({ message: 'Post not found' });
  res.json(post);
};

export const createPost = async (req: Request, res: Response) => {
  const { title, content, excerpt, coverImage, published, tags } = req.body;
  const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
  const post = await prisma.post.create({
    data: {
      title, content, excerpt, coverImage, published: !!published, slug,
      authorId: (req as any).userId,
      tags: { connectOrCreate: (tags as string[]).map(t => ({ where: { slug: slugify(t) }, create: { name: t, slug: slugify(t) } })) }
    },
    include: { tags: true }
  });
  res.status(201).json(post);
};

export const updatePost = async (req: Request, res: Response) => {
  const { title, content, excerpt, coverImage, published, tags } = req.body;
  const post = await prisma.post.update({
    where: { id: +req.params.id },
    data: {
      title, content, excerpt, coverImage, published,
      tags: { set: [], connectOrCreate: (tags as string[] || []).map(t => ({ where: { slug: slugify(t) }, create: { name: t, slug: slugify(t) } })) }
    },
    include: { tags: true }
  });
  res.json(post);
};

export const deletePost = async (req: Request, res: Response) => {
  await prisma.post.delete({ where: { id: +req.params.id } });
  res.json({ message: 'Deleted' });
};

export const addComment = async (req: Request, res: Response) => {
  const comment = await prisma.comment.create({
    data: { content: req.body.content, postId: +req.params.id, authorId: (req as any).userId },
    include: { author: { select: { id: true, username: true, avatar: true } } }
  });
  res.status(201).json(comment);
};
