
/* eslint-disable react/prop-types */
import { useMemo } from "react";

const SERVER_URL = (import.meta.env.VITE_SERVER_API || "").replace(/\/+$/, "");

const getImageUrl = (src) => {
  if (!src) return "";

  // Keep absolute URLs unchanged
  if (/^https?:\/\//i.test(src)) {
    return src;
  }

  // Convert relative file-storage paths to backend URLs
  return `${SERVER_URL}/${src.replace(/^\/+/, "")}`;
};

export default function ContentRenderer({ html }) {
  const parsedContent = useMemo(() => {
    if (!html) return null;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const getTextAlign = (node) => {
      return node.style?.textAlign || "left";
    };

    const renderNode = (node, index) => {
      if (node.nodeType === 3) {
        // TEXT NODE
        return node.textContent;
      }

      if (node.nodeType !== 1) return null;

      const children = Array.from(node.childNodes).map((child, i) =>
        renderNode(child, i),
      );

      switch (node.tagName.toLowerCase()) {
        case "p":
          return (
            <p
              key={index}
              style={{
                margin: "0 0 12px 0",
                lineHeight: "1.6",
                textAlign: getTextAlign(node),
              }}
            >
              {children}
            </p>
          );

        case "h1":
          return (
            <h1
              key={index}
              style={{ margin: "16px 0 10px", textAlign: getTextAlign(node) }}
            >
              {children}
            </h1>
          );

        case "h2":
          return (
            <h2
              key={index}
              style={{ margin: "16px 0 10px", textAlign: getTextAlign(node) }}
            >
              {children}
            </h2>
          );

        case "h3":
          return (
            <h3
              key={index}
              style={{ margin: "16px 0 10px", textAlign: getTextAlign(node) }}
            >
              {children}
            </h3>
          );

        case "h4":
          return (
            <h4
              key={index}
              style={{ margin: "16px 0 10px", textAlign: getTextAlign(node) }}
            >
              {children}
            </h4>
          );

        case "h5":
          return (
            <h5
              key={index}
              style={{ margin: "16px 0 10px", textAlign: getTextAlign(node) }}
            >
              {children}
            </h5>
          );

        case "h6":
          return (
            <h6
              key={index}
              style={{ margin: "16px 0 10px", textAlign: getTextAlign(node) }}
            >
              {children}
            </h6>
          );

        case "blockquote":
          return (
            <blockquote
              key={index}
              style={{
                borderLeft: "4px solid #4A90E2",
                background: "#f7f9fc",
                padding: "10px 14px",
                margin: "16px 0",
                fontStyle: "italic",
                color: "#444",
              }}
            >
              {children}
            </blockquote>
          );

        case "strong":
          return <strong key={index}>{children}</strong>;

        case "em":
          return <em key={index}>{children}</em>;

        case "u":
          return <u key={index}>{children}</u>;

        case "br":
          return <br key={index} />;

        case "ul":
          return (
            <ul key={index} style={{ margin: "10px 0 10px 20px" }}>
              {children}
            </ul>
          );

        case "ol":
          return (
            <ol key={index} style={{ margin: "10px 0 10px 20px" }}>
              {children}
            </ol>
          );

        case "li":
          return <li key={index}>{children}</li>;

        case "div": {
          const align = node.style?.textAlign || "left";

          return (
            <div
              key={index}
              style={{
                textAlign: align,
                margin: "10px 0",
              }}
            >
              {Array.from(node.childNodes).map((child, i) =>
                renderNode(child, i),
              )}
            </div>
          );
        }

        case "img": {
          const styleWidth = node.style?.width
            ? parseInt(node.style.width.replace("px", ""), 10)
            : undefined;

          // Determine parent alignment
          const parentAlign =
            node.parentElement?.style?.textAlign || "left";

          // Resolve image URL using backend base URL
          const imageSrc = getImageUrl(node.getAttribute("src"));

          return (
            <div
              key={index}
              style={{
                textAlign: parentAlign,
                margin: "10px 0",
              }}
            >
              <img
                src={imageSrc}
                alt={node.getAttribute("alt") || ""}
                style={{
                  maxWidth: styleWidth ? `${styleWidth}px` : "100%",
                  width: "100%",
                  height: "auto",
                  objectFit: "contain",
                  borderRadius: "16px",
                  display: "inline-block",
                }}
              />
            </div>
          );
        }

        default:
          return <span key={index}>{children}</span>;
      }
    };

    return Array.from(doc.body.childNodes).map((node, i) =>
      renderNode(node, i),
    );
  }, [html]);

  return <div>{parsedContent}</div>;
}
