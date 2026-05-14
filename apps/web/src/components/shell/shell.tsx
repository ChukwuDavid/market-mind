import { TopBar } from "./top-bar";
import { Sidebar } from "./sidebar";
import { MainArea } from "./main-area";
import { RightRail } from "./right-rail";

export function Shell() {
  return (
    <div className="flex h-screen flex-col bg-background">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <MainArea />
        <RightRail />
      </div>
    </div>
  );
}
