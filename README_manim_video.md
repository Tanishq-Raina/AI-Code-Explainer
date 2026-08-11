# Java Animation Generator

An automated pipeline that transforms Java source code into animated educational videos using Manim. Submit a `.java` file and get back a narrated, step-by-step visualization of how the program executes — including variable tracking, method call stacks, data structure animations, and program output.

## How It Works

```
Java Source → Parse → Simulate → LLM Overview → Generate Manim Script → Render Video
```

1. **Parse** — Analyzes the Java code using `javalang` to extract classes, methods, variables, and control flow
2. **Validate** — Compiles with `javac` (or falls back to syntax-only validation) to catch errors early
3. **Simulate** — Interprets the Java program in Python, recording every state change as an execution trace
4. **LLM Overview** — Sends the code to an OpenAI-compatible LLM for a structured summary (algorithm, complexity, narration)
5. **Generate** — Produces a complete Manim scene script with voiceover narration, code walkthrough, dry-run visualization, and program output
6. **Render** — Runs Manim to produce the final MP4 video with text-to-speech narration

## Features

- **Full Java interpretation** — Supports classes, objects, arrays, lists, maps, recursion, loops, and method calls
- **Data structure visualization** — Arrays, linked lists, hash maps, binary search trees, graphs (directed/undirected), 2D matrices
- **Step-by-step dry run** — Animated execution trace showing variable changes, method calls/returns, and control flow
- **Voiceover narration** — Edge TTS or gTTS backends with configurable voice, rate, and volume
- **Multiple quality levels** — Low (480p), Medium (720p), High (1080p), Production (1440p), 4K
- **HTTP API** — Submit jobs, poll progress, download videos, delete artifacts
- **Docker-ready** — Single image with all dependencies (LaTeX, ffmpeg, Java, Python)

## Project Structure

```
app/
├── main.py                  # CLI entry point
├── api/                     # HTTP API (Flask)
│   ├── __init__.py          # create_app factory
│   ├── config.py            # Environment-driven configuration
│   ├── routes.py            # REST endpoints
│   ├── pipeline.py          # Async render pipeline orchestrator
│   ├── jobs.py              # Job model, Stage enum, QualityLevel
│   ├── store.py             # In-memory job store (pluggable interface)
│   ├── validators.py        # Java validation (javac + javalang fallback)
│   ├── progress.py          # Manim stdout parser + ManimRunner
│   ├── shutdown.py          # Graceful SIGTERM handling
│   ├── multipart.py         # Request parsing helpers
│   └── errors.py            # Error taxonomy and serialization
├── parser/                  # Java source code parser
│   └── java_parser.py       # javalang-based AST analysis
├── simulator/               # Java interpreter
│   └── executor.py          # Pure-Python Java execution engine
├── llm/                     # LLM integration
│   └── overview_generator.py # OpenAI-compatible code analysis
└── generator/               # Manim script generation
    ├── scene_builder.py     # Main script assembler
    ├── layout_manager.py    # Scene layout regions
    ├── tts/                 # Text-to-speech configuration
    └── templates/           # Visual components (code panel, console, etc.)
```

## Quick Start

### Prerequisites

- Python 3.10+
- Java JDK (for `javac` validation)
- FFmpeg
- LaTeX (texlive)
- An OpenAI-compatible LLM endpoint (LM Studio, Abacus AI, OpenAI, etc.)

### Local Setup

```bash
# Create virtual environment
python -m venv manim018
manim018\Scripts\activate  # Windows
# source manim018/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Set environment variables
set LLM_BASE_URL=https://routellm.abacus.ai/v1
set LLM_API_KEY=your-api-key
set LLM_MODEL=gpt-4
```

### CLI Usage

```bash
python -m app.main test_inputs/BankAccount.java bank_account --tts-backend edge
```

### API Usage

Start the server:

```bash
python -m flask --app app.api:create_app run --port 5000
```

Submit a render job:

```bash
# Submit
curl -X POST http://localhost:5000/api/render \
  -F "file=@test_inputs/BankAccount.java" \
  -F "quality=low"

# Poll status
curl http://localhost:5000/api/jobs/{job_id}

# Download video (when completed)
curl -o output.mp4 http://localhost:5000/api/jobs/{job_id}/video

# Delete job
curl -X DELETE http://localhost:5000/api/jobs/{job_id}

# Health check
curl http://localhost:5000/api/health
```

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/render` | Submit a Java file for rendering |
| `GET` | `/api/jobs/{id}` | Query job status and progress |
| `GET` | `/api/jobs/{id}/video` | Download the rendered MP4 |
| `DELETE` | `/api/jobs/{id}` | Delete job and artifacts |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/validate` | Synchronous compile check (optional) |

