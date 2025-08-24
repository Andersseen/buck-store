import { Routes } from "@angular/router";

const routes: Routes = [
  {
    path: "",
    redirectTo: "/bucket",
    pathMatch: "full",
  },
  {
    path: "setup",
    loadComponent: () => import("@app/pages/setup/setup.page"),

    title: "Storage Setup",
  },
  {
    path: "bucket",
    title: "Storage Bucket",
    loadComponent: () => import("@app/pages/bucket/bucket.page"),
  },
  {
    path: "**",
    redirectTo: "/bucket",
  },
];
export default routes;
