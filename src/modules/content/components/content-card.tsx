import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FrontmatterData } from "@/lib/content";
import Image from "next/image";
import Link from "next/link";
interface ContentCardProps {
  path: string;
  data: FrontmatterData;
}
const ContentCard = ({ data, path }: ContentCardProps) => {
  return (
    <Card className="w-full h-full flex justify-between bg-background ">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">{data.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="flex flex-col gap-1">
          {data.image && (
            <Image
              className="border-border border-2 rounded-base object-cover"
              src={data.image}
              alt={data.title!}
              width={0}
              height={200}
              sizes="100vw"
              style={{ width: "100%", height: "200px" }}
            />
          )}
          <div className="flex gap-2 flex-wrap">
            {data.tags?.map((tag) => (
              <Badge key={tag} variant="neutral">
                {tag}
              </Badge>
            ))}
          </div>
          <p>{data.description}</p>
        </CardDescription>
      </CardContent>
      <CardFooter className="flex flex-col">
        {data.repolink && (
          <div className="flex gap-2 w-full mb-2">
            {data.livedemo && (
              <Button asChild className="flex-1">
                <Link
                  href={data.livedemo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Live Demo
                </Link>
              </Button>
            )}
            <Button asChild className="flex-1">
              <Link
                href={data.repolink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Repository
              </Link>
            </Button>
          </div>
        )}

        <Button asChild className="w-full">
          <Link href={`${path.trimEnd().replace(/\.md$/, "")}`}>
            View {data.title}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ContentCard;
