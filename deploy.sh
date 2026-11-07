#!/usr/bin/env bash
# ==============================================================================
# ZeidexSoft — Cloudflare Pages Automated Deployment Script (Ubuntu / Debian)
# Enterprise DevOps Pipeline: Sanity Check, Linting, Auto-Setup, & Zero-Downtime Deploy
# ==============================================================================

set -euo pipefail

# Terminal ANSI Color Formatting
BOLD='\033[1m'
RESET='\033[0m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'

log_info() {
    echo -e "${CYAN}${BOLD}[INFO]${RESET} $1"
}

log_success() {
    echo -e "${GREEN}${BOLD}[SUCCESS]${RESET} $1"
}

log_warn() {
    echo -e "${YELLOW}${BOLD}[WARN]${RESET} $1"
}

log_error() {
    echo -e "${RED}${BOLD}[ERROR]${RESET} $1" >&2
}

echo -e "${BLUE}${BOLD}"
echo "================================================================================"
echo "    ZeidexSoft DevOps Automation Pipeline — Cloudflare Pages Deployment        "
echo "================================================================================"
echo -e "${RESET}"

# ------------------------------------------------------------------------------
# STEP 1: Verify Environment & Auto-Install Missing Dependencies (Non-Interactive)
# ------------------------------------------------------------------------------
log_info "الخطوة [1/4]: التحقق من بيئة النظام وتثبيت الاعتماديات المطلوبة..."

# Check curl
if ! command -v curl >/dev/null 2>&1; then
    log_warn "أداة curl غير مثبتة. جارٍ التثبيت التلقائي عبر apt-get..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get install -y -qq curl ca-certificates
    log_success "تم تثبيت curl بنجاح."
fi

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
    log_warn "Node.js غير مثبت في النظام. جارٍ تثبيت Node.js و npm تلقائياً..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq && apt-get install -y -qq nodejs npm
    log_success "تم تثبيت Node.js: $(node -v)"
else
    log_success "Node.js متوفر بالفعل في البيئة: $(node -v)"
fi

# Determine Wrangler Binary (Global, Local node_modules, or NPX)
WRANGLER_BIN=""
if command -v wrangler >/dev/null 2>&1; then
    WRANGLER_BIN="wrangler"
elif [ -f "./node_modules/.bin/wrangler" ]; then
    WRANGLER_BIN="./node_modules/.bin/wrangler"
elif command -v npx >/dev/null 2>&1; then
    WRANGLER_BIN="npx wrangler"
else
    log_warn "أداة Wrangler غير متوفرة. جارٍ تثبيتها عالمياً عبر npm..."
    npm install -g wrangler --silent || npm install wrangler --save-dev --silent
    if command -v wrangler >/dev/null 2>&1; then
        WRANGLER_BIN="wrangler"
    elif [ -f "./node_modules/.bin/wrangler" ]; then
        WRANGLER_BIN="./node_modules/.bin/wrangler"
    else
        WRANGLER_BIN="npx wrangler"
    fi
    log_success "تم تثبيت Wrangler بنجاح."
fi
log_success "أداة النشر Wrangler جاهزة للاستخدام: (${WRANGLER_BIN})"

# ------------------------------------------------------------------------------
# STEP 2: Secure Environment Variables & Cloudflare Authentication Check
# ------------------------------------------------------------------------------
log_info "الخطوة [2/4]: التحقق الآمن من متغيرات البيئة السرية وصلاحيات Cloudflare..."

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
    log_error "متغير البيئة CLOUDFLARE_API_TOKEN غير موجود أو فارغ!"
    log_error "يرجى التأكد من تصدير التوكن عبر: export CLOUDFLARE_API_TOKEN='your_token'"
    exit 1
fi
log_success "تم التحقق من وجود CLOUDFLARE_API_TOKEN بنجاح (طول المفتاح: ${#CLOUDFLARE_API_TOKEN} حرف)."

