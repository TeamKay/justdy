
from pathlib import Path
import re
import zipfile
import json

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

PROJECT_ROOT = Path.cwd()
OUTPUT_ZIP = PROJECT_ROOT / "whiteboard_context_bundle.zip"

# The main whiteboard component
TARGET_FILE_NAME = "Whiteboard.tsx"

# Folders that may contain relevant local dependencies
SOURCE_DIRS = [
    "app",
    "src",
    "components",
    "hooks",
    "lib",
    "utils",
    "types",
    "styles",
]

# Files useful for understanding the project setup
CONFIG_FILES = [
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "next.config.ts",
    "next.config.mjs",
    "tailwind.config.js",
    "tailwind.config.ts",
    "postcss.config.js",
    "postcss.config.mjs",
    "eslint.config.js",
]

# Exclude generated, sensitive, and unnecessary files
EXCLUDED_DIRS = {
    "node_modules",
    ".next",
    ".git",
    ".vercel",
    "dist",
    "build",
    "coverage",
    ".turbo",
    ".cache",
}

EXCLUDED_NAMES = {
    ".env",
    ".env.local",
    ".env.production",
    ".env.development",
    "credentials.json",
    "service-account.json",
}

SOURCE_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx",
    ".css", ".scss", ".sass",
    ".json",
}

# --------------------------------------------------
# FIND MAIN COMPONENT
# --------------------------------------------------

def find_target():
    matches = [
        p for p in PROJECT_ROOT.rglob(TARGET_FILE_NAME)
        if not any(part in EXCLUDED_DIRS for part in p.parts)
    ]

    if not matches:
        raise FileNotFoundError(
            f"Could not find {TARGET_FILE_NAME} in {PROJECT_ROOT}"
        )

    if len(matches) > 1:
        print("Multiple matching files found:")
        for i, path in enumerate(matches, 1):
            print(f"{i}. {path.relative_to(PROJECT_ROOT)}")
        raise RuntimeError(
            "Please keep only the intended file or edit the script "
            "to specify its exact path."
        )

    return matches[0]


# --------------------------------------------------
# FIND LOCAL IMPORTS
# --------------------------------------------------

IMPORT_PATTERN = re.compile(
    r"""(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]"""
    r"""|import\(\s*['"]([^'"]+)['"]\s*\)"""
    r"""|require\(\s*['"]([^'"]+)['"]\s*\)"""
)

def resolve_import(import_name, source_file):
    if not import_name.startswith((".", "@/")):
        return None

    candidates = []

    if import_name.startswith("@/"):
        relative = import_name[2:]
        candidates.append(PROJECT_ROOT / "src" / relative)
        candidates.append(PROJECT_ROOT / relative)
    else:
        candidates.append(source_file.parent / import_name)

    extensions = [
        "", ".tsx", ".ts", ".jsx", ".js",
        ".css", ".scss", ".json",
    ]

    for candidate in candidates:
        for extension in extensions:
            possible = Path(str(candidate) + extension)
            if possible.is_file():
                return possible.resolve()

        for index_file in [
            "index.tsx", "index.ts",
            "index.jsx", "index.js",
        ]:
            possible = candidate / index_file
            if possible.is_file():
                return possible.resolve()

    return None


def collect_import_tree(main_file):
    collected = set()
    pending = [main_file.resolve()]

    while pending:
        current = pending.pop()

        if current in collected or not current.is_file():
            continue

        if any(part in EXCLUDED_DIRS for part in current.parts):
            continue

        collected.add(current)

        try:
            source = current.read_text(
                encoding="utf-8",
                errors="replace"
            )
        except Exception:
            continue

        for match in IMPORT_PATTERN.finditer(source):
            import_name = next(
                (value for value in match.groups() if value),
                None
            )

            if not import_name:
                continue

            dependency = resolve_import(import_name, current)

            if dependency and dependency not in collected:
                pending.append(dependency)

    return collected


# --------------------------------------------------
# COLLECT SUPPORTING PROJECT FILES
# --------------------------------------------------

def collect_support_files():
    collected = set()

    for name in CONFIG_FILES:
        path = PROJECT_ROOT / name
        if path.is_file():
            collected.add(path.resolve())

    # Include global stylesheets and source-level type declarations.
    for folder_name in SOURCE_DIRS:
        folder = PROJECT_ROOT / folder_name

        if not folder.is_dir():
            continue

        for path in folder.rglob("*"):
            if not path.is_file():
                continue

            if any(part in EXCLUDED_DIRS for part in path.parts):
                continue

            if path.name in EXCLUDED_NAMES:
                continue

            if path.suffix.lower() == ".css":
                collected.add(path.resolve())

    return collected


# --------------------------------------------------
# CREATE ZIP
# --------------------------------------------------

def main():
    main_file = find_target()

    print(f"Main component: {main_file.relative_to(PROJECT_ROOT)}")

    files = collect_import_tree(main_file)
    files.update(collect_support_files())

    # Remove anything outside the project or explicitly excluded
    safe_files = set()

    for path in files:
        try:
            relative = path.relative_to(PROJECT_ROOT)
        except ValueError:
            continue

        if any(part in EXCLUDED_DIRS for part in relative.parts):
            continue

        if relative.name in EXCLUDED_NAMES:
            continue

        if relative.name.startswith(".env"):
            continue

        safe_files.add(path)

    manifest = []

    with zipfile.ZipFile(
        OUTPUT_ZIP,
        "w",
        compression=zipfile.ZIP_DEFLATED
    ) as archive:

        for path in sorted(safe_files):
            relative = path.relative_to(PROJECT_ROOT)

            try:
                archive.write(path, relative.as_posix())
                manifest.append(relative.as_posix())
                print(f"Included: {relative}")
            except Exception as error:
                print(f"Skipped: {relative} ({error})")

        archive.writestr(
            "COLLECTION_MANIFEST.txt",
            "\n".join(manifest)
        )

        archive.writestr(
            "COLLECTION_INFO.txt",
            "Whiteboard source and local dependency collection.\n"
            "Generated automatically for code review and integration.\n"
        )

    print("\n------------------------------------")
    print("COLLECTION COMPLETE")
    print("------------------------------------")
    print(f"Files collected: {len(manifest)}")
    print(f"ZIP created: {OUTPUT_ZIP}")
    print("Upload whiteboard_context_bundle.zip to ChatGPT.")


if __name__ == "__main__":
    main()
