import { prisma } from "../lib/prisma.js";
import { HttpError } from "../lib/HttpError.js";
import { listKbQuery } from "../validators/kbSchema.js";

const articleSelect = {
    id: true,
    title: true,
    description: true,
    createdAt: true,
    updatedAt: true,
    author: { select: { name: true } },
};

const excerpt = (text, max = 200) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

// GET /api/kb?q=printer      (any logged-in user)
// The list sends a short excerpt; the full description comes from GET /api/kb/:id.
export async function listArticles(req, res) {
  const { q } = listKbQuery.parse(req.query);

  const articles = await prisma.kbArticle.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined,
    select: articleSelect,
    orderBy: { updatedAt: 'desc' },
  });

  res.json({
    articles: articles.map(({ description, ...rest }) => ({ ...rest, excerpt: excerpt(description) })),
  });
}

// GET /api/kb/:id            (any logged-in user)
export async function getArticle(req, res) {
  const article = await prisma.kbArticle.findUnique({
    where: { id: req.params.id },
    select: articleSelect,
  });
  if (!article) throw new HttpError(404, 'Article not found');
  res.json({ article });
}

// POST /api/kb               (admins only)
export async function createArticle(req, res) {
  const { title, description } = req.body;
  const article = await prisma.kbArticle.create({
    data: { title, description, authorId: req.user.id },
    select: articleSelect,
  });
  res.status(201).json({ article });
}

// PATCH /api/kb/:id          (admins only)  body: { title?, description? }
export async function updateArticle(req, res) {
  const article = await prisma.kbArticle.update({
    where: { id: req.params.id },
    data: req.body, // already cleaned by zod: only title and/or description
    select: articleSelect,
  });
  res.json({ article });
}

// DELETE /api/kb/:id         (admins only)
export async function deleteArticle(req, res) {
  await prisma.kbArticle.delete({ where: { id: req.params.id } });
  res.status(204).end();
}
