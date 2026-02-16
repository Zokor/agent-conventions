#!/usr/bin/env bash

# Agent Conventions Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/Zokor/agent-conventions/main/install.sh | bash
# Or:    ./install.sh --target claude --all

set -e

REPO_URL="https://raw.githubusercontent.com/Zokor/agent-conventions/main"
DEPRECATION_CMD="npx skills add Zokor/agent-conventions"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
DIM='\033[0;90m'
BOLD='\033[1m'
NC='\033[0m'

# Defaults
TARGET=""
CUSTOM_PATH=""
INSTALL_ALL=false

# Install targets
declare -A TARGETS=(
  ["claude"]="$HOME/.claude/skills/agent-conventions"
  ["codex"]="$HOME/.codex/skills/agent-conventions"
  ["cursor"]="$HOME/.cursor/skills/agent-conventions"
  ["aider"]="$HOME/.aider/skills/agent-conventions"
  ["continue"]="$HOME/.continue/skills/agent-conventions"
  ["agents"]="$HOME/.agents/conventions"
  ["project"]="./.ai/conventions"
)

print_header() {
  echo ""
  echo -e "${BOLD}${CYAN}🤖 Agent Conventions Installer${NC}"
  echo -e "${DIM}Conventions that make codebases agent-friendly${NC}"
  echo ""
}

print_deprecation_notice() {
  echo -e "${YELLOW}${BOLD}DEPRECATED:${NC} ${DIM}This installer is kept temporarily for compatibility.${NC}"
  echo -e "${YELLOW}${BOLD}Use instead:${NC} ${CYAN}${DEPRECATION_CMD}${NC}"
  echo ""
}

print_success() {
  echo -e "${GREEN}✓${NC} ${DIM}$1${NC}"
}

print_error() {
  echo -e "${RED}✗${NC} ${DIM}$1${NC}"
}

show_help() {
  print_deprecation_notice
  echo "Usage: install.sh [options]"
  echo ""
  echo "Options:"
  echo "  -t, --target <target>   Install target (claude, codex, cursor, aider, continue, agents, project)"
  echo "  -p, --path <path>       Custom install path"
  echo "  -a, --all               Install all conventions"
  echo "  -h, --help              Show this help"
  echo ""
  echo "Targets:"
  echo "  claude      ~/.claude/skills/agent-conventions/"
  echo "  codex       ~/.codex/skills/agent-conventions/"
  echo "  cursor      ~/.cursor/skills/agent-conventions/"
  echo "  aider       ~/.aider/skills/agent-conventions/"
  echo "  continue    ~/.continue/skills/agent-conventions/"
  echo "  agents      ~/.agents/conventions/"
  echo "  project     ./.ai/conventions/"
  echo ""
  echo "Examples:"
  echo "  ./install.sh                          # Interactive"
  echo "  ./install.sh --target claude --all    # All conventions to Claude"
  echo "  ./install.sh --target cursor          # Interactive, install to Cursor"
  echo "  ./install.sh --path ./my-rules        # Custom path"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    -t|--target)
      TARGET="$2"
      shift 2
      ;;
    -p|--path)
      CUSTOM_PATH="$2"
      shift 2
      ;;
    -a|--all)
      INSTALL_ALL=true
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

check_requirements() {
  if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
  fi
}

select_options() {
  local prompt="$1"
  shift
  local options=("$@")

  if command -v fzf &> /dev/null; then
    printf '%s\n' "${options[@]}" | fzf --multi --prompt="$prompt " --header="Space to select, Enter to confirm"
  else
    echo -e "${CYAN}$prompt${NC}"
    echo -e "${DIM}Enter numbers separated by spaces (e.g., 1 3 5), or 'all', or press Enter to skip:${NC}"

    local i=1
    for opt in "${options[@]}"; do
      echo "  $i) $opt"
      ((i++))
    done

    read -r -p "> " selection

    if [[ "$selection" == "all" ]]; then
      printf '%s\n' "${options[@]}"
    elif [[ -z "$selection" ]]; then
      echo ""
    else
      for num in $selection; do
        if [[ "$num" =~ ^[0-9]+$ ]] && [ "$num" -ge 1 ] && [ "$num" -le "${#options[@]}" ]; then
          echo "${options[$((num-1))]}"
        fi
      done
    fi
  fi
}

download_file() {
  local url="$1"
  local dest="$2"

  mkdir -p "$(dirname "$dest")"

  if curl -fsSL "$url" -o "$dest" 2>/dev/null; then
    print_success "$(basename "$dest")"
    return 0
  else
    print_error "$(basename "$dest") (failed to download)"
    return 1
  fi
}

