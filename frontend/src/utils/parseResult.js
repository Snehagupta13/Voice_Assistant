function stripThink(text) {
  if (!text) return ''
  text = text.replace(/<think>[\s\S]*?<\/think>/g, '')
  text = text.replace(/<think>[\s\S]*$/g, '')
  text = text.replace(/```[a-z]*\n?/g, '').replace(/```/g, '')
  return text.trim()
}

// Detect if the text is markdown (has # headings or ** bold)
function isMarkdown(text) {
  return /^#{1,3}\s/m.test(text) || /\*\*.*?\*\*/.test(text)
}

export function parseResult(raw) {
  const cleaned = stripThink(raw)
  const out = {
    raw: cleaned,
    isMarkdown: false,
    conversation: '',
    clinicalNote: '',
    jsonData: null,
    sections: {},
  }
  if (!cleaned) return out

  // Always attempt the three-section === split first.
  // isMarkdown only controls how the clinical note is *rendered*, not whether
  // we attempt section extraction — Llama frequently adds **bold** markers
  // which used to short-circuit the split and lose the conversation block.
  const parts = cleaned.split(/={15,}/).map(p => p.trim()).filter(Boolean)
  const hasSections = parts.some(p => /DOCTOR.*CONVERSATION|CLINICAL NOTE|JSON OUTPUT/i.test(p))

  if (hasSections) {
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      if (/DOCTOR.*CONVERSATION/i.test(p) && parts[i + 1]) {
        out.conversation = parts[++i]
      } else if (/CLINICAL NOTE/i.test(p) && parts[i + 1]) {
        out.clinicalNote = parts[++i]
      } else if (/JSON OUTPUT/i.test(p)) {
        // Medical-scribe format: header in this segment, JSON in the next
        // Alert format: both "JSON OUTPUT" and the JSON are in the same segment
        const txt = parts[i + 1] ? parts[++i] : p
        try {
          const s = txt.indexOf('{'), e = txt.lastIndexOf('}') + 1
          if (s >= 0) out.jsonData = JSON.parse(txt.slice(s, e))
        } catch (_) {}
      }
    }

    // Fallback: scan full text for a JSON block if section parsing missed it
    if (!out.jsonData) {
      try {
        const s = cleaned.indexOf('{'), e = cleaned.lastIndexOf('}') + 1
        if (s >= 0) out.jsonData = JSON.parse(cleaned.slice(s, e))
      } catch (_) {}
    }
  } else {
    // No === separators — treat entire response as the clinical note
    out.clinicalNote = cleaned
    const jsonMatch = cleaned.match(/```json([\s\S]*?)```/)
    if (jsonMatch) {
      try { out.jsonData = JSON.parse(jsonMatch[1].trim()) } catch (_) {}
    }
  }

  // Universal fallback: always scan full text for Doctor/Patient lines when
  // the conversation block is still empty (happens when the LLM omits === separators
  // or puts everything in a single segment with hasSections=false)
  if (!out.conversation) {
    const convLines = cleaned.split('\n').filter(l =>
      /^\*{0,2}(Doctor|Patient)\*{0,2}:/i.test(l.trim())
    )
    if (convLines.length > 0) out.conversation = convLines.join('\n')
  }

  // Decide rendering mode for the clinical note section
  if (isMarkdown(out.clinicalNote)) {
    out.isMarkdown = true
  } else if (out.clinicalNote) {
    const lines = out.clinicalNote.split('\n')
    let key = '', vals = []
    for (const ln of lines) {
      const m = ln.match(/^([A-Za-z][A-Za-z /]+?):\s*(.*)/)
      if (m && !ln.trim().startsWith('-')) {
        if (key) out.sections[key] = vals.join('\n').trim()
        key = m[1].trim()
        vals = [m[2].trim()]
      } else {
        vals.push(ln)
      }
    }
    if (key) out.sections[key] = vals.join('\n').trim()
  }

  return out
}

export const SECTION_ICONS = {
  'Chief Complaint':                'stethoscope',
  'History of Present Illness':     'book-open',
  'Symptoms':                       'activity',
  'Duration':                       'clock',
  'Past Medical History':           'archive',
  'Current Medications':            'pill',
  'Medications':                    'pill',
  'Allergies':                      'alert-triangle',
  'Vital Signs':                    'heart-pulse',
  'Recommended Tests':              'flask-conical',
  'Assessment':                     'search',
  'Diagnosis':                      'search',
  'Plan':                           'clipboard-list',
  'Treatment Plan':                 'clipboard-list',
  'Follow-up':                      'calendar-check',
  'Follow-up Instructions':         'calendar-check',
}
