# 🚀 Adaptive AI-Based Java Programming Tutor

An intelligent, hint-driven AI tutoring system designed to help beginner
programmers learn **Java** through guided debugging, progressive hints,
and personalized learning analytics.

This system analyzes student-submitted Java code, detects compilation
and runtime errors, generates structured hints using a locally deployed
Large Language Model (Qwen Coder 30B), and tracks learning progress
using MongoDB.

------------------------------------------------------------------------

## 📌 Project Overview

Traditional AI code assistants generate complete solutions, which often
leads to passive learning and plagiarism.\
This project takes a different approach.

Instead of providing full answers, the system:

-   Detects errors in Java code
-   Explains why the error occurs
-   Provides progressive hints
-   Tracks weak topics
-   Encourages improvement with personalized feedback
-   Promotes independent problem-solving

The system acts as an **AI Teaching Assistant**, not a code generator.

------------------------------------------------------------------------

## 🎯 Key Features

### 1️⃣ Java Code Compilation & Execution Engine

-   Compiles Java code using `javac`
-   Executes programs securely
-   Captures:
    -   Compilation errors
    -   Runtime exceptions
    -   Stack traces
    -   Output mismatches
-   Implements execution timeouts to prevent infinite loops

------------------------------------------------------------------------

### 2️⃣ AI-Powered Hint Generation (Local LLM)

-   Uses **Qwen Coder 30B** via LM Studio
-   Fully local inference (no cloud dependency)
-   Structured output format:

📌 Problem Summary\
📖 Why This Happens\
💡 Hint 1 (Concept Level)\
💡 Hint 2 (Logic Level)\
💡 Hint 3 (Code Level - limited)\
📘 Learning Tip

-   Strict no full-solution policy
-   Prevents copy-paste learning
-   Encourages conceptual understanding

------------------------------------------------------------------------

### 3️⃣ Progressive Hint System

Hints are provided gradually:

-   First attempt → Basic conceptual hint
-   Second attempt → More specific logic hint
-   Third attempt → Partial code guidance

This promotes active learning instead of spoon-feeding answers.

------------------------------------------------------------------------

### 4️⃣ Topic Detection & Weak Area Identification

The system automatically maps Java errors to topics:

-   Loops
-   Arrays
-   Conditions
-   Methods
-   Object-Oriented Programming
-   Exception Handling
-   Variables & Scope

Each submission updates the user's topic statistics.

If repeated errors occur in a topic, it is marked as **weak**.

------------------------------------------------------------------------

### 5️⃣ Personalized Encouragement System 🌟

When improvement is detected in previously weak topics, the system
generates polite motivational feedback such as:

"You've improved significantly in loops compared to earlier attempts.
Keep up the great progress!"

This feature is based on adaptive learning principles and positive
reinforcement psychology.

------------------------------------------------------------------------

### 6️⃣ Learning Analytics Dashboard

Tracks: - Error frequency per topic - Hint usage count - Resolved vs
unresolved submissions - Improvement trends

MongoDB stores structured learning history for each user.

------------------------------------------------------------------------

### 7️⃣ Local AI Deployment

-   No cloud API required
-   Runs using LM Studio
-   Ensures privacy
-   Zero API cost
-   Suitable for academic environments

------------------------------------------------------------------------

## 🏗️ System Architecture

User → Frontend → Flask Backend\
                     ↓\
         Java Compilation Engine\
                     ↓\
         Error Extraction Module\
                     ↓\
         Qwen Coder 30B (LM Studio)\
                     ↓\
         MongoDB Learning Database\
                     ↓\
     Structured Hints + Progress Feedback

------------------------------------------------------------------------

## 🛠️ Technology Stack

### Backend

-   Python
-   Flask
-   Subprocess (Java execution)
-   PyMongo

### Frontend

-   HTML/CSS/JavaScript or React
-   Monaco Code Editor

### Database

-   MongoDB

### AI Model

-   Qwen Coder 30B (quantized)
-   Served locally via LM Studio API

----------------------------------------------------------------------

## 🔐 Academic Integrity Policy

This system:

-   Does NOT provide full corrected code
-   Limits code examples to short snippets
-   Encourages self-correction
-   Promotes ethical learning

Designed specifically to prevent misuse and plagiarism.

------------------------------------------------------------------------

## 💡 Final Vision

To create a privacy-respecting, adaptive AI tutor that transforms
debugging from frustration into a structured learning journey.

Built with the goal of making programming education smarter, ethical,
and student-centered.
