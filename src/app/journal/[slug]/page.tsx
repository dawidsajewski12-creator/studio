import { getPostBySlug, getPosts } from "@/lib/mdx";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// This helps Next.js to know which slugs exist at build time
export function generateStaticParams() {
  const posts = getPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
    try {
        const post = getPostBySlug(params.slug);
        return {
            title: post.title,
            description: post.abstract,
        };
    } catch (error) {
        return {
            title: "Post Not Found",
            description: "This post could not be found.",
        };
    }
}


export default async function PostPage({ params }: { params: { slug: string } }) {
  try {
    const post = getPostBySlug(params.slug);

    return (
        <div className="w-full max-w-screen-lg mx-auto p-4 sm:p-6 md:p-8">
            <Button variant="ghost" asChild className="mb-8">
                <Link href="/?view=research">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Research
                </Link>
            </Button>
            <article className="prose dark:prose-invert max-w-none">
                <h1 className="text-4xl font-extrabold tracking-tight text-primary mb-2">{post.title}</h1>
                <p className="text-muted-foreground text-lg">{format(new Date(post.date), 'MMMM d, yyyy')}</p>
                <div className="mt-8">
                    <MDXRemote source={post.content} />
                </div>
            </article>
        </div>
    );
  } catch (error) {
    notFound();
  }
}
