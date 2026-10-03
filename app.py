"""
Main Application Launcher
Runs the FastAPI Backend Server on port 8000.
"""
import os
import sys
import uvicorn

if __name__ == "__main__":
    # Ensure current directory is in sys.path
    root_dir = os.path.dirname(os.path.abspath(__file__))
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)

    print("=" * 70)
    print("AI-POWERED RESUME ANALYSIS & CAREER GUIDANCE SYSTEM")
    print("=" * 70)
    print("Starting FastAPI Backend Server on http://127.0.0.1:8000")
    print("Swagger API Documentation: http://127.0.0.1:8000/docs")
    print("Frontend Dev Server (Vite): http://localhost:5173")
    print("=" * 70)

    uvicorn.run("backend.app:app", host="127.0.0.1", port=8000, reload=True)
