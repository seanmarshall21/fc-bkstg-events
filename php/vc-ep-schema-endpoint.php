<?php
/**
 * VC Event Properties — Schema REST Endpoint
 *
 * Exposes ACF field group definitions as JSON for any vc_* post type.
 * Consumed by vc-event-manager PWA to render dynamic FieldEditors.
 *
 * Route: /wp-json/vc/v1/schema/{post_type}
 *
 * Drop this file into the vc-event-properties plugin directory and
 * require it from the main plugin bootstrap file:
 *
 *   require_once plugin_dir_path(__FILE__) . 'includes/schema-endpoint.php';
 *
 * @package VC_Event_Properties
 */

if (!defined('ABSPATH')) {
    exit;
}

class VC_EP_Schema_Endpoint {

    const NAMESPACE = 'vc/v1';
    const CACHE_TTL = HOUR_IN_SECONDS;
    const CACHE_PREFIX = 'vc_ep_schema_';

    /**
     * ACF field type -> simplified app field type map.
     * App-side FieldEditor uses these to pick the right React input.
     */
    const TYPE_MAP = [
        'text'             => 'text',
        'textarea'         => 'textarea',
        'wysiwyg'          => 'wysiwyg',
        'number'           => 'number',
        'range'            => 'number',
        'url'              => 'url',
        'email'            => 'email',
        'password'         => 'text',
        'select'           => 'select',
        'checkbox'         => 'select',
        'radio'            => 'select',
        'button_group'     => 'select',
        'true_false'       => 'true_false',
        'date_picker'      => 'date_picker',
        'date_time_picker' => 'date_picker',
        'time_picker'      => 'time_picker',
        'color_picker'     => 'text',
        'image'            => 'image',
        'file'             => 'image',
        'gallery'          => 'image',
        'post_object'      => 'relationship',
        'relationship'     => 'relationship',
        'page_link'        => 'relationship',
        'taxonomy'         => 'taxonomy',
        'user'             => 'relationship',
        'group'            => 'group',
        'repeater'         => 'repeater',
        'flexible_content' => 'repeater',
        'clone'            => 'group',
    ];

    public static function init() {
        add_action('rest_api_init', [__CLASS__, 'register_routes']);
    }

    public static function register_routes() {
        register_rest_route(self::NAMESPACE, '/schema/(?P<post_type>[a-zA-Z0-9_-]+)', [
            'methods'             => 'GET',
            'callback'            => [__CLASS__, 'get_schema'],
            'permission_callback' => [__CLASS__, 'permission_check'],
            'args'                => [
                'post_type' => [
                    'required'          => true,
                    'sanitize_callback' => 'sanitize_key',
                ],
                'refresh' => [
                    'required' => false,
                    'type'     => 'boolean',
                ],
            ],
        ]);
    }

    /**
     * Require authenticated user with edit_posts capability.
     * Loosen this if the PWA needs public read access.
     */
    public static function permission_check(WP_REST_Request $request) {
        if (!is_user_logged_in()) {
            return new WP_Error('rest_forbidden', 'Authentication required.', ['status' => 401]);
        }
        if (!current_user_can('edit_posts')) {
            return new WP_Error('rest_forbidden', 'Insufficient permissions.', ['status' => 403]);
        }
        return true;
    }

    public static function get_schema(WP_REST_Request $request) {
        $post_type = $request->get_param('post_type');
        $refresh   = (bool) $request->get_param('refresh');

        if (!post_type_exists($post_type)) {
            return new WP_Error('invalid_post_type', "Post type '{$post_type}' not registered.", ['status' => 404]);
        }

        $cache_key = self::CACHE_PREFIX . $post_type;

        if (!$refresh) {
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return rest_ensure_response($cached);
            }
        }

        if (!function_exists('acf_get_field_groups')) {
            return new WP_Error('acf_missing', 'Advanced Custom Fields not active.', ['status' => 500]);
        }

        $field_groups = acf_get_field_groups(['post_type' => $post_type]);
        $schema = [
            'post_type'    => $post_type,
            'label'        => get_post_type_object($post_type)->labels->singular_name ?? $post_type,
            'groups'       => [],
            'generated_at' => current_time('c'),
        ];

        foreach ($field_groups as $group) {
            $fields = acf_get_fields($group['key']);
            $schema['groups'][] = [
                'key'    => $group['key'],
                'title'  => $group['title'],
                'fields' => self::normalize_fields($fields ?: []),
            ];
        }

        set_transient($cache_key, $schema, self::CACHE_TTL);

