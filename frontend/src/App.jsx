import { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import Progress from "./pages/Progress";
import Simulation from "./pages/Simulation";
import Study from "./pages/Study";
import VideoGeneration from "./pages/VideoGeneration";
import { problems } from "./data/problems";
import "./styles/theme.css";
import "./styles/globals.css";
import "./styles/layout.css";
import "./styles/video-gen.css";
import "./styles/video-player.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [attempts, setAttempts] = useState([]);
  const [selectedProblemId, setSelectedProblemId] = useState(problems[0].id);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  return (
    <div className={`app-shell ${isSidebarVisible ? "" : "sidebar-hidden"}`}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onToggle={() => setIsSidebarVisible((prev) => !prev)}
      />

      <main className="main-content">
        {!isSidebarVisible && (
          <button
            className="sidebar-toggle sidebar-toggle--floating"
            onClick={() => setIsSidebarVisible(true)}
            aria-label="Show sidebar"
            title="Show sidebar"
          >
            ☰
          </button>
        )}

        {activePage === "Dashboard" && (
          <Dashboard
            setActivePage={setActivePage}
            setSelectedProblemId={setSelectedProblemId}
          />
        )}
        {/* Practice stays mounted to preserve state; resets via useEffect when problem changes */}
        <div style={{ display: activePage === "Practice" ? "block" : "none" }}>
          <Practice
            attempts={attempts}
            setAttempts={setAttempts}
            selectedProblemId={selectedProblemId}
          />
        </div>
        {activePage === "Progress" && (
          <Progress
            setActivePage={setActivePage}
            setSelectedProblemId={setSelectedProblemId}
          />
        )}
        {activePage === "Simulator" && <Simulation />}
        {activePage === "Study" && (
          <Study
            setActivePage={setActivePage}
            setSelectedProblemId={setSelectedProblemId}
          />
        )}
        {/* Video Gen stays mounted to preserve state (code, output, video) */}
        <div style={{ display: activePage === "Video Gen" ? "block" : "none" }}>
          <VideoGeneration />
        </div>
      </main>
    </div>
  );
}

export default App;
