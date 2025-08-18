import DOMPurify from 'dompurify';

/**
 * Safely sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'span', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['class'],
    FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'],
    FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Parse markdown formatting safely
 * @param text - Text with markdown formatting
 * @returns Sanitized HTML string
 */
export const parseMarkdownSafely = (text: string): string => {
  // Convert basic markdown to HTML
  const htmlText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-gray-100">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Sanitize the resulting HTML
  return sanitizeHtml(htmlText);
};

/**
 * Highlight numbers in text safely
 * @param text - Text containing numbers to highlight
 * @returns Sanitized HTML string with highlighted numbers
 */
export const highlightNumbersSafely = (text: string): string => {
  const highlightedText = text.replace(
    /(\d+[\d\s]*,?\d*\.?\d*)\s?(SEK|%|kr)/gi, 
    '<span class="font-bold text-primary">$1 $2</span>'
  );
  
  return sanitizeHtml(highlightedText);
};