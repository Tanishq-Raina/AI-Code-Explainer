================================================================================
        FRONTEND ARCHITECTURE AND IMPLEMENTATION DOCUMENTATION
        Adaptive AI-Based Java Programming Tutor — Codexa AI
================================================================================

Project Title   : Codexa AI — Adaptive AI-Based Java Programming Tutor
Component       : Frontend Client (Single-Page Application)
Framework       : React 19 with Vite 8
Styling         : Tailwind CSS 3 + Custom CSS Design System
State Mgmt      : Zustand 5 (global) + React useState/useEffect (local)
Code Editor     : Monaco Editor (VS Code engine)
Charts          : Recharts 2
Animations      : Framer Motion 12
Last Updated    : May 2026

================================================================================
1. INTRODUCTION AND SYSTEM OVERVIEW
================================================================================

The frontend of the Adaptive AI-Based Java Programming Tutor (branded as
"Codexa AI") is a modern single-page application that provides an immersive,
IDE-like learning environment for beginner Java students. It communicates
with a Flask backend via REST API calls and presents a rich set of
interactive features including:

  - A full-featured code editor with syntax highlighting and error markers
  - Progressive AI-generated hints with escalation controls
  - Real-time code execution with output display
  - A guided complexity simulation engine (time and space)
  - Comprehensive learning analytics dashboards
  - A structured 31-chapter Java study module with quizzes
  - Video generation from Java code execution

The application is designed as a dark-themed, responsive interface that
prioritises clarity, accessibility, and a distraction-free coding experience.

================================================================================
2. TECHNOLOGY STACK
================================================================================

2.1 Core Framework
-------------------
  - React 19.2        : UI component library (functional components + hooks)
  - Vite 8.0          : Build tool and development server (HMR, ESM-native)
  - JavaScript (ES2022): No TypeScript — plain JSX with modern syntax

2.2 Styling
------------
  - Tailwind CSS 3.4  : Utility-first CSS framework
  - PostCSS 8.5       : CSS processing pipeline
  - Autoprefixer      : Vendor prefix automation
  - Custom CSS        : Design system variables, layout, and component styles

2.3 State Management
---------------------
  - Zustand 5.0       : Lightweight global state (simulation playback store)
  - React hooks       : Local component state (useState, useEffect, useRef)
  - Custom hooks      : Shared data-fetching logic (useLearningSummary, etc.)

2.4 Key Libraries
------------------
  - @monaco-editor/react 4.7 : VS Code editor engine for code editing
  - axios 1.7               : HTTP client for backend API communication
  - recharts 2.15           : Charting library for analytics visualisations
  - framer-motion 12.23     : Animation library for UI transitions

2.5 Development Tools
----------------------
  - ESLint 9.39       : Code linting with React hooks plugin
  - Vite plugin React : Fast Refresh for development

================================================================================
3. APPLICATION ARCHITECTURE
================================================================================

3.1 High-Level Structure
--------------------------

  frontend/
  ├── index.html              # Entry HTML (Vite injects JS bundle)
  ├── package.json            # Dependencies and scripts
  ├── vite.config.js          # Vite configuration
  ├── tailwind.config.js      # Tailwind theme customisation
  ├── postcss.config.js       # PostCSS plugin chain
  ├── public/                 # Static assets (favicon, icons)
  └── src/
      ├── main.jsx            # React DOM root mount
      ├── App.jsx             # Root component (page routing + layout)
      ├── api/                # Backend API client
      ├── components/         # Reusable UI components
      │   ├── editor/         # Code editor components
      │   ├── layout/         # Sidebar, Topbar
      │   ├── panels/         # Output, Hint, Status panels
      │   ├── simulation/     # Simulation visualisation components
      │   └── study/          # Study module components
      ├── data/               # Static data (problems, topics, quizzes)
      ├── hooks/              # Custom React hooks
      ├── pages/              # Top-level page components
      ├── simulator/          # Complexity simulation engine
      ├── stores/             # Zustand global state stores
      ├── styles/             # CSS files (theme, layout, globals)
      └── utils/              # Utility functions

