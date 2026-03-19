import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const studentSkeletonVariants = [
  "sm:col-span-2 xl:col-span-3",
  "xl:col-span-2",
  "xl:col-span-1",
  "xl:col-span-2",
  "sm:col-span-2 xl:col-span-3",
  "xl:col-span-1",
];

type LessonsTableSkeletonProps = {
  rowCount?: number;
};

export function LessonsGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-6">
      {studentSkeletonVariants.map((variant, index) => (
        <div
          className={cn(
            "space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-glass",
            variant,
          )}
          key={index}
        >
          <Skeleton className="h-44 w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LessonsTableSkeleton({ rowCount = 6 }: LessonsTableSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 rounded-2xl border border-primary/15 bg-white/65 p-4 md:max-w-sm">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-primary/15 bg-white/85 shadow-glass">
        <Table>
          <TableHeader>
            <TableRow className="border-primary/15 bg-primary/5 hover:bg-primary/5">
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3.5 w-20" />
              </TableHead>
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3.5 w-16" />
              </TableHead>
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3.5 w-20" />
              </TableHead>
              <TableHead className="h-11 px-4">
                <Skeleton className="h-3.5 w-12" />
              </TableHead>
              <TableHead className="h-11 px-4">
                <Skeleton className="ml-auto h-3.5 w-16" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, index) => (
              <TableRow
                className="border-primary/10 hover:bg-transparent"
                key={`admin-lessons-skeleton-${index}`}
              >
                <TableCell className="px-4 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3.5 w-72" />
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-6 w-24 rounded-full" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-6 w-16 rounded-full" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
