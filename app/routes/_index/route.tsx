import { redirect } from "react-router";

export const loader = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  return redirect(`/boards/${y}/${m}/${d}`);
};
