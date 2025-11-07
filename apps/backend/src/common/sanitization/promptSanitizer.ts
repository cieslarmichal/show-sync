/**
 * Sanitizes user input for use in AI prompts to prevent prompt injection
 */
export class PromptSanitizer {
  /**
   * Sanitize text for safe use in AI prompts
   * Removes potentially dangerous characters and patterns
   */
  public static sanitize(input: string): string {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Remove excessive newlines (keep max 2 consecutive)
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

    // Remove control characters except newline and tab
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Escape common prompt injection markers
    sanitized = sanitized.replace(/```/g, "'''");

    // Remove excessive spaces
    sanitized = sanitized.replace(/\s{5,}/g, '    ');

    return sanitized.trim();
  }

  /**
   * Remove any text that looks like system instructions or role switching
   */
  public static removeInstructionPatterns(input: string): string {
    let sanitized = input;

    // Remove common prompt injection patterns (case-insensitive)
    const dangerousPatterns = [
      /ignore (previous|all|the above) (instructions|prompts)/gi,
      /forget (previous|all|the above) (instructions|prompts)/gi,
      /ignore (all|the above|everything)/gi,
      /you are now/gi,
      /new instructions:/gi,
      /system:/gi,
      /assistant:/gi,
      /\[system\]/gi,
      /\[assistant\]/gi,
    ];

    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized.trim();
  }

  /**
   * Full sanitization for prompt inputs
   * Use this for all user input going into AI prompts
   */
  public static sanitizeForPrompt(input: string): string {
    return this.removeInstructionPatterns(this.sanitize(input));
  }
}
