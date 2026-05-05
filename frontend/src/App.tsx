import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { EndpointDetail } from "./pages/EndpointDetail";
import { RecentDiffs } from "./pages/RecentDiffs";

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/endpoints/:id" element={<EndpointDetail />} />
          <Route path="/diffs" element={<RecentDiffs />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