3.2 Routing Architecture
--------------------------
The application uses a simple state-based routing approach (no React Router).
The active page is stored in App.jsx's local state and toggled via the
Sidebar navigation. Pages are conditionally rendered:

  - "Dashboard"  -> <Dashboard />
  - "Practice"   -> <Practice />
  - "Progress"   -> <Progress />
  - "Simulator"  -> <Simulation />
  - "Study"      -> <Study />
  - "Video Gen"  -> <VideoGeneration />

3.3 Data Flow Architecture
----------------------------

  User Interaction
       |
       v
  Page Component (Practice, Dashboard, etc.)
       |
       v
  API Client (axios) ──────> Flask Backend (port 5000)
       |                              |
       v                              v
  Local State (useState)        MongoDB / LLM
       |
       v
  Child Components (Editor, Panels, Charts)

For the Simulation page, data flows through Zustand:

  User clicks "Run"
       |
       v
  API call to /api/parse-ast
       |
       v
  AST Adapter (transforms backend AST to simulator format)
       |
       v
  Time/Space Engine (builds complexity timeline)
       |
       v
  Zustand Store (simulationPlaybackStore)
       |
       v
  Playback Controller Hook (manages play/pause/step)
       |
       v
  Simulation UI Components (editor highlight, panels, charts)


================================================================================
4. PAGE DESCRIPTIONS
================================================================================

4.1 Dashboard (Dashboard.jsx)
-------------------------------
Purpose: Landing page providing an overview of the student's learning state,
quick access to problems, and motivational engagement elements.

Features:
  - Hero section with animated background orbs and code terminal mockup
  - Quick stats strip: Solved count, Current streak, Success rate, Topics mastered
  - Daily challenge card linking to a featured problem
  - Activity streak display with personal best
  - Calendar card showing coding consistency (active dates)
  - Topic overview cards with progress rings and accuracy percentages
  - Full problem catalog organised by topic with difficulty badges

Data Sources:
  - GET /api/learning-summary/demo_user (via useLearningSummary hook)
  - Static problem catalog (from data/problems.js)

4.2 Practice (Practice.jsx)
------------------------------
Purpose: The primary coding workspace where students write, run, and submit
Java code against structured problems with AI-powered hint support.

Layout:
  - Left pane: Problem description with guidance, examples, constraints
  - Right pane: Code editor + output panel + hint modal

Features:
  - Monaco Editor with Java syntax highlighting and error markers
  - Run button: Lightweight execution (no mastery signal)
  - Submit button: Scored attempt with output validation
  - Reset button: Restore starter code
  - Resizable editor (width and height via drag handles)
  - Fullscreen editor mode (Escape to exit)
  - Verdict banner: Accepted / Wrong Output / Error
  - Output panel with execution results
  - Hint modal with progressive revelation (Level 1 -> 2 -> 3)
  - Hint usage tracking (feeds hint-weighted success rate)

Output Validation:
  When submitting, the frontend compares actual output against expected
  output using line-wise whitespace normalization. This determines the
  verdict banner independently of the backend's resolved flag.

Hint Escalation:
  The HintPanel component tracks the highest hint level revealed per
  session. This value is sent to the backend on submit so the
  hint-weighted success rate properly discounts heavily-hinted wins.

4.3 Progress (Progress.jsx)
------------------------------
Purpose: Comprehensive learning analytics dashboard showing the student's
performance across all dimensions.

Sections:
  - Codexa Insight banner: AI-generated personalised recommendation
  - Stat grid: Total submissions, Solved count, Current streak, Topics mastered
  - Topic Mastery: Per-topic accuracy bars with success/attempt counts
  - Error Breakdown: Horizontal bar chart of error types by frequency
  - Encouragement cards: Hint-usage-based motivational messages with status badges
  - Recent Activity feed: Latest submissions with relative timestamps

Data Sources:
  - GET /api/learning-summary/demo_user (comprehensive analytics payload)
  - Frontend utility: deriveInsight() normalises backend insight structure

Mastery Calculation:
  A catalog topic is "mastered" when the user has solved every problem
  in that topic at least once. The frontend intersects the backend's
  solved_problem_ids against the local problem catalog.

4.4 Simulation (Simulation.jsx)
---------------------------------
Purpose: Interactive guided walkthrough of time and space complexity
analysis for Java and Python code.

