import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import slugify from 'slugify';

const prisma = new PrismaClient();

export const getPosts = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, tag, search } = req.query;
  const where: any = { published: true };
  if (tag) where.tags = { some: { slug: tag as string } };
  if (search) where.OR = [
    { title: { contains: search as string, mode: 'insensitive' } },
    { excerpt: { contains: search as string, mode: 'insensitive' } },
  ];
  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where, skip: (+page - 1) * +limit, take: +limit,
      include: { author: { select: { id: true, name: true, avatar: true } }, tags: true,
        _count: { select: { comments: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.post.count({ where }),
  ]);
  res.json({ posts, total, page: +page, totalPages: Math.ceil(total / +limit) });
};

export const getPost = async (req: Request, res: Response) => {
  const post = await prisma.post.findUnique({
    where: { slug: req.params.slug },
    include: { author: { select: { id: true, name: true, avatar: true, bio: true } },
      tags: true, comments: { include: { author: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' } } },
  });
  if (!post) return res.status(404).json({ error: 'Post not found' });
  await prisma.post.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
  res.json(post);
};

export const createPost = async (req: Request, res: Response) => {
  const { title, content, excerpt, coverImage, published, tags } = req.body;
  const authorId = (req as any).userId;
  const slug = slugify(title, { lower: true, strict: true }) + '-' + Date.now();
  const wordCount = content.split(' ').length;
  const readTime = Math.ceil(wordCount / 200);
  const post = await prisma.post.create({
    data: { title, slug, content, excerpt, coverImage, published, authorId, readTime,
      tags: { connectOrCreate: tags.map((t: string) => ({
        where: { slug: slugify(t, { lower: true }) },
        create: { name: t, slug: slugify(t, { lower: true }) },
      })) } },
    include: { author: { select: { name: true } }, tags: true },
  });
  res.status(201).json(post);
};

export const updatePost = async (req: Request, res: Response) => {
  const { title, content, excerpt, coverImage, published, tags } = req.body;
  const post = await prisma.post.update({
    where: { id: +req.params.id },
    data: { title, content, excerpt, coverImage, published,
      tags: { set: [], connectOrCreate: tags?.map((t: string) => ({
        where: { slug: slugify(t, { lower: true }) },
        create: { name: t, slug: slugify(t, { lower: true }) },
      })) } },
    include: { tags: true },
  });
  res.json(post);
};

export const deletePost = async (req: Request, res: Response) => {
  await prisma.post.delete({ where: { id: +req.params.id } });
  res.status(204).send();
};

export const addComment = async (req: Request, res: Response) => {
  const comment = await prisma.comment.create({
    data: { content: req.body.content, postId: +req.params.id, authorId: (req as any).userId },
    include: { author: { select: { name: true, avatar: true } } },
  });
  res.status(201).json(comment);
};
