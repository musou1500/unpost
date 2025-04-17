import { Editor } from "@tinymce/tinymce-react";
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type JSX,
  type ReactElement,
  type ReactNode,
} from "react";
import type * as board from "~/board";
import { useClientOnly } from "./client-only";

type BlockComponentProps<T extends board.Block> = {
  block: T;
  size: board.Size;
  position: board.Position;
  onAction: (e: board.Actions) => void;
};

const BlockRoot = ({
  block,
  position,
  size,
  onAction,
  children,
  className,
}: BlockComponentProps<board.Block> & {
  children: ReactNode;
  className?: string;
}) => {
  const [dragState, setDragState] = useState<{
    isResize: boolean;
    offset: { x: number; y: number };
    position: { x: number; y: number };
  } | null>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.currentTarget !== e.target) return;
      switch (e.key) {
        case "Delete":
        case "Backspace":
          onAction({
            type: "remove",
            blockId: block.id,
          });
          break;
        case "Escape":
          e.currentTarget.blur();
          break;
      }
    },
    [block, onAction]
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
      setDragState({
        isResize,
        offset: {
          // position relative to the left top corner of block
          x: e.clientX - rect.x,
          y: e.clientY - rect.y,
        },
        position: {
          x: e.clientX,
          y: e.clientY,
        },
      });
    }
  }, []);

  useEffect(() => {
    const onPointerUp = () => {
      if (dragState === null) return;
      if (dragState.isResize) {
        onAction({
          type: "resize",
          blockId: block.id,
          size: {
            width: dragState.position.x - position.x,
            height: dragState.position.y - position.y,
          },
        });
      } else {
        onAction({
          type: "move",
          blockId: block.id,
          position: {
            x: dragState.position.x - dragState.offset.x,
            y: dragState.position.y - dragState.offset.y,
          },
        });
      }
      setDragState(null);
    };

    const onPointerMove = (e: PointerEvent) => {
      setDragState((prev) => {
        if (prev === null) return null;
        return {
          ...prev,
          position: {
            x: e.clientX,
            y: e.clientY,
          },
        };
      });
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [
    block,
    onAction,
    position.x,
    position.y,
    size.width,
    size.height,
    dragState,
  ]);

  return (
    <div className="block-root">
      <div
        tabIndex={1}
        className={`block ${className ?? ""}`}
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
        {children}

        <div className="block__resizer"></div>
      </div>

      {dragState && (
        <div
          className="block__dragging"
          style={
            dragState.isResize
              ? {
                  left: position.x,
                  top: position.y,
                  width: dragState.position.x - position.x,
                  height: dragState.position.y - position.y,
                }
              : {
                  left: dragState.position.x - dragState.offset.x,
                  top: dragState.position.y - dragState.offset.y,
                  width: size.width,
                  height: size.height,
                }
          }
        ></div>
      )}
    </div>
  );
};

const ImageBlock = ({
  block,
  size,
  position,
  onAction,
}: BlockComponentProps<board.BlockImage>) => {
  return (
    <BlockRoot
      block={block}
      size={size}
      position={position}
      onAction={onAction}
      className="block-image"
    >
      <img
        src={block.url}
        alt=""
        className="block-image__image"
        style={{
          width: size.width,
          height: size.height,
        }}
        draggable={false}
      />
    </BlockRoot>
  );
};
const TextBlock = (props: BlockComponentProps<board.BlockText>) => {
  const isClient = useClientOnly();
  return (
    <BlockRoot {...props} className="block-text">
      {isClient ? (
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
          onEditorChange={(text) => {
            props.onAction({
              type: "set-text",
              text,
              blockId: props.block.id,
            });
          }}
          value={props.block.text}
        />
      ) : null}
    </BlockRoot>
  );
};

export const Block = ({
  block,
  ...props
}: BlockComponentProps<board.Block>): ReactElement => {
  switch (block.type) {
    case "text":
      return <TextBlock {...props} block={block} />;
    case "image":
      return <ImageBlock {...props} block={block} />;
    default:
      throw new Error(`Unknown block type`);
  }
};
