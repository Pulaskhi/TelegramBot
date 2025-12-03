const pdfParse = require('pdf-parse')

function detectListsAndTables(text) {
  const lines = String(text).split(/\r?\n/).map(l => l.trim())
  const lists = []
  const tables = []

  // Detect lists: lines starting with -, *, •, digits or letters + ) or .
  let currentList = null
  for (const line of lines) {
    if (!line) { if (currentList) { lists.push(currentList); currentList = null } ; continue }
    const mList = line.match(/^([\-\*•]|\d+\.|[a-zA-Z]\))/)
    if (mList) {
      if (!currentList) currentList = { type: 'bulleted', items: [] }
      // remove leading bullet
      const item = line.replace(/^([\-\*•]|\d+\.|[a-zA-Z]\))\s*/, '').trim()
      currentList.items.push(item)
      continue
    }
    if (currentList) { lists.push(currentList); currentList = null }
  }
  if (currentList) lists.push(currentList)

  // Detect simple tables by looking for lines with multiple two+ spaces or pipes
  const candidateRows = []
  for (const line of lines) {
    if (!line) continue
    if (line.includes('|')) {
      candidateRows.push(line)
      continue
    }
    // multiple 2+ spaces or tab characters hint at columns
    if (/\s{2,}|\t/.test(line)) candidateRows.push(line)
  }

  // Group consecutive candidateRows into tables
  let tableGroup = []
  for (let i = 0; i < candidateRows.length; i++) {
    const row = candidateRows[i]
    // find index of row in original lines to test adjacency
    // we will simply group by proximity: if previous row index +1 == current index
    // compute index
    const idx = lines.findIndex(l => l === row)
    if (tableGroup.length === 0) { tableGroup.push({ row, idx }) ; continue }
    const prev = tableGroup[tableGroup.length - 1]
    if (idx === prev.idx + 1) {
      tableGroup.push({ row, idx })
    } else {
      if (tableGroup.length >= 2) tables.push(parseTableRows(tableGroup.map(r => r.row)))
      tableGroup = [{ row, idx }]
    }
  }
  if (tableGroup.length >= 2) tables.push(parseTableRows(tableGroup.map(r => r.row)))

  return { lists, tables }
}

function parseTableRows(rows) {
  // Try parse by pipe first
  const parsed = rows.map(r => {
    if (r.includes('|')) return r.split('|').map(c => c.trim()).filter(Boolean)
    // otherwise split by multiple spaces or tabs
    const cols = r.split(/\s{2,}|\t/).map(c => c.trim()).filter(Boolean)
    return cols
  })

  // If first row looks like header (all non-numeric), use it
  const header = parsed[0].length > 1 ? parsed[0] : null
  const body = header ? parsed.slice(1) : parsed

  // build CSV
  const csvRows = []
  if (header) csvRows.push(header.join(','))
  body.forEach(r => csvRows.push(r.join(',')))

  return { header: header || [], rows: body, csv: csvRows.join('\n') }
}

async function parsePDFBuffer(buffer, filename = '') {
  const data = await pdfParse(buffer)
  const text = (data && data.text) ? String(data.text) : ''
  const { lists, tables } = detectListsAndTables(text)
  return { text, lists, tables }
}

module.exports = { parsePDFBuffer }
