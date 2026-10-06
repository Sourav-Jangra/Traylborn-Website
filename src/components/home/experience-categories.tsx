import { SectionHeading, Accent } from "@/components/layout/section-heading";
import { CategoryCard } from "@/components/packages/category-card";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { categories } from "@/lib/config/categories";
import { getPublishedPackages } from "@/server/packages";

export async function ExperienceCategories() {
  const packages = await getPublishedPackages();
  return (
    <section aria-labelledby="experience-heading" className="bg-sand-100 py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow="Explore by experience"
          title={
            <span id="experience-heading">
              Three ways to <Accent className="text-pine-600">find your trail</Accent>
            </span>
          }
          description="Whether you want to stand on a summit, drive over the world's highest passes, or simply breathe — there's a Traylborn journey for it."
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
