"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { deleteCategory } from "@/lib/actions";
import type { Category } from "@/lib/types";
import { CategoryForm } from "./category-form";
import { CategoryIcon } from "@/components/shared/category-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

function CategoryRow({ category, txnCount }: { category: Category; txnCount: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: category.color }}
        >
          <CategoryIcon icon={category.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{category.name}</p>
          <p className="text-xs text-muted-foreground">
            {txnCount} transaction{txnCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <CategoryForm
          category={category}
          trigger={
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Edit category">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          }
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Delete category">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{category.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                {txnCount > 0
                  ? `${txnCount} transaction${txnCount === 1 ? "" : "s"} will become “Uncategorized” (nothing is deleted).`
                  : "This category has no transactions."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => startTransition(() => deleteCategory(category.id))}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export function CategoryList({
  categories,
  counts,
}: {
  categories: Category[];
  counts: Record<number, number>;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="divide-y p-0">
        {categories.map((c) => (
          <CategoryRow key={c.id} category={c} txnCount={counts[c.id] ?? 0} />
        ))}
      </CardContent>
    </Card>
  );
}
