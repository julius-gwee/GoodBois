# AI Adapters

Worker-side AI clients belong here:

- `sttAdapter`: Workers AI speech-to-text.
- `translateAdapter`: SEALion bidirectional translation.
- `llmAdapter`: Workers AI triage model with tool/function calling.
- `ttsAdapter`: Workers AI text-to-speech.

All adapters are server-side only. The frontend must not call Workers AI or SEALion directly.
