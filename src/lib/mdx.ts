import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { z } from 'zod'

const postsDirectory = path.join(process.cwd(), 'content/posts')

const PostFrontmatterSchema = z.object({
  title: z.string(),
  date: z.string(),
  category: z.string(),
  abstract: z.string(),
})

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>

export interface Post extends PostFrontmatter {
  slug: string;
  content: string;
}

export function getPostBySlug(slug: string): Post {
  const realSlug = slug.replace(/\.mdx$/, '')
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  const frontmatter = PostFrontmatterSchema.parse(data)

  return { 
    slug: realSlug, 
    ...frontmatter, 
    content 
  }
}

export function getPosts(): Post[] {
  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.mdx$/, '')
    return getPostBySlug(slug)
  })

  return allPostsData.sort((a, b) => {
    if (new Date(a.date) < new Date(b.date)) {
      return 1
    } else {
      return -1
    }
  })
}