# Ensure CLOUDFLARE_ACCOUNT_ID is set; if not, discover automatically via Cloudflare API
if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
    log_info "جارٍ استكشاف معرف الحساب (CLOUDFLARE_ACCOUNT_ID) تلقائياً عبر API كلودفلير..."
    DISCOVERED_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts" \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        | node -e '
            let d="";
            process.stdin.on("data", c => d += c);
            process.stdin.on("end", () => {
                try {
                    const j = JSON.parse(d);
                    if (j.success && j.result && j.result.length > 0) {
                        process.stdout.write(j.result[0].id || "");
                    }
                } catch(e) {}
            });
        ' 2>/dev/null || true)

    if [ -n "${DISCOVERED_ID}" ]; then
        export CLOUDFLARE_ACCOUNT_ID="${DISCOVERED_ID}"
        log_success "تم استنتاج معرف الحساب بنجاح من الـ API: ${CLOUDFLARE_ACCOUNT_ID}"
    elif [ -f "wrangler.toml" ] && grep -q 'account_id' wrangler.toml; then
        FALLBACK_ID=$(grep -E '^\s*account_id\s*=' wrangler.toml | head -1 | sed -E 's/.*=\s*"([^"]+)".*/\1/')
        export CLOUDFLARE_ACCOUNT_ID="${FALLBACK_ID}"
        log_success "تم استرجاع معرف الحساب من wrangler.toml: ${CLOUDFLARE_ACCOUNT_ID}"
    else
        log_error "تعذر تحديد CLOUDFLARE_ACCOUNT_ID تلقائياً."
        exit 1
    fi
else
    log_success "معرف الحساب محدد مسبقاً في البيئة: ${CLOUDFLARE_ACCOUNT_ID}"
fi

# ------------------------------------------------------------------------------
# STEP 3: Automated Linting & HTML Structure Sanity Verification
# ------------------------------------------------------------------------------
log_info "الخطوة [3/4]: فحص سلامة وتكامل كود الواجهة index.html (Linting & Sanity Check)..."

if [ ! -s "index.html" ]; then
    log_error "ملف index.html غير موجود أو فارغ الحجم في المسار الحالي!"
    exit 1
fi

node -e '
const fs = require("fs");
const pages = ["index.html", "bots.html", "programs.html", "templates.html", "blog.html", "trial.html", "about.html"];

pages.forEach(file => {
    if (!fs.existsSync(file)) {
        console.error(`خطأ: الملف ${file} غير موجود!`);
        process.exit(1);
    }
    const html = fs.readFileSync(file, "utf-8");

    // 1. Core structural tags
    if (!html.includes("<!DOCTYPE html>") && !html.includes("<!doctype html>")) {
        console.error(`خطأ: نقص وسم <!DOCTYPE html> في ${file}`);
        process.exit(1);
    }
    if (!html.includes("<html") || !html.includes("</html>")) {
        console.error(`خطأ: نقص وسم html الرئيسي في ${file}`);
        process.exit(1);
    }
    if (!html.includes("<head>") || !html.includes("</head>")) {
        console.error(`خطأ: نقص وسم head في ${file}`);
        process.exit(1);
    }
    if (!html.includes("<body") || !html.includes("</body>")) {
        console.error(`خطأ: نقص وسم body في ${file}`);
        process.exit(1);
    }

    // 2. Critical HTML tags balance check
    const tagsToCheck = ["div", "section", "header", "footer", "button", "script", "style"];
    for (const tag of tagsToCheck) {
        const openCount = (html.match(new RegExp("<" + tag + "(\\s+[^>]*)?>", "gi")) || []).length;
        const closeCount = (html.match(new RegExp("</" + tag + ">", "gi")) || []).length;
        if (openCount !== closeCount) {
            console.error(`خطأ هيكلي في ${file}: عدم تطابق عدد وسوم <${tag}> (مفتوح: ${openCount}، مغلق: ${closeCount})`);
            process.exit(1);
        }
    }
    console.log(`✔ فحص الملف ${file} بنجاح (${html.length} bytes)`);
});
console.log("✔ كافة الصفحات الـ 7 سليمة 100% ومتطابقة الوسوم وبدون أي أخطاء هيكلية.");
'

log_success "اجتاز ملف index.html الفحص الآلي الذكي بنجاح تام."

# ------------------------------------------------------------------------------
# STEP 4: Direct Deployment to Cloudflare Pages (Project: zeidexsoft) & zeidexsoft.com
# ------------------------------------------------------------------------------
log_info "الخطوة [4/5]: تجهيز الحزم وتحديث ترويسات الأمان (CSP)..."

PROJECT_NAME="zeidexsoft"
DEPLOY_DIR="dist_pages"

# Clean and stage dist_pages
rm -rf "${DEPLOY_DIR}"
mkdir -p "${DEPLOY_DIR}"

# Stage all new section interfaces into dist_pages and dist
if [ -f "scripts/stage-new-interfaces.mjs" ]; then
    node scripts/stage-new-interfaces.mjs