Features:
  - Dual mode: Time Complexity / Space Complexity (toggle switch)
  - Language selector: Java / Python
  - Monaco Editor with line-by-line highlighting during playback
  - Playback controls: Play/Pause, Step Forward/Backward, Speed control
  - Floating explanation bubbles with contextual narration
  - Final complexity overlay (e.g., "O(n log n)")
  - Space mode panels: Stack Panel, Heap Panel, Space Growth Chart
  - Sound effects on step transitions (optional, toggleable)
  - Configurable timing: lead delay, bubble read pause, playback speed

Architecture:
  1. User writes code in the editor
  2. "Run" sends code to POST /api/parse-ast (backend tree-sitter parsing)
  3. AST Adapter transforms backend AST into simulator-compatible format
  4. Time/Space Engine builds a step-by-step complexity timeline
  5. Zustand store holds the timeline and current playback position
  6. Playback Controller hook manages auto-advance with configurable timing
  7. UI components react to store changes (highlighted lines, panels, bubbles)

4.5 Study (Study.jsx)
-----------------------
Purpose: Structured 31-chapter Java study module covering the language
from history through advanced topics, with code examples and quizzes.

Features:
  - Sidebar navigation with Part I (Ch 1-17) and Part II (Ch 18-31)
  - Chapter progress tracking (visited chapters persisted to localStorage)
  - Section-by-section content display with prose and code examples
  - Syntax-highlighted code blocks (StudyCodeBlock component)
  - Per-chapter quizzes (StudyQuiz component)
  - Previous/Next chapter navigation
  - "Practice this Topic" button linking to relevant problems
  - Loading and error states with retry capability

Content Strategy:
  - Primary: Fetched from backend GET /api/study/topic/<chapter_id>
  - Fallback: Local studyFallbackContent.js if backend returns generic content
  - Chapters 4-31 have curated static content on the backend

4.6 Video Generation (VideoGeneration.jsx)
--------------------------------------------
Purpose: Write Java code, execute it, and generate animated execution
videos rendered by an external Manim-based rendering service.

Features:
  - Code editor with filename tab (syncs class name with filename)
  - Run button to verify code compiles and executes successfully
  - Quality selector: Low (480p), Medium (720p), High (1080p), Production (1440p)
  - Generate button (enabled only after successful run)
  - Progress tracking with stage display and percentage bar
  - Video player with playback controls
  - Error handling for generation failures

Architecture:
  - Code execution: POST /api/submit-code (Flask backend)
  - Video rendering: POST /render-api/render (external Manim service, port 4000)
  - Job polling: GET /render-api/jobs/<id> (1.5s interval)
  - Video playback: Direct URL to rendered video file

================================================================================
5. COMPONENT ARCHITECTURE
================================================================================

5.1 Editor Components (src/components/editor/)
------------------------------------------------

CodeEditor.jsx
  - Wraps @monaco-editor/react with Java language configuration
  - VS Dark theme with JetBrains Mono font
  - Real-time error marker display (parses javac-style error messages)
  - Configurable height, read-only mode, fullscreen support
  - Clears error markers on user edit

EditorToolbar.jsx
  - Run, Submit, Reset, Hint, and Fullscreen buttons
  - Loading spinners during execution
  - Disabled states during busy operations

ActionBar.jsx
  - Additional editor action controls

5.2 Layout Components (src/components/layout/)
------------------------------------------------

Sidebar.jsx
  - Fixed left navigation panel with brand logo
  - Six navigation items: Dashboard, Practice, Progress, Simulator, Study, Video Gen
  - Active page highlighting
  - Collapsible (toggle button)
  - Footer with AI status indicator and attribution

Topbar.jsx
  - Top navigation bar (used in specific layouts)

5.3 Panel Components (src/components/panels/)
-----------------------------------------------

HintPanel.jsx
  - Modal overlay with progressive hint revelation
  - Displays: problem_summary, why, hint_1/2/3, learning_tip
  - "Need more help?" button to escalate hint level
  - Level badge showing current/max (e.g., "Level 2 / 3")
  - Escape key to close
  - Notifies parent of highest hint level revealed

OutputPanel.jsx
  - Displays execution output (stdout + stderr)
  - Status indicator
  - Error line highlighting

StatusCard.jsx
  - Reusable stat display card

5.4 Simulation Components (src/components/simulation/)
-------------------------------------------------------

SimulationEditor.jsx
  - Monaco Editor configured for simulation playback
  - Line highlighting with type-based colours (loop, contribution, executing)
  - Floating explanation bubble with configurable positioning and timing

