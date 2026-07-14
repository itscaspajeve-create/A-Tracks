import { Plus, Tags } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryList } from "@/components/categories/category-list";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { getDb } from "@/lib/db";
import { getCategories } from "@/lib/queries";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories" };

export default function CategoriesPage() {
  requireAuth();
  const categories = getCategories();
  const counts: Record<number, number> = {};
  const rows = getDb()
    .prepare("SELECT category_id, COUNT(*) AS n FROM transactions WHERE category_id IS NOT NULL GROUP BY category_id")
    .all() as { category_id: number; n: number }[];
  for (const r of rows) counts[r.category_id] = r.n;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Add, rename or recolor — changes apply everywhere instantly"
      >
        <CategoryForm
          trigger={
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add category
            </Button>
          }
        />
      </PageHeader>

      {categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories" description="Add a category to start organizing your spending." />
      ) : (
        <div className="max-w-2xl">
          <CategoryList categories={categories} counts={counts} />
        </div>
      )}
    </>
  );
}
