import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import "./styles.css";
import { AppProvider } from "@/lib/app";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import PropertyDetail from "@/pages/PropertyDetail";
import Account from "@/pages/Account";
import { About, Agents, Blog, BlogPost, Contact, EmiPage, Legal, NotFound, ProjectDetail, Projects, Saved } from "@/pages/Misc";

const PostProperty = lazy(() => import("@/pages/PostProperty"));
const AdminLayout = lazy(() => import("@/admin/Admin"));
const AdminLogin = lazy(() => import("@/admin/Admin").then((m) => ({ default: m.AdminLogin })));
const StaffProvider = lazy(() => import("@/admin/Admin").then((m) => ({ default: m.StaffProvider })));
const L = (name: string, file: "Pages" | "Pages2") => lazy(() => (file === "Pages" ? import("@/admin/Pages") : import("@/admin/Pages2")).then((m: any) => ({ default: m[name] })));
const Dashboard = L("Dashboard", "Pages"), AdminProperties = L("AdminProperties", "Pages"), AdminPropertyEdit = L("AdminPropertyEdit", "Pages"), AdminLeads = L("AdminLeads", "Pages");
const AdminProjects = L("AdminProjects", "Pages2"), AdminPosts = L("AdminPosts", "Pages2"), AdminUsers = L("AdminUsers", "Pages2"), AdminStaff = L("AdminStaff", "Pages2"), AdminSettings = L("AdminSettings", "Pages2");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <Suspense fallback={<div className="grid min-h-dvh place-items-center text-brand-700">Loading…</div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="search" element={<Search />} />
            <Route path="property/:slug" element={<PropertyDetail />} />
            <Route path="projects" element={<Projects />} />
            <Route path="project/:slug" element={<ProjectDetail />} />
            <Route path="post-property" element={<PostProperty />} />
            <Route path="post-property/:id" element={<PostProperty />} />
            <Route path="saved" element={<Saved />} />
            <Route path="account" element={<Account />} />
            <Route path="blog" element={<Blog />} />
            <Route path="blog/:slug" element={<BlogPost />} />
            <Route path="agents" element={<Agents />} />
            <Route path="emi-calculator" element={<EmiPage />} />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            <Route path="terms" element={<Legal kind="terms" />} />
            <Route path="privacy" element={<Legal kind="privacy" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="admin/login" element={<StaffProvider><AdminLogin /></StaffProvider>} />
          <Route path="admin" element={<StaffProvider><AdminLayout /></StaffProvider>}>
            <Route index element={<Dashboard />} />
            <Route path="properties" element={<AdminProperties />} />
            <Route path="properties/:id" element={<AdminPropertyEdit />} />
            <Route path="leads" element={<AdminLeads />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="posts" element={<AdminPosts />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="staff" element={<AdminStaff />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
        </Suspense>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
);
