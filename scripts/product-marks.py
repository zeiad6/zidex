"""Generate the ZeidexSoft product marks (one app-icon SVG per store SKU).

One system, seven marks: same canvas, radius, grid, gloss and Z badge; each product
gets its own gradient and a glyph drawn for it. Rasterised by ffmpeg's librsvg:

    python3 scripts/product-marks.py && for f in public/store/img/products/*.svg; do
      ffmpeg -loglevel error -y -i "$f" -vf scale=512:512 "${f%.svg}.png"; done
"""
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "public" / "store" / "img" / "products"

# sku: (from, to, accent, glyph markup on a 512 canvas, stroke = white)
MARKS = {
    # Starter store: a shopping bag carrying a star.
    "store-bot-basic": ("#4f3fd9", "#00a88c", "#7ef2d9",
        '<path d="M150 200h212l-18 190a26 26 0 0 1-26 24H194a26 26 0 0 1-26-24z"/>'
        '<path d="M206 200v-22a50 50 0 0 1 100 0v22"/>'
        '<path class="a" d="m256 262 14 29 32 4-23 22 6 32-29-15-29 15 6-32-23-22 32-4z"/>'),
    # Pro store: a storefront awning with a crown.
    "store-bot-pro": ("#7c3aed", "#db2777", "#ffd166",
        '<path d="M140 232h232v150a20 20 0 0 1-20 20H160a20 20 0 0 1-20-20z"/>'
        '<path d="M128 232l22-62h212l22 62"/><path d="M128 232c0 22 26 34 43 20 17 14 43 14 57 0 14 14 40 14 57 0 17 14 43 2 43-20"/>'
        '<path class="a" d="m196 330 20 24 40-46 40 46 20-24v56H196z"/>'),
    # Hosting: stacked servers with a live pulse.
    "store-bot-hosting": ("#0e7490", "#2563eb", "#5eead4",
        '<rect x="140" y="150" width="232" height="86" rx="20"/><rect x="140" y="276" width="232" height="86" rx="20"/>'
        '<path d="M180 193h.01M180 319h.01"/>'
        '<path class="a" d="M232 319h28l14-26 22 52 14-26h22"/>'),
    # 50 posts: a megaphone sending stacked messages.
    "post-50": ("#4338ca", "#0891b2", "#a5b4fc",
        '<path d="M150 230v52l118 58V172z"/><path d="M150 282l18 74h34l-12-60"/>'
        '<path class="a" d="M310 212c26 14 26 74 0 88M344 186c46 28 46 112 0 140"/>'),
    # Monthly pin: a pushpin over a calendar tick.
    "pin-month": ("#e11d48", "#f59e0b", "#fde68a",
        '<path d="M214 140h84l-12 76 52 40H174l52-40z"/><path d="M256 256v118"/>'
        '<path class="a" d="M190 392h132"/>'),
    # Archive: a box of indexed records.
    "archive-5k": ("#b45309", "#dc2626", "#fed7aa",
        '<rect x="136" y="150" width="240" height="62" rx="14"/><path d="M152 212h208v138a22 22 0 0 1-22 22H174a22 22 0 0 1-22-22z"/>'
        '<path class="a" d="M226 262h60M226 302h40"/>'),
    # Pro dashboard: a gauge reaching its peak.
    "panel-pro": ("#0369a1", "#7c3aed", "#bae6fd",
        '<path d="M140 330a116 116 0 0 1 232 0"/><path d="M168 330h176"/>'
        '<path class="a" d="m256 330 58-70"/><circle class="a" cx="256" cy="330" r="12"/>'),
    # Group manager: a shield with a check.
    "group-bot": ("#1d4ed8", "#0f766e", "#86efac",
        '<path d="M256 132l112 40v78c0 74-48 124-112 146-64-22-112-72-112-146v-78z"/>'
        '<path class="a" d="m206 262 34 34 68-72"/>'),
    # Customer support: a headset with a speech dot.
    "support-bot": ("#0f766e", "#6d28d9", "#fbcfe8",
        '<path d="M150 290v-40a106 106 0 0 1 212 0v40"/><rect x="132" y="282" width="56" height="86" rx="18"/>'
        '<rect x="324" y="282" width="56" height="86" rx="18"/><path class="a" d="M352 368c0 30-30 46-74 46h-22"/>'),
    # Booking: a calendar with a booked tick.
    "booking-bot": ("#c2410c", "#7c3aed", "#fde68a",
        '<rect x="140" y="160" width="232" height="212" rx="26"/><path d="M140 222h232M200 136v48M312 136v48"/>'
        '<path class="a" d="m214 296 30 30 56-60"/>'),
    # Paid subscriptions: a cut gem.
    "subs-bot": ("#6d28d9", "#0891b2", "#a5f3fc",
        '<path d="M176 168h160l52 72-132 150-132-150z"/><path d="M124 240h264"/>'
        '<path class="a" d="m216 168-24 72 64 150 64-150-24-72"/>'),
    # Quiz: a lightbulb with a question spark.
    "quiz-bot": ("#ca8a04", "#db2777", "#fef08a",
        '<path d="M256 130a92 92 0 0 1 56 165v37h-112v-37a92 92 0 0 1 56-165z"/><path d="M214 370h84"/>'
        '<path class="a" d="M232 212a26 26 0 1 1 34 25c-6 3-10 8-10 15v6M256 286h.01"/>'),
    # AI assistant: a chip with a spark.
    "ai-bot": ("#111827", "#6d5cff", "#5eead4",
        '<rect x="160" y="160" width="192" height="192" rx="34"/><path d="M208 122v38M304 122v38M208 352v38M304 352v38M122 208h38M122 304h38M352 208h38M352 304h38"/>'
        '<path class="a" d="M256 206l12 32 32 12-32 12-12 32-12-32-32-12 32-12z"/>'),
    # Multi-bot CRM: four bot panels wired to one hub.
    "multibot-crm": ("#1e3a8a", "#0d9488", "#99f6e4",
        '<rect x="132" y="132" width="96" height="96" rx="24"/><rect x="284" y="132" width="96" height="96" rx="24"/>'
        '<rect x="132" y="284" width="96" height="96" rx="24"/><rect x="284" y="284" width="96" height="96" rx="24"/>'
        '<circle class="a" cx="256" cy="256" r="22"/><path class="a" d="M228 228l14 14M284 228l-14 14M228 284l14-14M284 284l-14-14"/>'),
    # Workflow engine: three steps joined into one automated path.
    "workflow-engine": ("#9333ea", "#0369a1", "#f0abfc",
        '<rect x="128" y="150" width="104" height="72" rx="20"/><rect x="280" y="290" width="104" height="72" rx="20"/>'
        '<path d="M232 186h40a36 36 0 0 1 36 36v68"/>'
        '<path class="a" d="M180 222v58a36 36 0 0 0 36 36h64M262 296l18 20-18 20"/>'),
    # WhatsApp suite: two conversations kept in sync (a generic chat mark, not the logo).
    "whatsapp-bot-pro": ("#047857", "#0e7490", "#bbf7d0",
        '<path d="M140 168h168a28 28 0 0 1 28 28v84a28 28 0 0 1-28 28h-96l-52 40v-40h-20a28 28 0 0 1-28-28v-84a28 28 0 0 1 28-28z"/>'
        '<path class="a" d="M352 236h20a28 28 0 0 1 28 28v76a28 28 0 0 1-28 28h-14v34l-42-34h-60a28 28 0 0 1-28-28v-12"/>'
        '<path class="a" d="M190 238l24 24 48-48"/>'),
}

TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>
    <radialGradient id="gloss" cx=".3" cy=".1" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0v32" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="2"/></pattern>
    <filter id="lift" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#000" flood-opacity=".28"/></filter>
    <clipPath id="tile"><rect width="512" height="512" rx="116"/></clipPath>
  </defs>
  <g clip-path="url(#tile)">
    <rect width="512" height="512" fill="url(#bg)"/>
    <rect width="512" height="512" fill="url(#grid)"/>
    <circle cx="430" cy="430" r="190" fill="{c}" opacity=".16"/>
    <rect width="512" height="512" fill="url(#gloss)"/>
  </g>
  <g filter="url(#lift)" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round" stroke-linejoin="round">
    <style>.a{{stroke:{c};fill:none}} circle.a{{fill:{c};stroke:none}}</style>
    {glyph}
  </g>
  <g transform="translate(392 52)">
    <rect width="68" height="68" rx="20" fill="#fff" fill-opacity=".18" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <path d="M22 22h24L22 46h24" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>
"""

if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for sku, (a, b, c, glyph) in MARKS.items():
        (OUT / f"{sku}.svg").write_text(TEMPLATE.format(a=a, b=b, c=c, glyph=glyph), encoding="utf-8")
    # The storefront tints each card's backdrop from its own mark, so no two read alike.
    import json

    tints = {sku: [a, b, c] for sku, (a, b, c, _) in MARKS.items()}
    (OUT / "tints.json").write_text(json.dumps(tints, indent=1) + "\n", encoding="utf-8")
    print(f"{len(MARKS)} marks → {OUT}")