main() {
  print_header
  print_deprecation_notice
  check_requirements

  # Determine install path
  local INSTALL_DIR=""

  if [[ -n "$CUSTOM_PATH" ]]; then
    INSTALL_DIR="$CUSTOM_PATH"
  elif [[ -n "$TARGET" ]] && [[ -n "${TARGETS[$TARGET]}" ]]; then
    INSTALL_DIR="${TARGETS[$TARGET]}"
  else
    # Prompt for target
    echo -e "${BOLD}Select install target:${NC}"
    echo "  1) Claude Code     (~/.claude/skills/)"
    echo "  2) Codex / ChatGPT (~/.codex/skills/)"
    echo "  3) Cursor          (~/.cursor/skills/)"
    echo "  4) Aider           (~/.aider/skills/)"
    echo "  5) Continue        (~/.continue/skills/)"
    echo "  6) Generic Agents  (~/.agents/)"
    echo "  7) Project Local   (./.ai/)"
    echo "  8) Custom path"
    read -r -p "> " target_choice

    case "$target_choice" in
      1) INSTALL_DIR="${TARGETS[claude]}" ;;
      2) INSTALL_DIR="${TARGETS[codex]}" ;;
      3) INSTALL_DIR="${TARGETS[cursor]}" ;;
      4) INSTALL_DIR="${TARGETS[aider]}" ;;
      5) INSTALL_DIR="${TARGETS[continue]}" ;;
      6) INSTALL_DIR="${TARGETS[agents]}" ;;
      7) INSTALL_DIR="${TARGETS[project]}" ;;
      8)
        read -r -p "Enter custom path: " INSTALL_DIR
        ;;
      *)
        INSTALL_DIR="${TARGETS[claude]}"
        ;;
    esac
    echo ""
  fi

  # Select options or install all
  local selected_languages=""
  local selected_frontend=""
  local selected_backend=""

  if $INSTALL_ALL; then
    selected_languages="typescript javascript php python java csharp go"
    selected_frontend="react nextjs vue angular"
    selected_backend="laravel symfony django spring nestjs rails dotnet"
  else
    # Languages
    echo -e "${BOLD}Languages:${NC}"
    LANGUAGES=("typescript" "javascript" "php" "python" "java" "csharp" "go")
    selected_languages=$(select_options "Select languages:" "${LANGUAGES[@]}")
    echo ""

    # Frontend
    echo -e "${BOLD}Frontend Frameworks:${NC}"
    FRONTEND=("react" "nextjs" "vue" "angular")
    selected_frontend=$(select_options "Select frontend frameworks:" "${FRONTEND[@]}")
    echo ""

    # Backend
    echo -e "${BOLD}Backend Frameworks:${NC}"
    BACKEND=("laravel" "symfony" "django" "spring" "nestjs" "rails" "dotnet")
    selected_backend=$(select_options "Select backend frameworks:" "${BACKEND[@]}")
    echo ""
  fi

  echo -e "${DIM}Installing to: $INSTALL_DIR${NC}"
  echo ""

  # Create directories
  mkdir -p "$INSTALL_DIR"
  mkdir -p "$INSTALL_DIR/languages"
  mkdir -p "$INSTALL_DIR/frameworks/frontend"
  mkdir -p "$INSTALL_DIR/frameworks/backend"

  # Download core files
  download_file "$REPO_URL/SKILL.md" "$INSTALL_DIR/SKILL.md"
  download_file "$REPO_URL/api.md" "$INSTALL_DIR/api.md"

  # Download selected languages
  for lang in $selected_languages; do
    [[ -z "$lang" ]] && continue
    download_file "$REPO_URL/languages/${lang}.md" "$INSTALL_DIR/languages/${lang}.md"
  done

  # Download selected frontend frameworks
  for fw in $selected_frontend; do
    [[ -z "$fw" ]] && continue
    download_file "$REPO_URL/frameworks/frontend/${fw}.md" "$INSTALL_DIR/frameworks/frontend/${fw}.md"
  done

  # Download selected backend frameworks
  for fw in $selected_backend; do
    [[ -z "$fw" ]] && continue
    download_file "$REPO_URL/frameworks/backend/${fw}.md" "$INSTALL_DIR/frameworks/backend/${fw}.md"
  done

  echo ""
  echo -e "${GREEN}${BOLD}✓ Installation complete!${NC}"
  echo ""
  echo -e "${DIM}Add to your AI tool's config:${NC}"
  echo -e "${CYAN}  $INSTALL_DIR/SKILL.md${NC}"
  echo ""
}

main "$@"
