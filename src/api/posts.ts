import { z } from 'zod'

const postSchema = z.object({
  id: z.number(),
  userId: z.number(),
  title: z.string(),
  body: z.string(),
})

const postsSchema = z.array(postSchema)

export type Post = z.infer<typeof postSchema>

export async function fetchPosts(): Promise<Post[]> {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts?_limit=5')

  if (!response.ok) {
    throw new Error(`Unable to load posts (${response.status})`)
  }

  return postsSchema.parse(await response.json())
}
