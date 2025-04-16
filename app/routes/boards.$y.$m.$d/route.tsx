import { parseIntStr, parseStr } from "~/.server/validation";
import type { Route } from "./+types/route";
import { useFetcher, useLocation, useNavigate } from "react-router";
import { useReducer } from "react";
import * as s from "~/board";
import { Block } from "~/components/block";
import { db } from "~/.server/db";

import "./style.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

const dows = ["日", "月", "火", "水", "木", "金", "土"];

export const loader = async ({ params }: Route.LoaderArgs) => {
  const y = parseIntStr(params.y, {});
  const m = parseIntStr(params.m, {}) - 1;
  const d = parseIntStr(params.d, {});
  if (isNaN(new Date(y, m, d).getTime())) {
    throw new Response("Invalid date", { status: 400 });
  }

  const actions = await db.getActions(`${y}.${m + 1}.${d}`);
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
  const fd = await request.formData();
  const action = JSON.parse(parseStr(fd.get("action"), {}));
  await db.addAction(
    `${params.y}.${params.m}.${params.d}`,
    action as s.Actions
  );
};

function Home_({
  loaderData: { year, month, day, initialState },
}: Route.ComponentProps) {
  const now = new Date(year, month, day);
  const navigate = useNavigate();
  const [state, rawDispatch] = useReducer(s.reducer, initialState);
  const uploadFetcher = useFetcher();

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
          ![...e.target.classList].includes("p-index__layer")
        ) {
          return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        dispatch({
          type: "add-block",
          block: {
            id: crypto.randomUUID(),
            type: "text",
            text: "* test",
          },
          width: 100,
          height: 100,
          position: {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          },
        });
      }}
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
        fd.append("file", file);
        uploadFetcher
          .submit(fd, {
            method: "post",
            encType: "multipart/form-data",
            action: `/api/uploads`,
          })
          .catch((e) => {
            console.error(e);
            alert("Failed to upload file");
          })
          .then(() => {
            if (!uploadFetcher.data) return;
            const url: string = uploadFetcher.data.url;
            console.log(url);
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
                x: e.clientX,
                y: e.clientY,
              },
            });
          });
      }}
    >
      <div className="p-index__layer">
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

      <div className="p-index__today-block">
        <div className="today-block">
          <div className="today-block__year today-block__block">
            <div className="today-block__month-number">{now.getFullYear()}</div>
            <div className="today-block__unit">年</div>
          </div>

          <div className="today-block__month today-block__block">
            <div className="today-block__month-number">
              {now.getMonth() + 1}
            </div>
            <div className="today-block__unit">月</div>
          </div>
          <div className="today-block__date today-block__block">
            <div className="today-block__date-number">{now.getDate()}</div>
            <div className="today-block__unit">日</div>
          </div>
          <div className="today-block__day today-block__block">
            <div className="today-block__day-name">{dows[now.getDay()]}</div>
            <div className="today-block__unit">曜日</div>
          </div>
          <button
            className="today-block__today today-block__block"
            onClick={() => {
              const now = new Date();
              const y = now.getFullYear();
              const m = now.getMonth() + 1;
              const d = now.getDate();
              navigate(`/boards/${y}/${m}/${d}`);
            }}
          >
            <span className="material-icons today-block__today-icon">
              calendar_today
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home(props: Route.ComponentProps) {
  const { pathname } = useLocation();
  return <Home_ {...props} key={pathname} />;
}
