import { inject, Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Toolbar, ToolbarItem } from '../models/toolbar.model';

@Injectable({
  providedIn: 'root',
})
export class SvgExportService {
  private dbService = inject(DatabaseService);

  // Robust fallback mapping of common Font Awesome class names to their Unicode values.
  // This is a safety measure in case the CDN stylesheet cannot be queried due to CORS or network issues.
  private COMMON_FA_UNICODES: { [key: string]: string } = {
    'fa-home': '\uf015',
    'fa-search': '\uf002',
    'fa-cog': '\uf013',
    'fa-cogs': '\uf085',
    'fa-user': '\uf007',
    'fa-user-cog': '\uf4fe',
    'fa-users': '\uf0c0',
    'fa-bell': '\uf0f3',
    'fa-bell-slash': '\uf1f6',
    'fa-envelope': '\uf0e0',
    'fa-bars': '\uf0c9',
    'fa-times': '\uf00d',
    'fa-times-circle': '\uf057',
    'fa-check': '\uf00c',
    'fa-check-circle': '\uf058',
    'fa-exclamation-triangle': '\uf071',
    'fa-exclamation-circle': '\uf06a',
    'fa-info-circle': '\uf05a',
    'fa-question-circle': '\uf059',
    'fa-external-link-alt': '\uf35d',
    'fa-save': '\uf0c7',
    'fa-trash': '\uf1f8',
    'fa-trash-alt': '\uf2ed',
    'fa-pencil-alt': '\uf303',
    'fa-edit': '\uf044',
    'fa-plus': '\uf067',
    'fa-plus-circle': '\uf055',
    'fa-plus-square': '\uf0fe',
    'fa-minus': '\uf068',
    'fa-minus-circle': '\uf056',
    'fa-minus-square': '\uf146',
    'fa-download': '\uf019',
    'fa-upload': '\uf093',
    'fa-share': '\uf064',
    'fa-share-alt': '\uf1e0',
    'fa-sync': '\uf021',
    'fa-sync-alt': '\uf2f1',
    'fa-redo': '\uf01e',
    'fa-redo-alt': '\uf2f9',
    'fa-undo': '\uf0e2',
    'fa-undo-alt': '\uf2ea',
    'fa-play': '\uf04b',
    'fa-play-circle': '\uf144',
    'fa-pause': '\uf04c',
    'fa-pause-circle': '\uf144',
    'fa-stop': '\uf04d',
    'fa-stop-circle': '\uf28d',
    'fa-forward': '\uf04e',
    'fa-backward': '\uf04a',
    'fa-magic': '\uf0d0',
    'fa-bolt': '\uf0e7',
    'fa-link': '\uf0c1',
    'fa-unlink': '\uf127',
    'fa-paper-plane': '\uf1d8',
    'fa-print': '\uf02f',
    'fa-eye': '\uf06e',
    'fa-eye-slash': '\uf070',
    'fa-folder': '\uf07b',
    'fa-folder-open': '\uf07c',
    'fa-file': '\uf15b',
    'fa-file-alt': '\uf15c',
    'fa-file-pdf': '\uf1c1',
    'fa-file-word': '\uf1c2',
    'fa-file-excel': '\uf1c3',
    'fa-file-powerpoint': '\uf1c4',
    'fa-file-image': '\uf1c5',
    'fa-file-archive': '\uf1c6',
    'fa-file-audio': '\uf1c7',
    'fa-file-video': '\uf1c8',
    'fa-file-code': '\uf1c9',
    'fa-bold': '\uf032',
    'fa-italic': '\uf033',
    'fa-underline': '\uf0cd',
    'fa-strikethrough': '\uf0cc',
    'fa-align-left': '\uf036',
    'fa-align-center': '\uf037',
    'fa-align-right': '\uf038',
    'fa-align-justify': '\uf039',
    'fa-list': '\uf03a',
    'fa-list-ol': '\uf0cb',
    'fa-list-ul': '\uf0ca',
    'fa-indent': '\uf03c',
    'fa-outdent': '\uf03b',
    'fa-table': '\uf0ce',
    'fa-calculator': '\uf1ec',
    'fa-calendar': '\uf073',
    'fa-calendar-alt': '\uf073',
    'fa-star': '\uf005',
    'fa-star-half': '\uf089',
    'fa-star-half-alt': '\uf123',
    'fa-heart': '\uf004',
    'fa-thumbs-up': '\uf164',
    'fa-thumbs-down': '\uf165',
    'fa-image': '\uf03e',
    'fa-images': '\uf302',
    'fa-camera': '\uf030',
    'fa-lock': '\uf023',
    'fa-lock-open': '\uf3c1',
    'fa-key': '\uf084',
    'fa-database': '\uf1c0',
    'fa-server': '\uf233',
    'fa-cloud': '\uf0c2',
    'fa-terminal': '\uf120',
    'fa-code': '\uf121',
    'fa-bug': '\uf188',
    'fa-globe': '\uf0ac',
    'fa-map-marker-alt': '\uf3c5',
    'fa-phone': '\uf095',
    'fa-comment': '\uf075',
    'fa-comments': '\uf086',
  };

