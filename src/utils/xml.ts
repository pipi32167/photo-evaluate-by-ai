
export function get_section(xml: string, section_name: string, keep_section_tag: boolean = false): string {
  const start_tag = `<${section_name}>`
  const end_tag = `</${section_name}>`
  const start_index = xml.indexOf(start_tag)
  const end_index = xml.indexOf(end_tag)
  let section = xml.slice(start_index, end_index + end_tag.length)
  if (!keep_section_tag) {
    section = section.replace(start_tag, '').replace(end_tag, '')
  }
  return section
}

