package team

import (
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"testing"
)

// TestWriteHeadlessOpencodeMCPConfigConcurrent verifies that concurrent calls
// to writeHeadlessOpencodeMCPConfig (as happen when CEO + planner + reviewer
// all spawn at the same time) never produce a truncated or double-braced JSON
// file. The fix is an atomic temp-file-then-rename write.
func TestWriteHeadlessOpencodeMCPConfigConcurrent(t *testing.T) {
	home := t.TempDir()
	t.Setenv("HOME", home)

	configDir := filepath.Join(home, ".config", "opencode")
	if err := os.MkdirAll(configDir, 0o755); err != nil {
		t.Fatal(err)
	}

	// Seed an existing opencode.json with some user content that should survive
	// the merge (theme key is untouched by WUPHF).
	seed := `{"$schema":"https://opencode.ai/config.json","theme":"dark","ai":{"ollama":{"type":"openai-compatible","url":"http://localhost:11434/v1"}}}`
	configPath := filepath.Join(configDir, "opencode.json")
	if err := os.WriteFile(configPath, []byte(seed), 0o600); err != nil {
		t.Fatal(err)
	}

	// Point the executable-path hook at a harmless path so the launcher can
	// construct the MCP entry without needing the real wuphf binary.
	orig := headlessOpencodeExecutablePath
	headlessOpencodeExecutablePath = func() (string, error) { return "/usr/local/bin/wuphf", nil }
	defer func() { headlessOpencodeExecutablePath = orig }()

	l := &Launcher{}

	const goroutines = 20
	var wg sync.WaitGroup
	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		go func(slug string) {
			defer wg.Done()
			if err := l.writeHeadlessOpencodeMCPConfig(slug); err != nil {
				t.Errorf("writeHeadlessOpencodeMCPConfig(%q): %v", slug, err)
			}
		}([]string{"ceo", "planner", "reviewer"}[i%3])
	}
	wg.Wait()

	raw, err := os.ReadFile(configPath)
	if err != nil {
		t.Fatalf("read opencode.json after concurrent writes: %v", err)
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil {
		t.Fatalf("opencode.json is not valid JSON after concurrent writes: %v\n\ncontent:\n%s", err, raw)
	}
	// The wuphf-office MCP entry must be present.
	mcp, _ := out["mcp"].(map[string]any)
	if mcp == nil {
		t.Fatal("mcp key missing from opencode.json after concurrent writes")
	}
	if _, ok := mcp["wuphf-office"]; !ok {
		t.Fatal("mcp.wuphf-office missing from opencode.json after concurrent writes")
	}
}