PlaybackController.jsx
  - Transport controls: Play/Pause, Step Back, Step Forward
  - Speed selector with multiple presets
  - Timing controls: Lead delay, Bubble read pause
  - Sound toggle
  - Step counter and current step label

StackPanel.jsx
  - Visualises the call stack during space complexity simulation
  - Shows function frames being pushed/popped

HeapPanel.jsx
  - Visualises heap allocations (arrays, objects)
  - Shows complexity contribution per allocation
  - Displays combined expression and contribution items

SpaceGrowthChart.jsx
  - Animated chart showing memory growth over simulation steps
  - Adapts curve shape based on complexity type (O(1), O(n), O(n^2))

ComplexityPanel.jsx
  - Displays current complexity calculation state

AnimatedLoopBoxes.jsx
  - Visual representation of loop iterations

FloatingExplanationPanel.jsx
  - Contextual explanation overlay during simulation

5.5 Study Components (src/components/study/)
----------------------------------------------

StudyCodeBlock.jsx
  - Syntax-highlighted Java code display for study sections
  - Read-only presentation format

StudyQuiz.jsx
  - Interactive quiz component for chapter comprehension testing
  - Multiple choice questions with feedback

5.6 Standalone Components
---------------------------

CalendarCard.jsx
  - Activity calendar showing coding days (similar to GitHub contribution graph)
  - Highlights dates with submissions

ProblemGuidance.jsx
  - Problem description panel for the Practice page
  - Shows title, description, examples, constraints, tips

VideoPlayer.jsx
  - HTML5 video player for generated animation playback

================================================================================
6. SIMULATION ENGINE (src/simulator/)
================================================================================

The simulation engine is a client-side complexity analysis system that
provides step-by-step guided walkthroughs of time and space complexity
for Java and Python code.

6.1 Architecture Overview
---------------------------

  Source Code (Java/Python)
       |
       v
  Backend AST Parser (tree-sitter via /api/parse-ast)
       |
       v
  AST Adapter (astAdapter.js) — transforms to simulator format
       |
       v
  Time Engine (timeEngine.js) OR Space Engine (spaceEngine.js)
       |
       v
  Complexity Timeline (ordered steps with metadata)
       |
       v
  Playback Store (Zustand) + Controller Hook
       |
       v
  UI Components (editor highlights, panels, bubbles)

6.2 Module Descriptions
--------------------------

astAdapter.js
  Purpose: Transform the backend's tree-sitter AST into a normalised
  program representation that the simulation engines can consume.

  Capabilities:
    - Parses function declarations, loops, conditions, assignments
    - Extracts call expressions from code snippets
    - Handles Java and Python AST node types
    - Produces a language-agnostic { type: "Program", body: [...] } structure

timeEngine.js
  Purpose: Build a time complexity analysis timeline with step-by-step
  explanations of how each code construct contributes to overall complexity.

  Features:
    - Identifies loops and their iteration counts
    - Detects nested loops and multiplicative complexity
    - Recognises recursive calls
    - Calculates per-construct contributions
    - Produces final Big-O result with formula explanation
    - Generates contextual bubble messages for each step

spaceEngine.js
  Purpose: Build a space complexity analysis timeline tracking memory
  allocations through code execution.

  Features:
    - Tracks stack frame pushes/pops for function calls
    - Identifies array allocations (1D -> O(n), 2D -> O(n^2))
    - Detects recursive stack growth
    - Classifies variable declarations as O(1)
    - Combines contributions and identifies dominant term
    - Produces final space complexity with contribution breakdown

simulationEngine.js
  Purpose: Core execution simulation (step-by-step code execution trace).

timeComplexityVisualizer.js
  Purpose: Builds the visual timeline for time complexity with loop boxes,
  calculation steps, and final result display.

complexityBuilder.js
  Purpose: Constructs incremental complexity calculation steps for the UI.

executionContext.js
  Purpose: Manages execution state during simulation.

memoryTracker.js
  Purpose: Tracks memory allocations during simulation.

operationCounter.js
  Purpose: Counts operations for complexity analysis.

statementHandlers.js
  Purpose: Handles individual statement types during simulation.

expressionEvaluator.js
  Purpose: Evaluates expressions during simulation execution.

