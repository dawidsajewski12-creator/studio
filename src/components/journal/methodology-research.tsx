import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TestTube2 } from "lucide-react";
import { Separator } from "../ui/separator";
import { getPosts, type Post } from "@/lib/mdx";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { format } from 'date-fns';

function PostCard({ post }: { post: Post }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <CardTitle className="text-2xl font-bold text-primary">{post.title}</CardTitle>
          <Badge variant="secondary">{post.category}</Badge>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {format(new Date(post.date), 'MMMM yyyy')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground/80">{post.abstract}</p>
      </CardContent>
      <CardFooter>
        <Button variant="link" asChild className="p-0">
          <Link href={`/journal/${post.slug}`}>Read More &rarr;</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default async function MethodologyAndResearch() {
  const posts = getPosts();

  return (
    <div className="w-full max-w-screen-lg mx-auto p-4 sm:p-6 md:p-8 space-y-8">
       <Card className="bg-muted/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                    <TestTube2 className="text-primary" />
                    {siteConfig.methodology.title}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
                <p>
                    <strong>{siteConfig.methodology.ndsi.title}</strong><br/>
                    {siteConfig.methodology.ndsi.description}
                </p>
                 <p>
                    <strong>{siteConfig.methodology.ndci.title}</strong><br/>
                    {siteConfig.methodology.ndci.description}
                </p>
                <p>
                    <strong>{siteConfig.methodology.scl.title}</strong><br/>
                    {siteConfig.methodology.scl.description}
                </p>
            </CardContent>
        </Card>

      <Separator />

       <header>
          <h1 className="text-3xl md:text-4xl font-bold text-primary font-headline">{siteConfig.research.title}</h1>
          <p className="text-muted-foreground mt-1">{siteConfig.research.description}</p>
        </header>
      {posts.map((post) => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  );
}
