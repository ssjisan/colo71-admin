import { Text } from "slate";

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const serialize = (node) => {
  if (Text.isText(node)) {
    let string = escapeHtml(node.text);

    string = string.replace(/\n/g, "<br />");

    if (node.bold) string = `<strong>${string}</strong>`;
    if (node.italic) string = `<em>${string}</em>`;
    if (node.underline) string = `<u>${string}</u>`;

    return string;
  }

  const children = Array.isArray(node.children)
    ? node.children.map(serialize).join("")
    : "";

  const alignStyle = node.align ? ` style="text-align: ${node.align};"` : "";

  const imageWidth = node.width
    ? `width: ${Number(node.width)}px;`
    : "max-width: 100%;";

  const imageAlign = node.align || "left";

  switch (node.type) {
    case "paragraph":
      return children === "" ? "<br />" : `<p${alignStyle}>${children}</p>`;

    case "heading-one":
      return `<h1${alignStyle}>${children}</h1>`;

    case "heading-two":
      return `<h2${alignStyle}>${children}</h2>`;

    case "heading-three":
      return `<h3${alignStyle}>${children}</h3>`;

    case "heading-four":
      return `<h4${alignStyle}>${children}</h4>`;

    case "heading-five":
      return `<h5${alignStyle}>${children}</h5>`;

    case "heading-six":
      return `<h6${alignStyle}>${children}</h6>`;

    case "block-quote":
      return `<blockquote>${children}</blockquote>`;

    case "break":
      return "<br />";

    case "image": {
      const url = escapeHtml(node.url || "");

      return `
        <div style="text-align: ${imageAlign}; margin: 10px 0;">
          <img src="${url}" style="${imageWidth} height: auto;" />
        </div>
      `;
    }

    case "numbered-list":
      return `<ol${alignStyle}>${children}</ol>`;

    case "bulleted-list":
      return `<ul${alignStyle}>${children}</ul>`;

    case "list-item":
      return `<li>${children}</li>`;

    default:
      return children;
  }
};

export const serializeEditorValue = (value = []) => {
  return value.map(serialize).join("");
};
