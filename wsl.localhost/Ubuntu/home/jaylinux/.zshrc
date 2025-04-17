# Path to your Oh My Zsh installation
export ZSH="$HOME/.oh-my-zsh"

# ------------------------------
# THEME CONFIGURATION
# ------------------------------
ZSH_THEME="robbyrussell"

# Set list of themes to pick from when loading at random
# ZSH_THEME_RANDOM_CANDIDATES=( "robbyrussell" "agnoster" )

# ------------------------------
# ZSH BEHAVIOR OPTIONS
# ------------------------------
# Case sensitive completion
# CASE_SENSITIVE="true"

# Hyphen-insensitive completion (_ and - interchangeable)
HYPHEN_INSENSITIVE="true"

# Disable auto-correction
ENABLE_CORRECTION="false"

# Display red dots whilst waiting for completion
COMPLETION_WAITING_DOTS="true"

# Speed up large repository status checks
DISABLE_UNTRACKED_FILES_DIRTY="true"

# ------------------------------
# HISTORY CONFIGURATION
# ------------------------------
HIST_STAMPS="yyyy-mm-dd"
HISTSIZE=10000
SAVEHIST=10000
HISTFILE=~/.zsh_history
setopt HIST_IGNORE_DUPS
setopt HIST_IGNORE_SPACE
setopt SHARE_HISTORY

# ------------------------------
# PLUGINS
# ------------------------------
# Add wisely, as too many plugins slow down shell startup
plugins=(
  git
  docker
  docker-compose
  npm
  nvm
  vscode
  history
  zsh-autosuggestions
  zsh-syntax-highlighting
)

# ------------------------------
# LOAD OH-MY-ZSH
# ------------------------------
source $ZSH/oh-my-zsh.sh

# ------------------------------
# PATH CONFIGURATION
# ------------------------------
# Ensure HOME is set correctly
export HOME=/home/jaylinux

# Set PATH once with all components
export PATH="$HOME/bin:$HOME/.local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# ------------------------------
# ENVIRONMENT CONFIGURATION
# ------------------------------
# Browser configuration for WSL
export BROWSER="/mnt/c/Windows/explorer.exe"

# Source env file if it exists
if [ -f "$HOME/.local/bin/env" ]; then
    . "$HOME/.local/bin/env"
fi

# NVM (Node Version Manager) setup
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" --no-use # Lazy loading for better startup performance
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# ------------------------------
# SSH AGENT CONFIGURATION
# ------------------------------
# SSH Agent Setup (only run once)
if [ -z "$SSH_AUTH_SOCK" ]; then
   eval "$(ssh-agent -s)" > /dev/null
   ssh-add ~/.ssh/id_ed25519 2>/dev/null
fi

# ------------------------------
# ALIASES
# ------------------------------
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias c='clear'
alias h='history'
alias hg='history | grep'
alias update='sudo apt update && sudo apt upgrade -y'
alias code='code-insiders'

# ------------------------------
# FUNCTIONS
# ------------------------------
# Automatically ls when changing directories
function cd() {
    builtin cd "$@" && ls -F --color=auto
}

# Enable basic auto-completion
autoload -Uz compinit
compinit -i

# ------------------------------
# PERFORMANCE OPTIMIZATIONS
# ------------------------------
# Compile zcompdump if it's older than 24 hours
autoload -Uz compaudit
{
  # Compile zcompdump, if modified, to increase startup speed
  zcompdump="${ZDOTDIR:-$HOME}/.zcompdump"
  if [[ -s "$zcompdump" && (! -s "${zcompdump}.zwc" || "$zcompdump" -nt "${zcompdump}.zwc") ]]; then
    zcompile "$zcompdump"
  fi
} &!