  /**
   * Helper to parse Font Awesome classes and return its corresponding Unicode character.
   */
  private getFontAwesomeUnicode(iconCode: string): string {
    const classes = iconCode.split(' ');
    const faClass = classes.find(c => c.startsWith('fa-')) || iconCode;

    // 1. Try to read from document.styleSheets dynamically (very robust)
    try {
      for (let i = 0; i < document.styleSheets.length; i++) {
        const sheet = document.styleSheets[i];
        try {
          const rules = sheet.cssRules || sheet.rules;
          if (!rules) continue;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j] as CSSStyleRule;
            if (rule.selectorText && (
              rule.selectorText.includes(`.${faClass}::before`) || 
              rule.selectorText.includes(`.${faClass}:before`)
            )) {
              let content = rule.style.content;
              if (content) {
                // Strip quotes
                content = content.replace(/['"]/g, '');
                if (content.startsWith('\\')) {
                  const codePoint = parseInt(content.substring(1), 16);
                  return String.fromCodePoint(codePoint);
                } else if (content.length === 1) {
                  return content;
                } else {
                  const codePoint = content.charCodeAt(0);
                  return String.fromCharCode(codePoint);
                }
              }
            }
          }
        } catch (e) {
          // Cross-origin styles sheet might throw an error, which is fine, we continue
        }
      }
    } catch (e) {
      // Ignore main document level styleErrors
    }

    // 2. Check in our extensive fallback mapping
    if (this.COMMON_FA_UNICODES[faClass]) {
      return this.COMMON_FA_UNICODES[faClass];
    }

    // 3. Ultimate safe fallback: question mark icon
    return '\uf059';
  }

