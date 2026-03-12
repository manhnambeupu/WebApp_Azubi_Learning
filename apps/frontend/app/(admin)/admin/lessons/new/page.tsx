import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { LessonForm } from "@/components/lessons/lesson-form";
import { Button } from "@/components/ui/button";

export default function AdminCreateLessonPage() {
  return (
    <div className="space-y-6">
      <Button asChild size="sm" variant="outline">
        <Link href="/admin/dashboard">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách bài học
        </Link>
      </Button>

      <LessonForm mode="create" />
    </div>
  );
}
