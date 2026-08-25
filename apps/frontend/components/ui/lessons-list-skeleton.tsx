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
            "space-y-4 rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white p-5 shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]",
            variant,
          )}
          key={index}
        >
          <Skeleton className="h-44 w-full rounded-2xl bg-[#f0f0f0] dark:bg-[#18252d]" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/5 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
            <Skeleton className="h-5 w-4/5 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
            <Skeleton className="h-4 w-full rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
            <Skeleton className="h-4 w-4/5 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LessonsTableSkeleton({ rowCount = 6 }: LessonsTableSkeletonProps) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border-2 border-[#e5e5e5] bg-white shadow-sm dark:border-[#2b3940] dark:bg-[#131f24]">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
              <TableHead className="h-12 px-4">
                <Skeleton className="h-3.5 w-20 rounded-lg bg-[#e5e5e5] dark:bg-[#2b3940]" />
              </TableHead>
              <TableHead className="h-12 px-4">
                <Skeleton className="h-3.5 w-16 rounded-lg bg-[#e5e5e5] dark:bg-[#2b3940]" />
              </TableHead>
              <TableHead className="h-12 px-4">
                <Skeleton className="h-3.5 w-20 rounded-lg bg-[#e5e5e5] dark:bg-[#2b3940]" />
              </TableHead>
              <TableHead className="h-12 px-4">
                <Skeleton className="h-3.5 w-12 rounded-lg bg-[#e5e5e5] dark:bg-[#2b3940]" />
              </TableHead>
              <TableHead className="h-12 px-4">
                <Skeleton className="ml-auto h-3.5 w-16 rounded-lg bg-[#e5e5e5] dark:bg-[#2b3940]" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, index) => (
              <TableRow
                className="border-b border-[#e5e5e5] hover:bg-transparent dark:border-[#2b3940]"
                key={`admin-lessons-skeleton-${index}`}
              >
                <TableCell className="px-4 py-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-56 rounded-lg bg-[#f0f0f0] dark:bg-[#18252d]" />
                    <Skeleton className="h-3.5 w-72 rounded-lg bg-[#f0f0f0] dark:bg-[#18252d]" />
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-6 w-24 rounded-full bg-[#f0f0f0] dark:bg-[#18252d]" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-4 w-8 rounded-lg bg-[#f0f0f0] dark:bg-[#18252d]" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Skeleton className="h-6 w-16 rounded-full bg-[#f0f0f0] dark:bg-[#18252d]" />
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-16 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
                    <Skeleton className="h-8 w-16 rounded-xl bg-[#f0f0f0] dark:bg-[#18252d]" />
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