  /**
   * Generates a fully responsive, self-contained, optimized SVG toolbar.
   */
  async generateSvg(toolbar: Toolbar): Promise<string> {
    const items = toolbar.items || [];
    const N = items.length;

    // Sizing calculations
    const btnSize = 48;
    const gap = 8;
    const padding = 12;
    const toolbarHeight = padding * 2 + btnSize; // 12 + 48 + 12 = 72px
    const toolbarWidth = N === 0 ? 150 : padding * 2 + N * btnSize + (N - 1) * gap;

    // Setup basic SVG container and style declarations
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${toolbarWidth}" height="${toolbarHeight}" viewBox="0 0 ${toolbarWidth} ${toolbarHeight}" style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <style>
      @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css');
      .toolbar-bg {
        fill: #111827;
        stroke: #374151;
        stroke-width: 1.5;
        rx: 12px;
      }
      .btn-bg {
        fill: #1f2937;
        stroke: #374151;
        stroke-width: 1px;
        rx: 8px;
        transition: fill 0.2s, stroke 0.2s;
      }
      .btn-group {
        cursor: pointer;
      }
      .btn-group:hover .btn-bg {
        fill: #4f46e5;
        stroke: #818cf8;
      }
      .icon-text {
        font-family: "Font Awesome 6 Free", "Font Awesome 5 Free", "FontAwesome", sans-serif;
        font-weight: 900;
        fill: #e5e7eb;
        font-size: 18px;
        text-anchor: middle;
        dominant-baseline: central;
        transition: fill 0.2s;
      }
      .btn-group:hover .icon-text {
        fill: #ffffff;
      }
      .placeholder-text {
        font-size: 14px;
        fill: #9ca3af;
        text-anchor: middle;
        dominant-baseline: central;
      }
    </style>
  </defs>

  <!-- Toolbar Background -->
  <rect x="0.75" y="0.75" width="${toolbarWidth - 1.5}" height="${toolbarHeight - 1.5}" class="toolbar-bg" />
`;

    if (N === 0) {
      svgContent += `  <text x="${toolbarWidth / 2}" y="${toolbarHeight / 2}" class="placeholder-text">Empty Toolbar</text>\n`;
    } else {
      // Loop and draw buttons
      for (let i = 0; i < N; i++) {
        const item = items[i];
        const btnX = padding + i * (btnSize + gap);
        const btnY = padding;

        svgContent += `  <!-- Button ${i + 1}: ${item.tooltip || 'Action'} -->\n`;
        svgContent += `  <g class="btn-group" transform="translate(${btnX}, ${btnY})">\n`;
        if (item.tooltip) {
          svgContent += `    <title>${item.tooltip}</title>\n`;
        }

        // Draw button shape
        svgContent += `    <rect x="0" y="0" width="${btnSize}" height="${btnSize}" class="btn-bg" />\n`;

        // Render Icon
        if (item.iconType === 'user') {
          try {
            const imageId = parseInt(item.iconCode, 10);
            if (!isNaN(imageId)) {
              const imageRecord = await this.dbService.getImageById(imageId);
              if (imageRecord && imageRecord.data) {
                // User custom image is Base64 encoded.
                // We draw it centered as a 24x24 px square
                const imgSize = 24;
                const imgX = (btnSize - imgSize) / 2;
                const imgY = (btnSize - imgSize) / 2;
                svgContent += `    <image href="${imageRecord.data}" x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" />\n`;
              } else {
                // Fallback icon inside button
                svgContent += `    <text x="24" y="24" class="icon-text">\uf059</text>\n`;
              }
            } else {
              // Direct base64/URL check
              const imgSize = 24;
              const imgX = (btnSize - imgSize) / 2;
              const imgY = (btnSize - imgSize) / 2;
              svgContent += `    <image href="${item.iconCode}" x="${imgX}" y="${imgY}" width="${imgSize}" height="${imgSize}" />\n`;
            }
          } catch (e) {
            // Fallback icon if query fails
            svgContent += `    <text x="24" y="24" class="icon-text">\uf059</text>\n`;
          }
        } else {
          // Font Awesome icon
          const unicodeStr = this.getFontAwesomeUnicode(item.iconCode);
          // Convert character to decimal XML entity format for maximum XML standard safety (e.g. &#xf005;)
          const entityCode = `&#x${unicodeStr.codePointAt(0)?.toString(16)};`;
          svgContent += `    <text x="24" y="24" class="icon-text">${entityCode}</text>\n`;
        }

        svgContent += `  </g>\n`;
      }
    }

    svgContent += `</svg>`;
    return svgContent;
  }

  /**
   * Helper function to trigger browser download of an SVG file.
   */
  downloadSvgFile(toolbar: Toolbar, svgString: string): void {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const fileName = `${toolbar.name.replace(/\s+/g, '_')}_toolbar.svg`;

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}
