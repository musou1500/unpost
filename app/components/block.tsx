import { Editor } from "@tinymce/tinymce-react";
import { useCallback, useEffect, useRef } from "react";
import type { Block, Position, Size } from "~/board";

export interface BlockProps {
  blockId: string;
  block: Block;
  position: Position;
  size: Size;
  onChange: (e: { content: string; blockId: string }) => void;
  onRemove: (e: { blockId: string }) => void;
  onMove: (e: { blockId: string; position: Position }) => void;
  onResize: (e: { blockId: string; size: Size }) => void;
}

export const BlockText = ({
  blockId,
  block,
  size,
  position,
  onChange,
  onRemove,
  onMove,
  onResize,
}: BlockProps) => {
  const dragStateRef = useRef<{
    isResize: boolean;
    offset: { x: number; y: number };
  } | null>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.currentTarget !== e.target) return;
      switch (e.key) {
        case "Delete":
        case "Backspace":
          onRemove({
            blockId,
          });
          break;
        case "Escape":
          e.currentTarget.blur();
          break;
      }
    },
    [blockId, onRemove]
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const threshold = 10;
    const isResize =
      e.clientX > rect.right - threshold && e.clientY > rect.bottom - threshold;
    const isMove =
      !isResize &&
      (e.clientY < rect.top + threshold ||
        e.clientY > rect.bottom - threshold ||
        e.clientX < rect.left + threshold ||
        e.clientX > rect.right - threshold);
    if (isResize || isMove) {
      dragStateRef.current = {
        isResize,
        offset: {
          // position relative to the left top corner of block
          x: e.clientX - rect.x,
          y: e.clientY - rect.y,
        },
      };
    }
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      dragStateRef.current = null;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragStateRef.current === null) return;
      if (dragStateRef.current.isResize) {
        console.log(position.x, position.y, size.width, size.height);
        const width = e.clientX - position.x;
        const height = e.clientY - position.y;
        onResize({
          blockId,
          size: {
            width,
            height,
          },
        });
      } else {
        onMove({
          blockId,
          position: {
            x: e.clientX - dragStateRef.current.offset.x,
            y: e.clientY - dragStateRef.current.offset.y,
          },
        });
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    blockId,
    onMove,
    onResize,
    position.x,
    position.y,
    size.width,
    size.height,
  ]);

  return (
    <div
      tabIndex={1}
      className="block-text"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
      }}
      onKeyDown={onKeyDown}
      // https://bugzilla.mozilla.org/show_bug.cgi?id=505521
      onPointerDown={onPointerDown}
    >
      <Editor
        licenseKey="gpl"
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        inline
        init={{
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "preview",
            "wordcount",
          ],
          menubar: false,
          toolbar:
            "undo redo | fontfamily fontsize | link |" +
            "bold italic forecolor | alignleft aligncenter " +
            "alignright alignjustify | bullist numlist outdent indent | " +
            "removeformat",
        }}
        onEditorChange={(content) => {
          onChange({
            content,
            blockId,
          });
        }}
        value={block.text}
      />

      <div className="block-text__resizer"></div>
    </div>
  );
};