        return rest_ensure_response($schema);
    }

    /**
     * Recursively normalize ACF field definitions into the app schema shape.
     */
    protected static function normalize_fields(array $fields) {
        $out = [];
        foreach ($fields as $field) {
            $out[] = self::normalize_field($field);
        }
        return $out;
    }

    protected static function normalize_field(array $field) {
        $acf_type = $field['type'] ?? 'text';
        $app_type = self::TYPE_MAP[$acf_type] ?? 'text';

        $normalized = [
            'key'          => $field['key'] ?? '',
            'name'         => $field['name'] ?? '',
            'label'        => $field['label'] ?? '',
            'type'         => $app_type,
            'acf_type'     => $acf_type,
            'required'     => !empty($field['required']),
            'instructions' => $field['instructions'] ?? '',
            'placeholder'  => $field['placeholder'] ?? '',
            'default'      => $field['default_value'] ?? null,
        ];

        // Choices (select, checkbox, radio, button_group)
        if (in_array($acf_type, ['select', 'checkbox', 'radio', 'button_group'], true)) {
            $choices = $field['choices'] ?? [];
            $normalized['choices'] = [];
            foreach ($choices as $value => $label) {
                $normalized['choices'][] = [
                    'value' => (string) $value,
                    'label' => (string) $label,
                ];
            }
            $normalized['multiple'] = !empty($field['multiple']) || $acf_type === 'checkbox';
        }

        // Number constraints
        if (in_array($acf_type, ['number', 'range'], true)) {
            $normalized['min']  = isset($field['min']) ? $field['min'] : null;
            $normalized['max']  = isset($field['max']) ? $field['max'] : null;
            $normalized['step'] = isset($field['step']) ? $field['step'] : null;
        }

        // Text length constraints
        if (in_array($acf_type, ['text', 'textarea', 'url', 'email'], true)) {
            $normalized['maxlength'] = isset($field['maxlength']) ? $field['maxlength'] : null;
        }

        // Date/time formats
        if (in_array($acf_type, ['date_picker', 'date_time_picker', 'time_picker'], true)) {
            $normalized['display_format'] = $field['display_format'] ?? '';
            $normalized['return_format']  = $field['return_format'] ?? '';
        }

        // Image/file
        if (in_array($acf_type, ['image', 'file', 'gallery'], true)) {
            $normalized['return_format'] = $field['return_format'] ?? 'array';
            $normalized['mime_types']    = $field['mime_types'] ?? '';
            $normalized['multiple']      = $acf_type === 'gallery';
        }

        // Relationship / post_object / page_link
        if (in_array($acf_type, ['post_object', 'relationship', 'page_link'], true)) {
            $normalized['post_types']   = $field['post_type'] ?? [];
            $normalized['taxonomies']   = $field['taxonomy'] ?? [];
            $normalized['multiple']     = !empty($field['multiple']) || $acf_type === 'relationship';
            $normalized['return_format'] = $field['return_format'] ?? 'id';
            $normalized['min']          = $field['min'] ?? null;
            $normalized['max']          = $field['max'] ?? null;
        }

        // Taxonomy
        if ($acf_type === 'taxonomy') {
            $taxonomy = $field['taxonomy'] ?? '';
            $normalized['taxonomy']      = $taxonomy;
            $normalized['field_type']    = $field['field_type'] ?? 'checkbox';
            $normalized['multiple']      = in_array(($field['field_type'] ?? ''), ['multi_select', 'checkbox'], true);
            $normalized['return_format'] = $field['return_format'] ?? 'id';
            $normalized['terms']         = self::get_taxonomy_terms($taxonomy);
        }

        // User
        if ($acf_type === 'user') {
            $normalized['multiple'] = !empty($field['multiple']);
            $normalized['role']     = $field['role'] ?? [];
        }

        // True/false
        if ($acf_type === 'true_false') {
            $normalized['ui']      = !empty($field['ui']);
            $normalized['ui_on']   = $field['ui_on_text'] ?? '';
            $normalized['ui_off']  = $field['ui_off_text'] ?? '';
        }

        // Group: recurse into sub_fields
        if ($acf_type === 'group' || $acf_type === 'clone') {
            $normalized['sub_fields'] = self::normalize_fields($field['sub_fields'] ?? []);
            $normalized['layout']     = $field['layout'] ?? 'block';
        }

        // Repeater: recurse into sub_fields
        if ($acf_type === 'repeater') {
            $normalized['sub_fields'] = self::normalize_fields($field['sub_fields'] ?? []);
            $normalized['min']        = $field['min'] ?? null;
            $normalized['max']        = $field['max'] ?? null;
            $normalized['layout']     = $field['layout'] ?? 'table';
            $normalized['button_label'] = $field['button_label'] ?? 'Add Row';
        }

        // Flexible content: treat layouts as repeater variants
        if ($acf_type === 'flexible_content') {
            $layouts = [];
            foreach (($field['layouts'] ?? []) as $layout) {
                $layouts[] = [
                    'key'        => $layout['key'] ?? '',
                    'name'       => $layout['name'] ?? '',
                    'label'      => $layout['label'] ?? '',
                    'sub_fields' => self::normalize_fields($layout['sub_fields'] ?? []),
                ];
            }
            $normalized['layouts']      = $layouts;
            $normalized['button_label'] = $field['button_label'] ?? 'Add Layout';
        }

        // Conditional logic (pass through raw — app can interpret)
        if (!empty($field['conditional_logic'])) {
            $normalized['conditional_logic'] = $field['conditional_logic'];
        }

        return $normalized;
    }

    protected static function get_taxonomy_terms($taxonomy) {
        if (empty($taxonomy) || !taxonomy_exists($taxonomy)) {
            return [];
        }
        $terms = get_terms([
            'taxonomy'   => $taxonomy,
            'hide_empty' => false,
        ]);
        if (is_wp_error($terms)) {
            return [];
        }
        $out = [];
        foreach ($terms as $term) {
            $out[] = [
                'id'    => $term->term_id,
                'slug'  => $term->slug,
                'name'  => $term->name,
                'parent' => $term->parent,
            ];
        }
        return $out;
    }

    /**
     * Flush schema cache for a post type (or all).
     * Hook into ACF save to auto-invalidate.
     */
    public static function flush_cache($post_type = null) {
        if ($post_type) {
            delete_transient(self::CACHE_PREFIX . $post_type);
            return;
        }
        global $wpdb;
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                '_transient_' . self::CACHE_PREFIX . '%'
            )
        );
    }
}

VC_EP_Schema_Endpoint::init();

// Auto-invalidate cache when ACF field groups are saved
add_action('acf/update_field_group', function($group) {
    VC_EP_Schema_Endpoint::flush_cache();
});

add_action('acf/delete_field_group', function($group) {
    VC_EP_Schema_Endpoint::flush_cache();
});