6.3 Playback System
---------------------

The playback system uses a Zustand store (simulationPlaybackStore.js) that
maintains:
  - steps[]              : Array of playback steps with line numbers and memory state
  - complexityTimeline   : Full timeline with metadata and final complexity
  - currentIndex         : Current position in the timeline
  - isPlaying            : Auto-advance state
  - speed                : Playback speed multiplier (0.5x to 3x)
  - lineToBubbleDelayMs  : Delay before showing explanation bubble
  - bubbleReadPauseMs    : How long the bubble stays visible
  - soundEnabled         : Audio feedback on step transitions

The useSimulationPlaybackController hook wraps the store and adds:
  - Auto-advance timer (setInterval based on speed and timing settings)
  - Auto-play on simulation load (when requested)
  - Audio feedback via Web Audio API (triangle wave tick sound)

================================================================================
7. DATA LAYER
================================================================================

7.1 API Client (src/api/client.js)
------------------------------------
Centralised axios instance configured for the Flask backend:
  - Base URL: http://localhost:5000/api
  - Timeout: 45 seconds
  - Response unwrapping: extracts .data.data from envelope

Exported Functions:
  - submitCode(payload)              : POST /api/submit-code
  - requestHint(payload)             : POST /api/request-hint
  - parseCodeToStructuredAst(payload): POST /api/parse-ast
  - getLearningSummary(userId)       : GET /api/learning-summary/<userId>
  - getStudyTopicContent(chapterId)  : GET /api/study/topic/<chapterId>
  - submitFeedback(payload)          : POST /api/feedback
  - checkHealth()                    : GET /api/health

7.2 Custom Hooks
------------------

useLearningSummary(userId)
  - Fetches learning analytics from the backend
  - Returns: { summary, status, reload }
  - Status machine: 'loading' -> 'ready' | 'error'
  - Stale-response guard via monotonic request ID
  - Shared by Dashboard and Progress pages

useStudyContent(chapterId)
  - Fetches study chapter content from the backend
  - Falls back to local content if backend returns generic/placeholder data
  - Returns: { content, status, reload }

useSimulationPlaybackController()
  - Wraps Zustand store with playback logic
  - Manages auto-advance timer, sound effects, auto-play requests
  - Returns full playback control interface

7.3 Static Data (src/data/)
-----------------------------

problems.js
  - 24 Java programming problems
  - 4 topics: Java Basics, Conditions, Loops, Arrays
  - 6 problems per topic (2 Easy, 2 Medium, 2 Hard)
  - Each problem includes: id, title, topic, difficulty, description,
    examples, constraints, starterCode, expectedOutput, beginnerTips

studyTopics.js
  - 31 chapter definitions (Part I: Ch 1-17, Part II: Ch 18-31)
  - Each entry: id, part, chapter, title, shortTitle, topic, bookPage, sections[]

studyQuizzes.js
  - Per-chapter quiz questions for comprehension testing

studyFallbackContent.js
  - Local fallback content for study chapters
  - Used when backend returns generic/placeholder content

================================================================================
8. STYLING AND DESIGN SYSTEM
================================================================================

8.1 Design Philosophy
-----------------------
  - Dark theme optimised for extended coding sessions
  - High contrast text on dark backgrounds for readability
  - Accent colours: Cyan (primary), Purple, Pink, Yellow (topic-specific)
  - Consistent spacing and border-radius throughout
  - Smooth transitions and micro-animations for feedback

8.2 CSS Architecture
----------------------

theme.css
  - CSS custom properties (design tokens)
  - Colour palette, spacing scale, typography, shadows
  - Transition timing functions

globals.css
  - Base element styles, reset
  - Component classes: cards, buttons, badges, progress bars
  - Page-specific styles: dashboard, practice, progress, study

layout.css
  - App shell grid layout
  - Sidebar styles
  - Responsive breakpoints
  - Workspace layout (Practice page split pane)

tailwind.css
  - Tailwind base, components, utilities layers
  - Used primarily in the Simulation page

video-gen.css / video-player.css
  - Video Generation page specific styles

8.3 Responsive Design
-----------------------
  - Sidebar collapses on narrow viewports
  - Practice page switches from split to stacked layout below 1100px
  - Editor resize handles disabled on mobile
  - Cards and grids adapt to available width

