export function buildPitchErrorsPayload(offKeyEvents, lyrics) {
    const lines = Array.isArray(lyrics) ? lyrics : []
    const payload = { err: [] }

    for (let i = 0; i < lines.length; i++) {
        const start = lines[i]?.timestamp ?? 0
        const end = i < lines.length - 1 ? (lines[i + 1]?.timestamp ?? Infinity) : Infinity
        const text = lines[i]?.text ?? ''

        const list = (offKeyEvents || [])
            .filter(e => e.timeMs >= start && e.timeMs < end)
            .map(e => e.freq)

        if (list.length > 0) {
            payload.err.push({
                "off-key": list,
                lyrics: text
            })
        }
    }

    return payload
}

export function downloadJson(payload, fileName) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a) // helps Firefox
    a.click()
    document.body.removeChild(a)

    URL.revokeObjectURL(url)
}
