"use client";

import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ClientPagination } from "@/components/ui/client-pagination";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchStudentsSummary } from "@/lib/analytics-api";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";

type Props = {
  onSelectStudent: (studentId: string) => void;
};

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const mins = Math.floor(seconds / 60);
  if (mins < 60) {
    return `${mins} phút`;
  }

  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function formatRelativeTime(value: string | null): string {
  if (!value) {
    return "Chưa hoạt động";
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "Không xác định";
  }

  const diffMs = Date.now() - timestamp;
  if (diffMs < 60_000) {
    return "vừa xong";
  }

  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} ngày trước`;
  }

  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function scoreColorClass(score: number): string {
  if (score < 50) {
    return "text-[#ff4b4b]";
  }
  if (score < 80) {
    return "text-[#d97706] dark:text-[#fbbf24]";
  }
  return "text-[#46a302] dark:text-[#58cc02]";
}

function StudentsTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <TableRow className="border-b border-[#e5e5e5] dark:border-[#2b3940]" key={index}>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-40 rounded-lg" />
            <Skeleton className="mt-2 h-4 w-52 rounded-lg" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-12 rounded-lg" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-20 rounded-lg" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-16 rounded-lg" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-24 rounded-lg" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function StudentsAnalyticsTable({ onSelectStudent }: Props) {
  const studentsQuery = useQuery({
    queryKey: ["analytics", "students"],
    queryFn: fetchStudentsSummary,
    staleTime: 2 * 60 * 1000,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [sortKey, setSortKey] = useState<"score" | "duration" | "activity" | "default">(
    "default",
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredAndSorted = useMemo(() => {
    if (!studentsQuery.data) return [];

    let result = [...studentsQuery.data];
    if (searchQuery.trim() !== "") {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (student) =>
          student.fullName.toLowerCase().includes(lower) ||
          student.email.toLowerCase().includes(lower),
      );
    }

    if (scoreFilter !== "all") {
      result = result.filter((student) => {
        if (scoreFilter === "weak") return student.avgScore < 50;
        if (scoreFilter === "avg") return student.avgScore >= 50 && student.avgScore < 80;
        if (scoreFilter === "good") return student.avgScore >= 80;
        return true;
      });
    }

    if (sortKey !== "default") {
      result.sort((a, b) => {
        const valA =
          sortKey === "score"
            ? a.avgScore
            : sortKey === "duration"
              ? a.avgActiveTimeSeconds
              : a.lastActiveAt
                ? new Date(a.lastActiveAt).getTime()
                : 0;
        const valB =
          sortKey === "score"
            ? b.avgScore
            : sortKey === "duration"
              ? b.avgActiveTimeSeconds
              : b.lastActiveAt
                ? new Date(b.lastActiveAt).getTime()
                : 0;

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [studentsQuery.data, searchQuery, scoreFilter, sortKey, sortDirection]);

  const paginated = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSorted, currentPage]);

  return (
    <div className="rounded-[24px] border-2 border-[#e5e5e5] border-b-4 border-b-[#d4d4d4] bg-white shadow-sm dark:border-[#2b3940] dark:border-b-[#1c272d] dark:bg-[#131f24]">
      <div className="border-b-2 border-[#e5e5e5] p-5 dark:border-[#2b3940]">
        <h2 className="text-xl font-extrabold text-[#3c3c3c] dark:text-white">
          Hiệu suất học viên
        </h2>
      </div>

      <div className="p-0">
        {studentsQuery.isError ? (
          <div className="p-5">
            <p className="rounded-2xl border-2 border-[#ff4b4b]/40 bg-[#ffebee] p-3 text-xs font-extrabold text-[#ff4b4b] dark:bg-[#ff4b4b]/15">
              {getApiErrorMessage(studentsQuery.error)}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 border-b-2 border-[#e5e5e5] p-5 dark:border-[#2b3940] sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777777] dark:text-slate-400" />
              <Input
                className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] pl-10 text-sm font-bold text-[#3c3c3c] placeholder:text-[#a0a0a0] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Lọc email/tên..."
                value={searchQuery}
              />
            </div>
          </div>

          <div className="space-y-1.5 sm:w-[160px]">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
              Phân loại điểm
            </label>
            <Select
              onValueChange={(value) => {
                setScoreFilter(value);
                setCurrentPage(1);
              }}
              value={scoreFilter}
            >
              <SelectTrigger className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white">
                <SelectValue placeholder="Điểm" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
                <SelectItem value="all">Tất cả điểm</SelectItem>
                <SelectItem value="good">Tốt (≥ 80)</SelectItem>
                <SelectItem value="avg">Vừa (50-79)</SelectItem>
                <SelectItem value="weak">Yếu (&lt; 50)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 sm:w-[180px]">
            <label className="text-xs font-extrabold uppercase tracking-wider text-[#3c3c3c] dark:text-slate-300">
              Sắp xếp
            </label>
            <Select
              onValueChange={(value) => {
                const [key, direction] = value.split("-");
                setCurrentPage(1);

                if (key === "default") {
                  setSortKey("default");
                  setSortDirection("desc");
                  return;
                }

                if (
                  (key === "score" || key === "duration" || key === "activity") &&
                  (direction === "asc" || direction === "desc")
                ) {
                  setSortKey(key);
                  setSortDirection(direction);
                }
              }}
              value={`${sortKey}-${sortDirection}`}
            >
              <SelectTrigger className="h-11 rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7] text-sm font-bold text-[#3c3c3c] focus-visible:border-[#58cc02] focus-visible:ring-0 focus-visible:outline-none dark:border-[#2b3940] dark:bg-[#111b21] dark:text-white">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2 border-[#e5e5e5] bg-white dark:border-[#2b3940] dark:bg-[#131f24]">
                <SelectItem value="default-desc">Mặc định</SelectItem>
                <SelectItem value="score-desc">Điểm (Cao-Thấp)</SelectItem>
                <SelectItem value="score-asc">Điểm (Thấp-Cao)</SelectItem>
                <SelectItem value="duration-desc">TG nhiều nhất</SelectItem>
                <SelectItem value="activity-desc">Mới hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="min-w-[760px]">
            <TableHeader>
              <TableRow className="border-b-2 border-[#e5e5e5] bg-[#f7f7f7] hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:bg-[#111b21] dark:hover:bg-[#111b21]">
                <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Học viên
                </TableHead>
                <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Bài học đã làm
                </TableHead>
                <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Thời gian TB
                </TableHead>
                <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Điểm TB
                </TableHead>
                <TableHead className="h-12 px-4 text-xs font-extrabold uppercase tracking-wider text-[#777777] dark:text-slate-400">
                  Hoạt động cuối
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {studentsQuery.isLoading ? <StudentsTableSkeletonRows /> : null}

              {!studentsQuery.isLoading && filteredAndSorted.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell className="py-12 text-center text-sm font-bold text-[#777777] dark:text-slate-400" colSpan={5}>
                    Chưa có dữ liệu phân tích.
                  </TableCell>
                </TableRow>
              ) : null}

              {!studentsQuery.isLoading
                ? paginated.map((student) => (
                    <TableRow
                      className="cursor-pointer border-b border-[#e5e5e5] transition-colors hover:bg-[#f7f7f7] dark:border-[#2b3940] dark:hover:bg-[#18252d]"
                      key={student.id}
                      onClick={() => onSelectStudent(student.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onSelectStudent(student.id);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <TableCell className="px-4 py-4">
                        <p className="font-extrabold text-[#3c3c3c] dark:text-white">{student.fullName}</p>
                        <p className="mt-0.5 text-xs font-bold text-[#777777] dark:text-slate-400">{student.email}</p>
                      </TableCell>
                      <TableCell className="px-4 py-4 font-bold text-[#3c3c3c] dark:text-white">
                        {student.lessonsCompleted}
                      </TableCell>
                      <TableCell className="px-4 py-4 font-bold text-[#777777] dark:text-slate-300">
                        {formatDuration(Math.round(student.avgActiveTimeSeconds))}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <span className={cn("font-extrabold text-sm", scoreColorClass(student.avgScore))}>
                          {student.avgScore.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-xs font-bold text-[#777777] dark:text-slate-400">
                        {formatRelativeTime(student.lastActiveAt)}
                      </TableCell>
                    </TableRow>
                  ))
                : null}
            </TableBody>
          </Table>
        </div>

        <div className="p-4">
          <ClientPagination
            currentPage={currentPage}
            totalItems={filteredAndSorted.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