================================================================================
9. STATE MANAGEMENT PATTERNS
================================================================================

9.1 Local State (useState)
----------------------------
Used for: Page-level UI state, form inputs, loading flags, modal visibility

Examples:
  - activePage in App.jsx (current page selection)
  - code, status, output in Practice.jsx (editor state)
  - hintLevel in HintPanel.jsx (current hint revelation)

9.2 Global State (Zustand)
-----------------------------
Used for: Complex shared state that multiple components need to read/write

simulationPlaybackStore.js manages:
  - Simulation timeline data
  - Playback position and controls
  - Derived state (current step, active line, complexity state)
  - Actions (play, pause, step, advance, reset, load)

Design: Single store with computed derived state recalculated on every
index change, avoiding stale references between components.

9.3 Server State (Custom Hooks)
---------------------------------
Used for: Data fetched from the backend with loading/error/ready lifecycle

Pattern:
  - useEffect triggers fetch on mount or dependency change
  - Cancelled flag prevents stale responses from racing setState
  - requestId counter enables manual reload without unmounting
  - Returns { data, status, reload } tuple

================================================================================
10. API INTEGRATION
================================================================================

10.1 Backend Communication
----------------------------
All API calls go through the centralised axios instance in api/client.js.
The backend returns a consistent envelope:
  { success: boolean, data: {...}, error: {...} | null }

The client unwraps .data.data so page components receive the raw payload.

10.2 Error Handling Strategy
------------------------------
  - Network errors: Caught in try/catch, displayed as connection failure messages
  - Backend errors: Parsed from error envelope, shown in UI banners
  - Timeout: 45-second axios timeout with user-friendly message
  - Retry: Manual retry buttons on error states (reload function from hooks)

10.3 Request Payloads
-----------------------

Submit Code (Practice page):
  {
    user_id: "demo_user",
    code: <editor content>,
    submission_type: "run" | "submit",
    problem_id: <int>,
    problem_title: <string>,
    problem_topic: <string>,
    problem_difficulty: "Easy" | "Medium" | "Hard",
    hints_used: <int>,
    expected_output: <string> (submit only),
    question_context: { title, topic, description, constraints, examples }
  }

Parse AST (Simulation page):
  {
    language: "java" | "python",
    code: <editor content>
  }

================================================================================
11. PROBLEM CATALOG
================================================================================

The problem catalog contains 24 structured Java programming problems
designed for progressive difficulty within each topic:

Topic           | Easy          | Medium        | Hard
----------------|---------------|---------------|------------------
Java Basics     | Hello Codexa  | Area of Circle| Simple Interest
                | Swap Variables| Celsius Conv  | Reverse String
Conditions      | Even or Odd   | Grade Calc    | Largest of Three
                | Pos/Neg/Zero  | Leap Year     | Quadratic Roots
Loops           | Sum of N      | Mult Table    | Fibonacci Series
                | Factorial     | Count Digits  | Prime Check
Arrays          | Print Array   | Max in Array  | Rotate Array
                | Sum of Array  | Count Evens   | Second Largest

Each problem includes:
  - Starter code template with class Main and main method
  - Expected output for automated verdict checking
  - Multiple examples with explanations
  - Constraints and follow-up challenges
  - Beginner tips for scaffolded learning

================================================================================
12. STUDY MODULE
================================================================================

The Study module provides structured Java learning content across 31
chapters, organised into two parts:

Part I (Chapters 1-17): Language Fundamentals
  - History and Evolution of Java
  - Overview of Java (OOP concepts)
  - Data Types, Variables, and Arrays
  - Operators
  - Control Statements
  - Introducing Classes
  - Methods and Classes (deeper)
  - Inheritance
  - Packages and Interfaces
  - Exception Handling
  - Multithreaded Programming
  - Enumerations, Autoboxing, Annotations
  - I/O and Try-with-Resources
  - Generics
  - Lambda Expressions
  - Modules
  - Modern Java Features (Records, Sealed Classes)

Part II (Chapters 18-31): Standard Library and Advanced Topics
  - String Handling
  - Exploring java.lang
  - Collections Framework
  - Utility Classes
  - java.io
  - NIO
  - Networking
  - Event Handling
  - AWT Basics
  - AWT Controls
  - Images
  - Concurrency Utilities
  - Stream API
  - Regular Expressions

