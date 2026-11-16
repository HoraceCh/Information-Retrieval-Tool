#!/usr/bin/env python3
"""Read-only local GPU preflight; does not download models or claim inference validation."""
import argparse
import ctypes
import importlib.metadata
import json
import platform
import shutil
import subprocess
import sys


def command(args):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=90, check=False)
        return {"status": "PASS" if result.returncode == 0 else "FAIL", "returncode": result.returncode,
                "output": (result.stdout + result.stderr).strip()[:8000]}
    except (OSError, subprocess.TimeoutExpired) as error:
        return {"status": "BLOCKED", "output": type(error).__name__}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--docker", action="store_true", help="Also test Compose GPU passthrough using the built GPU image")
    parser.add_argument("--inside-container", action="store_true")
    parser.add_argument("--output")
    args = parser.parse_args()
    checks = {"nvidia_smi": command(["nvidia-smi", "--query-gpu=name,driver_version,memory.total", "--format=csv,noheader"])}
    if args.inside_container:
        checks = {}
        try:
            import ctranslate2
            count = ctranslate2.get_cuda_device_count()
            types = sorted(ctranslate2.get_supported_compute_types("cuda")) if count else []
            checks["ctranslate2"] = {"status": "PASS" if count and "float16" in types else "FAIL", "devices": count, "compute_types": types,
                                     "version": importlib.metadata.version("ctranslate2")}
            for name in ("libcublas.so.12", "libcudart.so.12", "libcurand.so.10", "libcudnn.so.9"):
                ctypes.CDLL(name)
                checks[name] = {"status": "PASS"}
        except Exception as error:
            checks["cuda_libraries"] = {"status": "FAIL", "error_type": type(error).__name__,
                                        "action": "Check host driver, --gpus passthrough and pinned CUDA library dependencies."}
    elif args.docker:
        checks["docker"] = command(["docker", "version", "--format", "{{.Server.Version}}"])
        checks["compose_config"] = command(["docker", "compose", "-f", "docker-compose.speech.gpu.yml", "config", "--quiet"])
        checks["container_cuda"] = command(["docker", "compose", "-f", "docker-compose.speech.gpu.yml", "run", "--rm", "--no-deps", "--no-build", "--pull", "never", "whisper", "python", "scripts/check_gpu.py", "--inside-container"])
    status = "PASS" if all(value["status"] == "PASS" for value in checks.values()) else "BLOCKED"
    report = {"status": status, "platform": platform.platform(), "python": platform.python_version(), "checks": checks,
              "notes": ["This is a preflight, not a real-model inference test.", "Run from repository root after building the GPU image.", "Confirm actual GPU name and VRAM; do not assume the supplied hardware description is accurate."]}
    rendered = json.dumps(report, ensure_ascii=False, indent=2)
    print(rendered)
    if args.output:
        from pathlib import Path
        Path(args.output).write_text(rendered + "\n")
    return 0 if status == "PASS" else 2


if __name__ == "__main__":
    sys.exit(main())
