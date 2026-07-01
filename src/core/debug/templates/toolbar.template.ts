import { StyleTemplate } from "./styles.template";

export interface ToolbarTemplateData {
    statusCode: number;
    profilerUrl: string;
    statusCls: string;
    appVersion: string;
    blocks: string;
}

export class ToolbarTemplate {
    private readonly styles = new StyleTemplate();

    render(data: ToolbarTemplateData): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>OptiCoreJs Debug Toolbar</title>
<style>${this.styles.getCss()}</style>
</head>
<body>
<div class="toolbar" id="wdt">
  <a href="${data.profilerUrl}" class="tb-badge tb-badge--${data.statusCls}">${data.statusCode}</a>
  ${data.blocks}
  <div class="tb-spacer"></div>
  <a href="${data.profilerUrl}" class="tb-brand">
    <div class="tb-brand-icon">OP</div>
    <span>Server</span>
  </a>
  <div class="tb-version">${data.appVersion}</div>
  <button class="tb-close" onclick="document.getElementById('wdt').style.display='none'" title="Close toolbar">
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
</div>
</body>
</html>`;
    }
}
