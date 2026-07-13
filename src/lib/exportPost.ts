const PDF_STYLES = `
  h1,h2,h3,h4{font-weight:700;color:#1e293b;line-height:1.3;margin:1.5em 0 0.5em}
  h1{font-size:2.25em;font-weight:800;margin-top:0}
  h2{font-size:1.5em}
  h3{font-size:1.25em;font-weight:600}
  p{margin:0 0 1.25em}
  ul,ol{padding-left:1.625em;margin:0 0 1.25em}
  li{margin:0.5em 0}
  img{max-width:100%;height:auto;border-radius:0.5em;margin:2em 0;display:block}
  a{color:#1e293b;font-weight:600;text-decoration:underline}
  blockquote{font-style:italic;border-left:0.25rem solid #e2e8f0;padding-left:1em;margin:1.6em 0;color:#64748b}
  table{font-size:0.875em;width:100%;border-collapse:collapse;margin:1.25em 0}
  thead{border-bottom:1px solid #cbd5e1;text-align:left}
  th{font-weight:600;padding:0.75em 0.5em;vertical-align:bottom;border:1px solid #e2e8f0}
  td{padding:0.75em 0.5em;vertical-align:baseline;border:1px solid #e2e8f0}
  hr{margin:3em 0;border:none;border-top:1px solid #e2e8f0}
  pre{background:#f8fafc;border:1px solid #e2e8f0;border-radius:0.5em;padding:1em;overflow-x:auto;font-size:0.875em}
  code{font-size:0.875em;font-weight:600;color:#1e293b}
  pre code{font-weight:400}
  strong{color:#1e293b}
`;

function wrapContent(content: string): string {
  return `<div style="font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;font-size:1.125rem;line-height:1.7777778;color:#475569;max-width:800px;margin:0 auto;padding:2rem;white-space:pre-wrap">
<style>${PDF_STYLES}</style>
${content}</div>`;
}

export async function saveAsPdf(content: string, title: string): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  const opt = {
    margin: [0.5, 0.5, 0.5, 0.5],
    image: { type: 'jpeg', quality: 0.8 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
  };
  const element = document.createElement('div');
  element.innerHTML = wrapContent(content);
  html2pdf().set(opt).from(element).save(`${title || 'blog-post'}-${Date.now()}.pdf`);
}

export function saveAsDoc(content: string, title: string): void {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title || 'Blog Post'}</title>
<style>
  body{font-family:ui-serif,Georgia,Cambria,'Times New Roman',Times,serif;font-size:1.125rem;line-height:1.7777778;color:#475569;max-width:800px;margin:0 auto;padding:2rem;white-space:pre-wrap}
  ${PDF_STYLES}
</style>
</head>
<body>${content}</body></html>`;
  const blob = new Blob([html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title || 'blog-post'}-${Date.now()}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}