Each chapter contains 5-8 sections with:
  - Conceptual prose explanation
  - Compilable Java code examples
  - Interactive quiz questions

================================================================================
13. USER EXPERIENCE FEATURES
================================================================================

13.1 Progressive Hint System
  - Hints revealed one level at a time (student controls escalation)
  - Visual level indicator (Level 1/3, Level 2/3, Level 3/3)
  - "Need more help?" button for explicit escalation
  - Hint usage tracked and penalised in success rate calculation

13.2 Verdict System
  - Immediate feedback after Submit: Accepted / Wrong Output / Error
  - Colour-coded banners (green/yellow/red)
  - Contextual messages explaining the verdict

13.3 Editor Features
  - Syntax highlighting (Java via Monaco)
  - Real-time error markers from javac output
  - Line-level error annotations
  - Resizable editor (drag handles for width and height)
  - Fullscreen mode with Escape to exit
  - Read-only during execution

13.4 Activity Tracking
  - Calendar card showing active coding days
  - Streak counter (current and personal best)
  - Recent activity feed with relative timestamps
  - Per-topic accuracy tracking with progress bars

13.5 Simulation Walkthrough
  - Step-by-step guided complexity analysis
  - Contextual explanations at each step
  - Visual memory state (stack frames, heap allocations)
  - Animated growth charts
  - Configurable playback speed and timing
  - Optional audio feedback

================================================================================
14. BUILD AND DEVELOPMENT
================================================================================

14.1 Development Server
-------------------------
  npm run dev
  -> Starts Vite dev server at http://localhost:5173
  -> Hot Module Replacement (HMR) for instant updates
  -> Proxies API calls to Flask backend at port 5000

14.2 Production Build
-----------------------
  npm run build
  -> Outputs optimised bundle to frontend/dist/
  -> Tree-shaking, code splitting, minification
  -> Static assets with content hashes for caching

14.3 Preview Production Build
-------------------------------
  npm run preview
  -> Serves the dist/ folder locally for testing

14.4 Linting
--------------
  npm run lint
  -> ESLint with React hooks and React Refresh plugins

14.5 Prerequisites
--------------------
  - Node.js 18+
  - npm (comes with Node.js)
  - Flask backend running on port 5000 (for API calls)

14.6 Installation
-------------------
  cd frontend
  npm install
  npm run dev

================================================================================
15. FILE LISTING AND RESPONSIBILITIES
================================================================================

File/Directory                              | Responsibility
--------------------------------------------|---------------------------------------
src/App.jsx                                 | Root component, page routing
src/main.jsx                                | React DOM mount point
src/api/client.js                           | Backend API communication layer
src/pages/Dashboard.jsx                     | Landing page with stats and catalog
src/pages/Practice.jsx                      | Code editor workspace
src/pages/Progress.jsx                      | Learning analytics dashboard
src/pages/Simulation.jsx                    | Complexity simulation walkthrough
src/pages/Study.jsx                         | 31-chapter study module
src/pages/VideoGeneration.jsx               | Video generation from Java code
src/pages/History.jsx                       | Submission history (legacy)
src/components/editor/CodeEditor.jsx        | Monaco Editor wrapper
src/components/editor/EditorToolbar.jsx     | Editor action buttons
src/components/editor/ActionBar.jsx         | Additional editor actions
src/components/layout/Sidebar.jsx           | Navigation sidebar
src/components/layout/Topbar.jsx            | Top navigation bar
src/components/panels/HintPanel.jsx         | Progressive hint modal
src/components/panels/OutputPanel.jsx       | Execution output display
src/components/panels/StatusCard.jsx        | Stat display card
src/components/simulation/SimulationEditor  | Simulation code editor with highlights
src/components/simulation/PlaybackController| Transport and timing controls
src/components/simulation/StackPanel.jsx    | Call stack visualisation
src/components/simulation/HeapPanel.jsx     | Heap allocation visualisation
src/components/simulation/SpaceGrowthChart  | Memory growth chart
src/components/simulation/ComplexityPanel   | Complexity calculation display
src/components/simulation/AnimatedLoopBoxes | Loop iteration visualisation
src/components/simulation/FloatingExplPanel | Contextual explanation overlay
src/components/study/StudyCodeBlock.jsx     | Syntax-highlighted code display
src/components/study/StudyQuiz.jsx          | Chapter quiz component
src/components/CalendarCard.jsx             | Activity calendar
src/components/ProblemGuidance.jsx          | Problem description panel
src/components/VideoPlayer.jsx              | Video playback component
src/simulator/astAdapter.js                 | Backend AST to simulator format
src/simulator/timeEngine.js                 | Time complexity engine
src/simulator/spaceEngine.js                | Space complexity engine
src/simulator/simulationEngine.js           | Core execution simulation
src/simulator/timeComplexityVisualizer.js   | Time complexity timeline builder
src/simulator/complexityBuilder.js          | Incremental complexity steps
src/simulator/executionContext.js           | Execution state management
src/simulator/memoryTracker.js              | Memory allocation tracking
src/simulator/operationCounter.js           | Operation counting
src/simulator/statementHandlers.js          | Statement type handlers
src/simulator/expressionEvaluator.js        | Expression evaluation
src/stores/simulationPlaybackStore.js       | Zustand playback state
src/hooks/useLearningSummary.js             | Learning data fetching hook
src/hooks/useStudyContent.js                | Study content fetching hook
src/hooks/useSimulationPlaybackController   | Playback control hook
src/data/problems.js                        | 24-problem catalog
src/data/studyTopics.js                     | 31-chapter definitions
src/data/studyQuizzes.js                    | Chapter quiz data
src/data/studyFallbackContent.js            | Local study content fallback
src/utils/insight.js                        | Insight data normalisation
src/styles/theme.css                        | Design tokens and variables
src/styles/globals.css                      | Global and component styles
src/styles/layout.css                       | Layout and responsive styles
src/styles/tailwind.css                     | Tailwind utility layers
src/styles/video-gen.css                    | Video generation styles
src/styles/video-player.css                 | Video player styles