### Submit Request

```
POST /api/render
Content-Type: multipart/form-data

Fields:
  file       (required)  .java file
  quality    (optional)  low | medium | high | production | 4k (default: low)
  inputs     (optional)  Space-separated Scanner input tokens
  tts_backend (optional) edge | gtts (default: edge)
  tts_voice  (optional)  Edge TTS voice name (default: en-CA-LiamNeural)
  tts_rate   (optional)  Speaking rate, e.g. +10% (default: +0%)
  tts_volume (optional)  Volume, e.g. -5% (default: +0%)
```

### Job Stages

```
queued → validating → parsing → generating → rendering → finalizing → completed
                                                                    ↘ failed
```

Each stage reports a progress percentage (0-100).

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `invalid_request` | 400/413 | Bad input (missing file, wrong extension, oversized) |
| `not_found` | 404 | Job ID doesn't exist |
| `not_ready` | 404 | Video not available yet (still rendering) |
| `gone` | 410 | Job was deleted |
| `compilation_error` | — | Java source failed validation |
| `parse_error` | — | Parser couldn't process the code |
| `simulation_error` | — | Interpreter failed |
| `llm_error` | — | LLM endpoint unreachable |
| `render_error` | — | Manim rendering failed |
| `internal_error` | 500/503 | Unexpected server error or shutdown |

## Docker

### Build

```bash
docker build -t render-api .
```

### Run

```bash
docker run -p 4000:5000 \
  -e LLM_BASE_URL=https://routellm.abacus.ai/v1 \
  -e LLM_API_KEY=your-api-key \
  -e LLM_MODEL=gpt-4 \
  render-api
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_BASE_URL` | Yes | — | OpenAI-compatible API base URL |
| `LLM_API_KEY` | Yes | — | API key (also accepts `ABACUS_API_KEY`) |
| `LLM_MODEL` | Yes | — | Model name (e.g. `gpt-4`) |
| `RENDER_API_WORKERS` | No | `1` | Thread pool size for concurrent renders |
| `RENDER_API_MAX_UPLOAD_BYTES` | No | `1048576` | Max upload size (1 MiB) |
| `RENDER_API_SHUTDOWN_TIMEOUT_SECONDS` | No | `30` | Graceful shutdown timeout |
| `RENDER_API_UPLOADS_DIR` | No | `./var/uploads` | Upload storage path |
| `RENDER_API_SCRIPTS_DIR` | No | `./var/scripts` | Generated scripts path |
| `RENDER_API_VIDEOS_DIR` | No | `./var/videos` | Rendered videos path |
| `RENDER_API_VOICEOVERS_DIR` | No | `./var/voiceovers` | TTS audio cache path |
| `RENDER_API_TTS_BACKEND` | No | `edge` | Default TTS backend |
| `RENDER_API_TTS_VOICE` | No | `en-CA-LiamNeural` | Default TTS voice |
| `RENDER_API_TTS_RATE` | No | `+0%` | Default speaking rate |
| `RENDER_API_TTS_VOLUME` | No | `+0%` | Default volume |
| `RENDER_API_ENABLE_VALIDATE` | No | `false` | Enable `/api/validate` endpoint |

## Supported Java Features

- Classes and objects (constructors, fields, methods)
- Primitive types and strings
- Arrays (1D and 2D)
- ArrayList, LinkedList, HashMap
- Control flow (if/else, for, while, do-while, switch)
- Recursion with call tree visualization
- Binary search trees
- Directed and undirected graphs (adjacency list and matrix)
- System.out.println / System.out.print
- Scanner input (via `--inputs` or `inputs` form field)

## Architecture

The system is designed as a pipeline with clear separation of concerns:

- **Request thread** — Validates input, persists upload, submits to worker pool, returns immediately (HTTP 202)
- **Worker thread** — Drives the pipeline stages sequentially, updates progress in the job store
- **Job store** — Thread-safe in-memory storage behind a narrow interface (swappable for Redis later)
- **Shutdown controller** — Handles SIGTERM gracefully, drains in-flight jobs, force-kills after timeout

The pipeline never blocks the HTTP request thread. Multiple jobs can be queued and processed concurrently (configurable via `RENDER_API_WORKERS`).

## License

This project is for educational purposes.
