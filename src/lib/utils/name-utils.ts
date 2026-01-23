/**
 * Name Utilities
 */

/**
 * Formats a name to show only the first name in Title Case (Camel Case as per user request).
 * Example: "nitant bhartia" -> "Nitant"
 * Example: "APPLE USER" -> "Apple"
 * 
 * @param name The full name string
 * @returns The formatted first name
 */
export const formatFirstName = (name: string | null | undefined): string => {
    if (!name) return '';

    const lowercaseName = name.toLowerCase().trim();

    // Ignore generic placeholders
    if (
        lowercaseName === 'apple user' ||
        lowercaseName === 'apple' ||
        lowercaseName === 'explorer' ||
        lowercaseName === 'user'
    ) {
        return '';
    }

    // Get the first part of the name
    const firstName = name.trim().split(' ')[0];

    if (!firstName) return '';

    // Capitalize first letter, lowercase the rest
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
};
