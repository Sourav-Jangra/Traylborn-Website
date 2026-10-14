import { SectionHeading } from "@/components/layout/section-heading";
import { CategoryCard } from "@/components/packages/category-card";
import { RichTitle } from "@/components/content/rich-title";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { categories } from "@/lib/config/categories";
import type { HeadingData } from "@/lib/content/types";
import { getPublishedPackages } from "@/server/packages";

export async function ExperienceCategories({ heading }: { heading: HeadingData }) {
  const packages = await getPublishedPackages();
  return (
    <section aria-labelledby="experience-heading" className="bg-sand-100 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow={heading.eyebrow || undefined}
          title={
            <span id="experience-heading">
              <RichTitle text={heading.title} accentClassName="text-pine-600" />
            </span>
          }
          description={heading.description || undefined}
        />
        <Stagger className="mt-12 grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3">
          {categories.map((c, i) => {
            const list = packages.filter((p) => p.category === c.slug);
            return (
              <StaggerItem key={c.slug}>
                <CategoryCard
                  category={c}
                  index={i}
                  count={list.length}
                  startingFrom={list.length ? Math.min(...list.map((p) => p.price)) : undefined}
                />
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