================================================================================
16. DESIGN DECISIONS AND RATIONALE
================================================================================

16.1 Why React (not Vue/Svelte/Angular)?
  - Largest ecosystem and community support
  - Monaco Editor has first-class React bindings
  - Zustand integrates seamlessly with React hooks
  - Team familiarity and available learning resources

16.2 Why Vite (not Create React App/Webpack)?
  - Near-instant dev server startup (ESM-native)
  - Fast Hot Module Replacement
  - Optimised production builds with Rollup
  - Minimal configuration required
  - Active maintenance and modern defaults

16.3 Why Zustand (not Redux/Context)?
  - Minimal boilerplate (no actions, reducers, providers)
  - Direct store access without prop drilling
  - Excellent performance (selective subscriptions)
  - Perfect for the simulation playback use case
  - Simple API that scales without complexity

16.4 Why Monaco Editor (not CodeMirror/Ace)?
  - Same engine as VS Code (familiar to students)
  - Built-in Java language support
  - Rich API for error markers and decorations
  - Excellent performance with large files
  - Active development and documentation

16.5 Why State-Based Routing (not React Router)?
  - Application has only 6 pages (no deep linking needed)
  - Simpler mental model for the codebase
  - No URL synchronisation complexity
  - Pages share state (selectedProblemId) easily via props
  - Sufficient for a single-user educational tool

16.6 Why Client-Side Simulation Engine?
  - Instant feedback without network latency
  - Smooth animations at 60fps
  - No backend load for simulation playback
  - Offline capability for the simulation feature
  - Fine-grained control over timing and presentation

================================================================================
17. CONCLUSION
================================================================================

The frontend of the Adaptive AI-Based Java Programming Tutor provides a
comprehensive, modern learning environment that combines:

  (1) A professional-grade code editor (Monaco) with real-time error feedback
  (2) Progressive AI-powered hints that respect student autonomy
  (3) An innovative client-side complexity simulation engine
  (4) Rich learning analytics with personalised insights
  (5) A structured 31-chapter study curriculum with interactive quizzes
  (6) Video generation capabilities for animated code walkthroughs

The application is built with a focus on developer experience (Vite + React),
user experience (dark theme, smooth animations, responsive layout), and
pedagogical effectiveness (progressive hints, hint-weighted metrics,
encouragement engine). The architecture maintains clean separation between
data fetching, state management, and presentation, making the codebase
maintainable and extensible.

================================================================================
END OF DOCUMENT
================================================================================
