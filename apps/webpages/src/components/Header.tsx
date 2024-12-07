import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { trpc } from "../helpers/trpc.ts";
import UploadLink from "./UploadLink.tsx";

const Header: FC = () => {
  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: async () => {
      return await trpc.users.whoami.query();
    },
  });

  return (
    <header>
      <div className="navbar bg-base-100">
        <div className="flex-1">
          <a href="/" className="btn btn-ghost text-xl">
            Viz Tweak
          </a>
        </div>
        <div className="flex-none">
          <ul className="menu menu-horizontal px-1">
            <li>
              <UploadLink />
            </li>
            <li>
              <details>
                <summary>{user?.name ?? "Anonymous"}</summary>
                <ul className="bg-base-100 rounded-t-none p-2">
                  <li>
                    <Link to="/">Link 1</Link>
                  </li>
                  <li>
                    <Link to="/">Link 2</Link>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Header;
