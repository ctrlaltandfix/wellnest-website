export function reportBrand(logoPath) {
  return '<div class="report-brand" role="img" aria-label="WellNest"><svg viewBox="0 0 437 70" width="144" height="23" aria-hidden="true"><image href="' + logoPath + '" width="437" height="70"/></svg></div>';
}

export const reportFont = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@700;800&display=swap">';

export const reportBrandStyles = `
  .report-brand{display:inline-flex;align-items:center}
  .report-brand svg{display:block;flex:none}
`;
