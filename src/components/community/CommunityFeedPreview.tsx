import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { communityPosts } from "@/data/communityPosts";

export function CommunityFeedPreview() {
  return (
    <section id="community" className="py-10 laptop:py-14">
      <Container>
        <h2 className="text-[32px] font-bold laptop:text-[40px]">
          Обсуждают в сообществе
        </h2>

        <ul className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
          {communityPosts.map((post) => (
            <li
              key={post.id}
              className="rounded-[24px] border border-border bg-white p-6"
            >
              <div className="flex items-center gap-3">
                <span className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={post.avatar}
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </span>
                <span className="text-[14px] font-medium text-text-secondary">
                  {post.author}
                </span>
              </div>

              <p className="mt-4 text-[18px] font-bold leading-snug">
                {post.title}
              </p>

              <div className="mt-4 flex items-center gap-1.5 text-[14px] text-text-secondary">
                <MessageCircle size={16} aria-hidden="true" />
                {post.repliesCount} ответов
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
