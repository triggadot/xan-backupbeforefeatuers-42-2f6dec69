/**
 * @name set_default_product_category
 * @description Sets the default category to "Flowers" when a product category is NULL
 * 
 * This function is used as a trigger function to ensure that the category field in the gl_products
 * table is never NULL by setting a default value of "Flowers". It maintains data consistency for
 * reporting and filtering capabilities.
 * 
 * @returns {Trigger} Returns the modified NEW record with category set to 'Flowers' if it was NULL
 * 
 * @example
 * // This function is not called directly but is invoked by the set_product_category_trigger trigger:
 * CREATE TRIGGER set_product_category_trigger
 * BEFORE INSERT OR UPDATE ON public.gl_products
 * FOR EACH ROW
 * EXECUTE FUNCTION public.set_default_product_category();
 */

/**
 * SQL Definition
 * 
 * ```sql
 * CREATE OR REPLACE FUNCTION public.set_default_product_category()
 * RETURNS TRIGGER AS $$
 * BEGIN
 *   -- If category is NULL, set it to 'Flowers'
 *   IF NEW.category IS NULL THEN
 *     NEW.category := 'Flowers';
 *   END IF;
 *   
 *   RETURN NEW;
 * END;
 * $$ LANGUAGE plpgsql SECURITY DEFINER;
 * ```
 */

/**
 * Trigger Definition
 * 
 * ```sql
 * CREATE TRIGGER set_product_category_trigger
 * BEFORE INSERT OR UPDATE ON public.gl_products
 * FOR EACH ROW
 * EXECUTE FUNCTION public.set_default_product_category();
 * ```
 */

/**
 * @module database/products
 */
export interface SetDefaultProductCategoryTrigger {
  /**
   * The modified record with category set to 'Flowers' if it was NULL
   */
  NEW: {
    /**
     * The category field that will be set to 'Flowers' if NULL
     */
    category: string | null;
    
    /**
     * Other fields from the gl_products table remain unchanged
     */
    [key: string]: any;
  };
}

/**
 * Implementation Details
 * 
 * - Uses a BEFORE trigger to modify the NEW record before it's written to the database
 * - Set as SECURITY DEFINER to ensure it runs with the necessary permissions
 * - Simple NULL check with conditional assignment
 * - Follows the Glidebase pattern of using database triggers for data integrity
 * 
 * Dependencies:
 * - gl_products table with a nullable category column of text type
 * 
 * Performance Considerations:
 * - Minimal performance impact as it only performs a simple NULL check and assignment
 * - No additional queries or complex logic that could affect performance
 * 
 * Created: April 8, 2025
 */
