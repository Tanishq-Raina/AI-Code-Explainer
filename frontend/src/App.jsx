import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Practice from "./pages/Practice";
import Progress from "./pages/Progress";
import "./styles/globals.css";
import "./styles/layout.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [attempts, setAttempts] = useState([]);

  return (
    <div className="app-shell">
      <Sidebar activePage={activePage} setActivePage={setActivePage} />

      <main className="main-content">
        <Topbar />

        {activePage === "Dashboard" && (
          <Dashboard setActivePage={setActivePage} attempts={attempts} />
        )}
        {activePage === "Practice" && (
          <Practice attempts={attempts} setAttempts={setAttempts} />
        )}
        {activePage === "History" && <History attempts={attempts} />}
        {activePage === "Progress" && <Progress attempts={attempts} />}
      </main>
    </div>
  );
}

export default App;
