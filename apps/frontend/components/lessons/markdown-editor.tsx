"use client";

import MDEditor from "@uiw/react-md-editor";

type MarkdownEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        height={380}
        preview="live"
        value={value}
        onChange={(nextValue) => onChange(nextValue ?? "")}
      />
    </div>
  );
}
