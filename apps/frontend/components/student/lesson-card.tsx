import Link from "next/link";
import { BookOpenCheck, FileQuestion, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StudentLessonListItem } from "@/types";

type LessonCardProps = {
  lesson: StudentLessonListItem;
};

export function LessonCard({ lesson }: LessonCardProps) {
  return (
    <Link className="block h-full" href={`/student/lessons/${lesson.id}`}>
      <Card className="flex h-full flex-col overflow-hidden border-border/70 transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative h-40 w-full border-b bg-muted/40">
          {lesson.imageUrl ? (
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${lesson.imageUrl})` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
        </div>

        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{lesson.category.name}</Badge>
            <Badge
              className={
                lesson.isCompleted ? "bg-emerald-600 text-white hover:bg-emerald-600" : ""
              }
              variant={lesson.isCompleted ? "default" : "outline"}
            >
              {lesson.isCompleted ? "Đã hoàn thành" : "Chưa hoàn thành"}
            </Badge>
          </div>
          <CardTitle className="line-clamp-2 text-lg">{lesson.title}</CardTitle>
        </CardHeader>

        <CardContent className="mt-auto space-y-4">
          <p className="line-clamp-3 text-sm text-muted-foreground">{lesson.summary}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <FileQuestion className="h-4 w-4" />
              {lesson._count.questions} câu hỏi
            </span>
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <BookOpenCheck className="h-4 w-4" />
              Xem bài học
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
