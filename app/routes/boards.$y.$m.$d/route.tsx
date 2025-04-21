import { parseIntStr, parseStr } from "~/.server/validation";
import type { Route } from "./+types/route";
import { useFetcher, useLocation, useNavigate } from "react-router";
import { useReducer, useState } from "react";
import * as s from "~/board";
import { Block } from "~/components/block";
import { actionStore } from "~/.server";

import "./style.css";
import { auth } from "~/.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  await auth.authenticate(request);

  const y = parseIntStr(params.y, {});
  const m = parseIntStr(params.m, {}) - 1;
  const d = parseIntStr(params.d, {});
  if (isNaN(new Date(y, m, d).getTime())) {
    throw new Response("Invalid date", { status: 400 });
  }

  const actions = await actionStore.getActions(`${y}.${m + 1}.${d}`);
  const initialState = actions.reduce(
    (acc, action) => s.reducer(acc, action),
    s.initialState
  );

  return {
    year: y,
    month: m,
    day: d,
    initialState,
  };
};

export const action = async ({ params, request }: Route.ActionArgs) => {
  await auth.authenticate(request);

  const fd = await request.formData();
  const action = JSON.parse(parseStr(fd.get("action"), {}));
  await actionStore.addAction(
    `${params.y}.${params.m}.${params.d}`,
    action as s.Actions
  );
};

function Home_({
  loaderData: { year, month, day, initialState },
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const [state, rawDispatch] = useReducer(s.reducer, initialState);
  const uploadFetcher = useFetcher();
  const [mode, setMode] = useState<"mouse" | "text">("mouse");

  const dispatch = (action: s.Actions) => {
    rawDispatch(action);
    fetch(`/api/boards/${year}/${month + 1}/${day}`, {
      body: JSON.stringify({ action }),
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((e) => {
      console.error(e);
      alert("Failed to save action");
    });
  };

  return (
    <div
      className="p-index"
      onClick={(e) => {
        if (
          !(e.target instanceof HTMLElement) ||
          ![...e.target.classList].includes("p-index__board-inner") ||
          mode !== "text"
        ) {
          return;
        }
        const rect = e.target.getBoundingClientRect();
        dispatch({
          type: "add-block",
          block: {
            id: crypto.randomUUID(),
            type: "text",
            text: "",
          },
          width: 100,
          height: 100,
          position: {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          },
        });
      }}
    >
      <div className="p-index__header">
        <div className="p-index__pager">
          <button
            className="p-index__prev material-icons-outlined"
            onClick={() => {
              const date = new Date(year, month, day);
              date.setDate(date.getDate() - 1);
              navigate(
                `/boards/${date.getFullYear()}/${
                  date.getMonth() + 1
                }/${date.getDate()}`
              );
            }}
          >
            chevron_left
          </button>
          <input
            type="date"
            className="p-index__date"
            value={`${year}-${String(month + 1).padStart(2, "0")}-${String(
              day
            ).padStart(2, "0")}`}
            onChange={(e) => {
              const date = new Date(e.target.value);
              navigate(
                `/boards/${date.getFullYear()}/${
                  date.getMonth() + 1
                }/${date.getDate()}`
              );
            }}
          />
          <button
            className="p-index__next material-icons-outlined"
            onClick={() => {
              const date = new Date(year, month, day);
              date.setDate(date.getDate() + 1);
              navigate(
                `/boards/${date.getFullYear()}/${
                  date.getMonth() + 1
                }/${date.getDate()}`
              );
            }}
          >
            chevron_right
          </button>
        </div>

        <div className="p-index__modes">
          <button
            className={`p-index__mode material-icons ${
              mode === "mouse" ? "p-index__mode--active" : ""
            }`}
            onClick={() => {
              setMode("mouse");
            }}
          >
            mouse
          </button>
          <button
            className={`p-index__mode material-icons ${
              mode === "text" ? "p-index__mode--active" : ""
            }`}
            onClick={() => {
              setMode("text");
            }}
          >
            title
          </button>
        </div>
      </div>
      <div className="p-index__board">
        <div
          className="p-index__board-inner"
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (!(e.dataTransfer instanceof DataTransfer)) return;
            if (e.dataTransfer.files.length < 1) {
              return;
            }

            const file = e.dataTransfer.files[0];
            const fd = new FormData();
            const rect = e.currentTarget.getBoundingClientRect();
            fd.append("file", file);
            fetch(`/api/uploads`, {
              method: "POST",
              body: fd,
            })
              .then((res) => res.json())
              .then(({ url }) => {
                dispatch({
                  type: "add-block",
                  block: {
                    id: crypto.randomUUID(),
                    type: "image",
                    url,
                  },
                  width: 100,
                  height: 100,
                  position: {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  },
                });
              })
              .catch(() => alert("Failed to upload file"));
          }}
        >
          {Array.from(state.blockIds).map((blockId) => {
            const block = state.blocks.get(blockId);
            if (!block) return null;
            return (
              <Block
                key={blockId}
                block={block.block}
                size={block.size}
                position={block.position}
                onAction={(action) => dispatch(action)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Home(props: Route.ComponentProps) {
  const { pathname } = useLocation();
  return <Home_ {...props} key={pathname} />;
}
