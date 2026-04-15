# Fix flattenSchemaFields: WP plugin returns 'groups', not 'field_groups'
with open('src/hooks/useSchema.js', 'r') as f:
    content = f.read()

content = content.replace(
    "  if (!schema?.field_groups) return [];\n  return schema.field_groups.reduce(",
    "  if (!schema?.groups) return [];\n  return schema.groups.reduce("
)

# Also fix the reference inside the reduce
content = content.replace(
    "    (acc, group) => acc.concat(group.fields || []),",
    "    (acc, group) => acc.concat(group.fields || []),"  # same, no change needed
)

with open('src/hooks/useSchema.js', 'w') as f:
    f.write(content)
print('done:', 'field_groups' not in content and 'schema.groups' in content)