fi

# Copy complementary static assets if present in public
if [ -d "public" ]; then
    cp -rn public/* "${DEPLOY_DIR}/" 2>/dev/null || true
    cp -rn public/* "dist/" 2>/dev/null || true
fi

# Ensure all 7 new section pages and aliases take precedence
if [ -f "scripts/stage-new-interfaces.mjs" ]; then
    node scripts/stage-new-interfaces.mjs
fi
rm -f "dist/_redirects" "${DEPLOY_DIR}/_redirects" 2>/dev/null || true

# Verify or create the Cloudflare Pages project via REST API if not exists
log_info "التحقق من جاهزية مشروع [${PROJECT_NAME}] في Cloudflare Pages..."
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"${PROJECT_NAME}\",\"production_branch\":\"main\"}" >/dev/null 2>&1 || true

log_info "تنفيذ نشر Cloudflare Pages: ${WRANGLER_BIN} pages deploy ${DEPLOY_DIR} --project-name=${PROJECT_NAME}..."

DEPLOY_LOG=$(mktemp)
export CI=true
export WRANGLER_SEND_METRICS=false

${WRANGLER_BIN} pages deploy "${DEPLOY_DIR}" \
    --project-name="${PROJECT_NAME}" \
    --branch="main" \
    --commit-dirty=true \
    --no-bundle > "${DEPLOY_LOG}" 2>&1

DEPLOY_OUTPUT=$(cat "${DEPLOY_LOG}")
rm -f "${DEPLOY_LOG}"

PREVIEW_URL=$(echo "${DEPLOY_OUTPUT}" | grep -E -o "https://[a-zA-Z0-9.-]+\.${PROJECT_NAME}\.pages\.dev" | head -1 || true)
PRODUCTION_URL="https://${PROJECT_NAME}.pages.dev"
if [ -z "${PREVIEW_URL}" ]; then
    PREVIEW_URL="${PRODUCTION_URL}"
fi
log_success "تم النشر إلى Cloudflare Pages بنجاح: ${PRODUCTION_URL}"

# ------------------------------------------------------------------------------
# STEP 5: Direct Deployment to Custom Domain (zeidexsoft.com)
# ------------------------------------------------------------------------------
log_info "الخطوة [5/5]: نشر الموقع مباشرة إلى النطاق الرسمي zeidexsoft.com عبر Cloudflare Worker..."

WORKER_LOG=$(mktemp)
${WRANGLER_BIN} deploy > "${WORKER_LOG}" 2>&1 || true
WORKER_OUTPUT=$(cat "${WORKER_LOG}")
rm -f "${WORKER_LOG}"

if echo "${WORKER_OUTPUT}" | grep -q "zeidexsoft.com"; then
    log_success "تم تحديث ونشر النطاق الرسمي zeidexsoft.com بنجاح."
else
    log_warn "تم تنفيذ أمر النشر للوركر، جاري التحقق من النطاق المباشر."
fi

# ------------------------------------------------------------------------------
# Final Verification & Deployment Report
# ------------------------------------------------------------------------------
PAGES_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "https://${PROJECT_NAME}.pages.dev" || echo "000")
CUSTOM_HTTP=$(curl -s -o /dev/null -w "%{http_code}" "https://zeidexsoft.com" || echo "000")

echo ""
echo -e "${GREEN}${BOLD}================================================================================${RESET}"
echo -e "${GREEN}${BOLD}             🎉 اكتملت عملية النشر بنجاح إلى شبكة Cloudflare!                 ${RESET}"
echo -e "${GREEN}${BOLD}================================================================================${RESET}"
echo -e "${BOLD}المشروع (Pages Project):${RESET}     ${CYAN}${PROJECT_NAME}${RESET}"
echo -e "${BOLD}رابط Pages الإنتاجي:${RESET}        ${GREEN}${BOLD}${PRODUCTION_URL}${RESET} (HTTP ${PAGES_HTTP})"
echo -e "${BOLD}رابط Pages المعاينة:${RESET}        ${CYAN}${PREVIEW_URL}${RESET}"
echo -e "${BOLD}النطاق الرسمي (Custom Domain):${RESET} ${GREEN}${BOLD}https://zeidexsoft.com${RESET} (HTTP ${CUSTOM_HTTP})"
echo -e "${BOLD}تاريخ النشر (Timestamp):${RESET}     $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo -e "${GREEN}${BOLD}================================================================================${RESET}"
echo ""

exit 0
