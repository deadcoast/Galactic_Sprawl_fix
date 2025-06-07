


## One-Page, No-Nonsense Setup

**Goal:** use `qwen2.5-coder-32b-instruct` with Cursor.
**Machine:** macOS (M3 Max, 36 GB).
**Nothing gets billed.** The “API key” is a dummy string Cursor insists on.

---

### 1 · Pull the model (18 GB)

```bash
local-ai pull-model qwen2.5-coder-32b-instruct:q4_0
```

---

### 2 · Add a model config

```bash
mkdir -p ~/.localai/config
cat > ~/.localai/config/qwen32b.yaml <<'YAML'
name: qwen2.5-coder-32b-instruct
backend: llama.cpp
parameters:
  model: qwen2.5-coder-32b-instruct
  context_size: 8192      # 8 k tokens
  gpu_layers: 28          # fills the M3 Max GPU
  temperature: 0.2
  fim_prefix: "<fim_prefix>"
  fim_middle: "<fim_middle>"
  fim_suffix: "<fim_suffix>"
YAML
```

---

### 3 · Run LocalAI

```bash
OMP_NUM_THREADS=$(sysctl -n hw.logicalcpu) \
local-ai serve \
  --models-path ~/localai/models \
  --config-dir  ~/.localai/config \
  --addr        127.0.0.1:8080
```

Leave this terminal open; it’s your model server.

---

### 4 · Export two vars once

```bash
echo 'export OPENAI_API_KEY="localai"'        >> ~/.zshrc
echo 'export OPENAI_API_BASE="http://127.0.0.1:8080/v1"' >> ~/.zshrc
source ~/.zshrc
```

*Dummy key, points Cursor to your local server.*

---

### 5 · Start Cursor from that shell

```bash
cursor .
```

Cursor sees the vars; no UI tweaks needed.
It now calls your `qwen2.5-coder-32b-instruct` model locally.

---

### 6 · Quick test inside Cursor

* Press **⌥⇧ K** on a code block → type “Optimize”.
* Reply should stream within a couple seconds.

---

### Done

You’re using a 32-billion-parameter coder on-device, with zero cloud cost.
